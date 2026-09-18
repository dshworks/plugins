#!/usr/bin/env node
// Can the published shelf still be installed beside the dsh npm serves today?
//
// This site's whole promise is the install decision, and until 2026-09-04 it
// only ever asked whether a plugin declares an install path. It never asked
// whether that path still resolves.
//
// It usually does not, for a reason nobody hits until they hit it: npm semver
// never lets a PRERELEASE satisfy a caret with a different version tuple. dsh
// has only ever shipped prereleases, so `^0.1.1-rc.1` matches 0.1.1-rc.2 and
// stops dead — not 0.1.2-alpha.1, not 0.1.2-rc.1. `^0.1.2-alpha.1` does match
// 0.1.2-rc.1, because the tuple is the same. The rule is the tuple, not the
// caret, and it is invisible in a diff.
//
// The failure is quiet, which is why it survives. Two plugins with different
// stale ranges collide with ERESOLVE and you find out. One plugin alone does
// not: npm satisfies the stale range by hoisting the old `@deepseek-ai/dsh-*`
// copies to the root and pushing the harness's own into nested node_modules.
// The install succeeds, and the plugin imports a different harness than the
// host is running. Measured on one such package: 13 harness packages resolved
// to two versions at once, 691 files instead of 528, no warning.
//
// Method: for every npm name in the registry, read the latest version's
// manifest from registry.npmjs.org and test each `@deepseek-ai/dsh*` range in
// `peerDependencies` and `dependencies` against every published dsh version.
// No GitHub API budget, no clone. The abbreviated registry document omits
// `time`, so nothing here claims anything about dates.
//
// Output is committed to data/installability.json so the site builds offline.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import semver from "semver";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "data", "installability.json");
const REGISTRY = "https://registry.npmjs.org";
const HARNESS = /^@deepseek-ai\/dsh(-|$)/;
const CONCURRENCY = 24;

const json = async (url) => {
  const res = await fetch(url, { headers: { accept: "application/json", "user-agent": "dsh.works-installability" } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
};

/** Every npm name the registry lists, deduped. */
async function npmNames() {
  const url = "https://raw.githubusercontent.com/dshworks/awesome-dsh-plugins/main/data/plugins.json";
  const local = join(ROOT, "..", "awesome-dsh-plugins", "data", "plugins.json");
  const data = process.env.DATA_SOURCE === "local"
    ? JSON.parse(await readFile(local, "utf8"))
    : await json(url);
  return [...new Set(data.plugins.filter((p) => p.npm).map((p) => p.npm))];
}

/** The harness ranges one published package declares, or null if it declares none. */
async function ranges(name) {
  const d = await json(`${REGISTRY}/${encodeURIComponent(name).replace("%40", "@")}`);
  const latest = d["dist-tags"]?.latest;
  const v = d.versions?.[latest];
  if (!v) return null;
  const all = { ...(v.dependencies ?? {}), ...(v.peerDependencies ?? {}) };
  const harness = Object.fromEntries(Object.entries(all).filter(([k]) => HARNESS.test(k)));
  return Object.keys(harness).length ? { version: latest, ranges: harness } : null;
}

const dsh = await json(`${REGISTRY}/@deepseek-ai/dsh`);
const versions = Object.keys(dsh.versions).sort(semver.compare);
const latest = dsh["dist-tags"].latest;

const names = await npmNames();
const declaring = [];
let unreadable = 0;

const queue = [...names];
await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) {
    const name = queue.pop();
    try {
      const r = await ranges(name);
      if (r) declaring.push({ name, ...r });
    } catch { unreadable += 1 }
  }
}));

/** Does every harness range in `entry` admit dsh version `v`? */
const admits = (entry, v) => Object.values(entry.ranges).every((r) => semver.satisfies(v, r));

const current = declaring.filter((e) => admits(e, latest));
const neverAny = declaring.filter((e) => !versions.some((v) => admits(e, v)));
const stuckOn010 = declaring.filter((e) => {
  const ok = versions.filter((v) => admits(e, v));
  return ok.length > 0 && ok.every((v) => v.startsWith("0.1.0"));
});
const wildcard = declaring.filter((e) => Object.values(e.ranges).some((r) => r === "*" || r === "" || r === "latest"));

// The same question asked forward. npm publishes ahead of the `latest` tag —
// on the day this was added, `latest` was 0.1.2-rc.1 and 0.1.5-alpha.1 was
// already on the registry. Because the rule is the TUPLE, the day the tag
// moves to a new tuple every range written against the old one stops
// resolving at once. This counts who survives that move, and it is the number
// that says whether the shelf is one release away from breaking or already
// broken.
const newest = versions.at(-1);
const admitsNewest = declaring.filter((e) => admits(e, newest));

// Our own four, measured by the same rule and named. The page used to say
// "three of the four plugins we ship were in the broken column until
// {measured}" -- a count typed once on 2026-09-04 with the census date glued
// on, so on 2026-09-17 it read as though they had just been fixed while all
// four still declared ^0.1.2-rc.1 against a 0.1.5-rc.2 `latest`. The npm
// names are read out of src/lib/ours.ts, the list both surfaces render, so a
// fifth plugin is measured the day it is listed.
const oursSrc = await readFile(join(ROOT, "src", "lib", "ours.ts"), "utf8");
const oursNames = [...oursSrc.matchAll(/\bnpm:\s*"([^"]+)"/g)].map((m) => m[1]);
if (!oursNames.length) throw new Error("src/lib/ours.ts lists no npm names; the ours census would be empty");
const ours = [];
for (const name of oursNames) {
  const r = await ranges(name);
  ours.push({
    name,
    version: r?.version ?? null,
    admitsLatest: r ? admits(r, latest) : null,
    admitsNewest: r ? admits(r, newest) : null,
  });
}

await writeFile(OUT, `${JSON.stringify({
  measured: new Date().toISOString().slice(0, 10),
  method: "registry.npmjs.org latest manifest per npm name; semver.satisfies over every published @deepseek-ai/dsh version",
  dshLatest: latest,
  dshVersions: versions,
  npmNames: names.length,
  unreadable,
  declaring: declaring.length,
  current: current.length,
  dshNewest: newest,
  admitsNewest: admitsNewest.length,
  stuckOn010: stuckOn010.length,
  neverAny: neverAny.length,
  wildcard: wildcard.length,
  ours,
}, null, 2)}\n`);

console.log(`installability: ${current.length} of ${declaring.length} declaring packages admit dsh ${latest}`);
console.log(`  stuck on the 0.1.0 line: ${stuckOn010.length}, satisfied by no published dsh: ${neverAny.length}, wildcard: ${wildcard.length}`);
console.log(`  and ${admitsNewest.length} admit ${newest}, the newest published version — what the tag moving would leave standing`);
console.log(`  ours: ${ours.map((o) => `${o.name}@${o.version} ${o.admitsLatest ? "ok" : "BROKEN"}`).join(", ")}`);
