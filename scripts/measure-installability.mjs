#!/usr/bin/env node
// Which published dsh plugins will dsh itself refuse?
//
// CORRECTION, 2026-09-29. Until this date the script modelled a plugin
// install as one fresh npm tree under npm's prerelease rule (a caret never
// matches a different major.minor.patch tuple, and npm installs peers at the
// highest match). The front page built "Most of the shelf no longer installs"
// on that model, and said a stale plugin splits the harness into two versions.
// dsh does not install plugins that way, so those were properties of the
// proxy, not of anything a user ran. What dsh does, read at the tags
// dsh-v0.1.7-rc.1 and dsh-v0.2.0-rc.1 in deepseek-ai/deepseek-harness
// (line numbers are identical at both unless two are given as rc.1/0.2.0-rc.1):
//
// INSTALL. `dsh plugin --profile <p> add <spec>` (apps/cli/src/plugin.ts:62-84)
//   runs pnpm inside the profile directory
//   (packages/boot/plugin-manager/src/operations.ts:304 / :357), and the
//   profile's pnpm-workspace.yaml says `nodeLinker: hoisted` and
//   `autoInstallPeers: false` (packages/boot/app-boot/src/profile.ts:208-209 /
//   :233-234; the same two lines at every tag back to dsh-v0.1.0-rc.7, the
//   oldest in the repo). Peers are never installed into a profile.
//
// RESOLVE. An import found physically in the profile's node_modules is loaded
//   from there; anything else is routed to the running installation's copy
//   (packages/boot/app-boot/src/profile-resolution/resolver.ts:468-510). The
//   installation supplies `@deepseek-ai/dsh` and the closure of its
//   dependencies AND peerDependencies (profile.ts:333-388 / :358-413). So a
//   peer range cannot split anything. A package a plugin lists in
//   `dependencies` can: pnpm puts a copy in the profile, and the resolver
//   prefers that copy over the host's.
//
// THE GATE. packages/boot/app-boot/src/plugin-compatibility.ts:61-88,
//   byte-identical at dsh-v0.1.7-rc.1, dsh-v0.1.7-rc.2 and dsh-v0.2.0-rc.1:
//     :68  no `peerDependencies` field at all -> admitted, nothing read
//     :69  a `peerDependencies` that is not an object -> throws (refused)
//     :72  ANY peer whose range is not a string -> throws (refused); this runs
//          before the name filter, so it applies to non-dsh peers too
//     :75  only `@deepseek-ai/dsh` and `@deepseek-ai/dsh-*` are checked;
//          `dependencies`, `engines.dsh` and every other peer are not read
//     :76  `workspace:^`, `workspace:~`, `workspace:*` mean "this runtime"
//     :77  refused if the range is empty, or if
//          semver.satisfies(runtime, range, { includePrerelease: true }) is
//          false -- so `^0.1.5-rc.1` admits 0.1.7-rc.2 and refuses
//          0.2.0-rc.1, and a string that is not a range (`latest`) refuses
//     :84-86 an exact name@version exemption for the exact runtime admits it
//          anyway (`dsh plugin allow-version ... --accept-risk`, plugin.ts:78)
//   It runs before pnpm on `add` and installs nothing when it refuses
//   (operations.ts:291-298 / :344-351, reading `pnpm view <spec> name version
//   peerDependencies`), again after pnpm for what the run changed, with a
//   rollback (operations.ts:423-448 / :479-504), and at profile startup, where
//   a refused row is disabled with a `dsh: disabling profile plugin` line on
//   stderr (packages/boot/app-boot/src/compatibility-preflight.ts:74-83, :105).
//   `engines` is read by no .ts file outside tests at either tag.
//
// BEFORE THE GATE. plugin-compatibility.ts first appears in dsh-v0.1.7-rc.1
//   (commit 2c67633990, 2026-09-23); it is absent at dsh-v0.1.7-alpha.2 and
//   every earlier tag. On those hosts no dsh code reads a plugin's range.
//
// Method: for every npm name in the registry, read the manifest npm serves
// for its `latest` tag and apply the gate above, line for line, to the dsh
// versions on npm's `latest` and `next` tags. The manifest comes out of the
// abbreviated packument pnpm itself resolves from; its peerDependencies and
// dependencies were identical to registry.npmjs.org/<name>/latest (what
// `pnpm view` reads) on 298 of 298 packages on 2026-09-29, and unlike that
// endpoint it is served from npm's CDN -- the first nightly run against
// /latest spent its whole 12-minute step budget and wrote nothing. The census
// reads each package's own manifest; a bundle's component manifests, which
// the post-install check also reads, are not fetched. Exemptions are per
// user and per profile, so none are assumed.
//
// Separately, it counts packages whose `dependencies` name an `@deepseek-ai/*`
// package the host on `latest` supplies, walking the host's closure within the
// `@deepseek-ai` scope only. That is the case that can put a second copy of a
// harness package in a profile. It is a count of manifests, not of observed
// breakage.
//
// Output is committed to data/installability.json so the site builds offline.
// The deploy re-runs this every night.

import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import semver from "semver";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "data", "installability.json");
const REGISTRY = "https://registry.npmjs.org";
const REGISTRY_LIST = "https://raw.githubusercontent.com/dshworks/awesome-dsh-plugins/main/data/plugins.json";
const HARNESS_SRC = "https://github.com/deepseek-ai/deepseek-harness/blob";
// The first tag that carries plugin-compatibility.ts. Hosts before it had no gate.
const GATE_SINCE = "0.1.7-rc.1";
const GATE_TAG = "dsh-v0.2.0-rc.1";
const GATE_FILE = "packages/boot/app-boot/src/plugin-compatibility.ts";
// UPDATE, 2026-10-17. dsh-v0.2.1-alpha.4 rewrote the gate (3de3a977e0): an own
// `engines.dsh` range decides alone and the dsh peers are ignored; the peer
// rule above applies only when `engines.dsh` is absent. A non-object
// `engines`, or a non-string `engines.dsh`, refuses the package. `pnpm view`
// on install now asks for `engines` as well (plugin-manager/src/operations.ts
// :178). The file is byte-identical at alpha.4, alpha.5, rc.1 and rc.2, and the
// upgrade guide sits under docs/upgrade-guide/v0.2.1-alpha.3/plugin-engines-dsh/
// (the directory names the release you upgrade FROM).
const ENGINES_SINCE = "0.2.1-alpha.4";
const ENGINES_TAG = "dsh-v0.2.1-rc.2";
// sha256 of GATE_FILE for each rule gate() mirrors: the peer rule at
// dsh-v0.1.7-rc.1 through dsh-v0.2.1-alpha.3, the engines rule from
// dsh-v0.2.1-alpha.4 on. Every gated host's copy is fetched and hashed on each
// run; one that differs from its rule's hash is written as `mirrored: false`
// and scripts/check-claims.mjs fails the build, because the page would be
// quoting a rule dsh may no longer apply. To clear it, re-read the new file,
// bring gate() in line, then add or update the hash here.
const GATE_SHA256 = {
  peers: "ab688efec2beb165e2a0917b36fa72bfd5c8b96b8be3a1e6121b76ba24748135",
  engines: "3aaddccc788734dbcea920f078ae7f8209f57b3330e8431d2f4a5936cf65558f",
};
const ruleOf = (version) => (semver.gte(version, ENGINES_SINCE) ? "engines" : "peers");
const CONCURRENCY = 16;
const ABBREVIATED = "application/vnd.npm.install-v1+json";

// npm answers a burst with 429. A 429 counted as "unreadable" silently shrinks
// the denominator, so it is retried; after that, anything but a 404 fails the
// run and the committed census stays (check-claims turns it red at 14 days).
let retries = 0;
const json = async (url, accept = "application/json") => {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { accept, "user-agent": "dsh.works-installability" } });
    if (res.ok) return res.json();
    if (res.status === 404) throw Object.assign(new Error(`${url} -> 404`), { notFound: true });
    if (attempt >= 6 || !(res.status === 429 || res.status >= 500)) throw new Error(`${url} -> ${res.status}`);
    retries += 1;
    const wait = Math.min(Number(res.headers.get("retry-after")) * 1000 || 1000 * 2 ** attempt, 20_000);
    await new Promise((r) => setTimeout(r, wait));
  }
};

/** fn over items, CONCURRENCY at a time; results in input order. */
async function pool(items, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i]); }
  }));
  return out;
}

/** The manifest npm serves for `name`'s `latest` tag, or null if it serves none. */
async function latestManifest(name) {
  const doc = await json(pkgUrl(name), ABBREVIATED);
  return doc.versions?.[doc["dist-tags"]?.latest] ?? null;
}
const pkgUrl = (name) => `${REGISTRY}/${encodeURIComponent(name).replace("%40", "@")}`;

/** Every npm name the registry lists, deduped. */
async function npmNames() {
  const local = join(ROOT, "..", "awesome-dsh-plugins", "data", "plugins.json");
  const data = process.env.DATA_SOURCE === "local"
    ? JSON.parse(await readFile(local, "utf8"))
    : await json(REGISTRY_LIST);
  return [...new Set(data.plugins.filter((p) => p.npm).map((p) => p.npm))];
}

const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
const isDshName = (name) => name === "@deepseek-ai/dsh" || name.startsWith("@deepseek-ai/dsh-");
const WORKSPACE = ["workspace:^", "workspace:~", "workspace:*"];

/**
 * plugin-compatibility.ts without the exemption lookup: the peer rule at
 * dsh-v0.2.0-rc.1 :61-88, and from ENGINES_SINCE the engines rule at
 * dsh-v0.2.1-rc.2 :55-74 in front of it.
 * @returns undefined when admitted, else the unmet requirements (keyed
 *   `engines.dsh` or by peer name, as dsh's own `requirements` record), or a
 *   reason when the gate throws.
 */
function gate(manifest, runtime) {
  if (ruleOf(runtime) === "engines" && Object.hasOwn(manifest, "engines")) {
    const engines = manifest.engines;
    if (!isObject(engines)) return { malformed: "engines is not an object" };     // rc.2 :56
    if (Object.hasOwn(engines, "dsh")) {
      const range = engines.dsh;
      if (typeof range !== "string") return { malformed: "engines.dsh is not a string" }; // :59
      // No workspace: exception here; dsh calls it unmet like any non-range.
      return range.trim() !== "" && semver.satisfies(runtime, range, { includePrerelease: true })
        ? undefined
        : { requirements: { "engines.dsh": range }, by: "engines" };              // :60
    }
  }
  if (!Object.hasOwn(manifest, "peerDependencies")) return undefined;              // :68
  const peers = manifest.peerDependencies;
  if (!isObject(peers)) return { malformed: "peerDependencies is not an object" };  // :69
  const refused = {};
  for (const [name, range] of Object.entries(peers)) {
    if (typeof range !== "string") return { malformed: `peerDependencies[${name}] is not a string` }; // :72-74
    if (!isDshName(name)) continue;                                                // :75
    const requirement = WORKSPACE.includes(range) ? runtime : range;               // :76
    if (requirement.trim() === "" || !semver.satisfies(runtime, requirement, { includePrerelease: true })) {
      refused[name] = range;                                                       // :77-78
    }
  }
  return Object.keys(refused).length ? { requirements: refused, by: "peers" } : undefined; // :81
}

/** The `engines.dsh` a manifest declares, if it is a string; the rule from ENGINES_SINCE reads it first. */
const enginesDsh = (m) => (isObject(m.engines) && typeof m.engines.dsh === "string" ? m.engines.dsh : undefined);

/** The dsh peer ranges a manifest declares, as the gate would see them. */
const dshPeers = (m) => (isObject(m.peerDependencies)
  ? Object.fromEntries(Object.entries(m.peerDependencies).filter(([k]) => isDshName(k)))
  : {});

/**
 * The `@deepseek-ai/*` names the host at `version` supplies to every profile.
 * Breadth-first, one level at a time: a level is fetched in parallel and then
 * merged in order, so the result is the same as a one-at-a-time walk.
 */
async function hostSupplies(version) {
  const seen = new Map([["@deepseek-ai/dsh", version]]);
  let level = [["@deepseek-ai/dsh", version]];
  while (level.length) {
    const manifests = await pool(level, async ([name, range]) => {
      const doc = await json(pkgUrl(name), ABBREVIATED);
      const v = semver.maxSatisfying(Object.keys(doc.versions), range, { includePrerelease: true })
        ?? doc["dist-tags"]?.[range];
      return (v && doc.versions[v]) || null;
    });
    const next = [];
    for (const m of manifests) {
      if (!m) continue;
      // profile.ts:333-334 / :358-359: dependencies and peerDependencies both.
      for (const [dep, r] of Object.entries({ ...(m.dependencies ?? {}), ...(m.peerDependencies ?? {}) })) {
        if (!dep.startsWith("@deepseek-ai/") || seen.has(dep)) continue;
        seen.set(dep, r);
        next.push([dep, r]);
      }
    }
    level = next;
  }
  return new Set(seen.keys());
}

const dsh = await json(pkgUrl("@deepseek-ai/dsh"));
const versions = Object.keys(dsh.versions).sort(semver.compare);
const tags = dsh["dist-tags"];
// `next` is only a second host when it is ahead of `latest`; the day 0.2.0
// reaches `latest` the forward question disappears until npm serves another.
const hosts = [{ tag: "latest", version: tags.latest }];
if (tags.next && semver.gt(tags.next, tags.latest)) hosts.push({ tag: "next", version: tags.next });
for (const h of hosts) {
  h.gated = semver.gte(h.version, GATE_SINCE);
  if (h.gated) h.rule = ruleOf(h.version);
}

for (const h of hosts.filter((x) => x.gated)) {
  const url = `https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/dsh-v${h.version}/${GATE_FILE}`;
  const res = await fetch(url);
  const sha256 = res.ok ? createHash("sha256").update(Buffer.from(await res.arrayBuffer())).digest("hex") : null;
  h.gateSource = { url, sha256, mirrored: sha256 === GATE_SHA256[h.rule] };
}

let t0 = Date.now();
const supplied = await hostSupplies(tags.latest);
console.log(`host closure: ${supplied.size} @deepseek-ai names under dsh ${tags.latest} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

t0 = Date.now();
const names = await npmNames();
const rows = [];
let unreadable = 0;
await pool(names, async (name) => {
  let m = null;
  try {
    m = await latestManifest(name);
  } catch (err) {
    // A name the registry lists that npm does not serve. Anything else is ours to fix.
    if (!err.notFound) throw err;
  }
  if (!m) { unreadable += 1; return; }
  const shadows = Object.keys(isObject(m.dependencies) ? m.dependencies : {}).filter((d) => supplied.has(d));
  rows.push({
    name,
    version: m.version,
    peers: dshPeers(m),
    engines: enginesDsh(m),
    verdicts: Object.fromEntries(hosts.map((h) => [h.tag, h.gated ? gate(m, h.version) : undefined])),
    shadows,
  });
});
console.log(`manifests: ${rows.length} of ${names.length} in ${((Date.now() - t0) / 1000).toFixed(1)}s, ${retries} retries after 429/5xx`);

// A dsh range is a dsh peer or, read by hosts from ENGINES_SINCE, `engines.dsh`.
const declaring = rows.filter((r) => Object.keys(r.peers).length > 0 || r.engines !== undefined);
// Declare `engines.dsh`: on a host from ENGINES_SINCE that range alone decides.
const enginesDeclared = rows.filter((r) => r.engines !== undefined);
const noRange = rows.length - declaring.length;
const refusedOn = (tag) => rows.filter((r) => r.verdicts[tag] !== undefined);
const published = hosts.map((h) => {
  const refused = refusedOn(h.tag);
  return {
    tag: h.tag,
    version: h.version,
    gated: h.gated,
    admitted: rows.length - refused.length,
    refused: refused.length,
    // Refused because one refusing range pins an exact dsh version.
    pinned: refused.filter((r) => Object.values(r.verdicts[h.tag].requirements ?? {}).some((x) => semver.valid(x))).length,
    // Refused by an `engines.dsh` range, which only hosts from ENGINES_SINCE read.
    byEngines: refused.filter((r) => r.verdicts[h.tag].by === "engines").length,
    // Refused because the gate throws on the manifest, not because of a range.
    malformed: refused.filter((r) => r.verdicts[h.tag].malformed).length,
    ...(h.gated ? { rule: h.rule } : {}),
    ...(h.gateSource ? { gateSource: h.gateSource } : {}),
  };
});
const next = hosts.find((h) => h.tag === "next");
// Admitted today, refused by the version already on `next`: what moving the tag would refuse.
const cliffRows = next ? rows.filter((r) => !r.verdicts.latest && r.verdicts.next) : null;
const cliff = cliffRows ? cliffRows.length : null;
// Why they fall: an `engines.dsh` the older host never read, or a dsh peer
// range that stops short of `next` (counted again when it is an exact pin).
const cliffCause = cliffRows && {
  engines: cliffRows.filter((r) => r.verdicts.next.by === "engines").length,
  peers: cliffRows.filter((r) => r.verdicts.next.by === "peers").length,
  pinned: cliffRows.filter((r) => Object.values(r.verdicts.next.requirements ?? {}).some((x) => semver.valid(x))).length,
  malformed: cliffRows.filter((r) => r.verdicts.next.malformed).length,
};

const shadowing = rows.filter((r) => r.shadows.length);
const byShadow = {};
for (const r of shadowing) for (const d of r.shadows) byShadow[d] = (byShadow[d] ?? 0) + 1;

// Our own four, measured by the same rule and named. Names are read out of
// src/lib/ours.ts, the list both surfaces render, so a fifth plugin is
// measured the day it is listed.
const oursSrc = await readFile(join(ROOT, "src", "lib", "ours.ts"), "utf8");
const oursNames = [...oursSrc.matchAll(/\bnpm:\s*"([^"]+)"/g)].map((m) => m[1]);
if (!oursNames.length) throw new Error("src/lib/ours.ts lists no npm names; the ours census would be empty");
const ours = [];
for (const name of oursNames) {
  const m = await latestManifest(name);
  if (!m) throw new Error(`npm serves no latest manifest for ${name}, which src/lib/ours.ts lists as ours`);
  ours.push({
    name,
    version: m.version,
    peers: dshPeers(m),
    ...(enginesDsh(m) !== undefined ? { engines: enginesDsh(m) } : {}),
    ...Object.fromEntries(hosts.map((h) => [h.tag, h.gated ? (gate(m, h.version) ? "refused" : "admitted") : "ungated"])),
    shadows: Object.keys(m.dependencies ?? {}).filter((d) => supplied.has(d)),
  });
}

const src = (file, lines) => `${HARNESS_SRC}/${GATE_TAG}/${file}#${lines}`;
const now = new Date();
await writeFile(OUT, `${JSON.stringify({
  measured: now.toISOString().slice(0, 10),
  measuredAt: now.toISOString(),
  method: "npm's latest manifest for every npm name in the registry; dsh's own compatibility gate "
    + "(plugin-compatibility.ts, semver.satisfies with includePrerelease; engines.dsh first from "
    + `${ENGINES_SINCE}) applied to the dsh versions on npm's latest and next tags; no exemptions assumed`,
  sources: {
    registry: REGISTRY_LIST,
    npm: `${REGISTRY}/<name> (abbreviated packument, its dist-tags.latest version)`,
    gate: src("packages/boot/app-boot/src/plugin-compatibility.ts", "L61-L88"),
    install: src("packages/boot/plugin-manager/src/operations.ts", "L332-L357"),
    profile: src("packages/boot/app-boot/src/profile.ts", "L226-L235"),
    resolver: src("packages/boot/app-boot/src/profile-resolution/resolver.ts", "L468-L510"),
    startup: src("packages/boot/app-boot/src/compatibility-preflight.ts", "L74-L83"),
    gateCommit: "https://github.com/deepseek-ai/deepseek-harness/commit/2c67633990",
    enginesGate: `${HARNESS_SRC}/${ENGINES_TAG}/${GATE_FILE}#L55-L74`,
    enginesCommit: "https://github.com/deepseek-ai/deepseek-harness/commit/3de3a977e0",
  },
  gateSince: GATE_SINCE,
  enginesSince: ENGINES_SINCE,
  dshTags: tags,
  dshVersions: versions,
  ungatedVersions: versions.filter((v) => semver.lt(v, GATE_SINCE)).length,
  npmNames: names.length,
  unreadable,
  packages: rows.length,
  declaring: declaring.length,
  noRange,
  engines: enginesDeclared.length,
  hosts: published,
  cliff,
  cliffCause,
  shadow: {
    host: tags.latest,
    supplied: supplied.size,
    packages: shadowing.length,
    harness: shadowing.filter((r) => r.shadows.some(isDshName)).length,
    // A dsh-* package in dependencies and no dsh peer: the gate admits these
    // without reading anything, and they bring their own copy of the harness.
    unseen: shadowing.filter((r) => r.shadows.some(isDshName) && !Object.keys(r.peers).length && r.engines === undefined).length,
    // The ten most listed, of `packages`.
    names: Object.entries(byShadow).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, count]) => ({ name, count })),
  },
  ours,
}, null, 2)}\n`);

for (const h of published) {
  console.log(`installability: dsh ${h.version} (${h.tag}) refuses ${h.refused} of ${rows.length} packages`
    + `${h.malformed ? ` (${h.malformed} for a malformed manifest)` : ""}; `
    + `${h.gated ? `gate ${h.gateSource.mirrored ? "matches the mirrored source" : "SOURCE CHANGED OR MISSING"}` : "NO GATE"}`);
}
console.log(`  ${declaring.length} declare a dsh range (peer or engines.dsh); ${noRange} declare none and the gate reads nothing`);
console.log(`  ${enginesDeclared.length} declare engines.dsh, which decides alone from dsh ${ENGINES_SINCE}`);
if (cliff !== null) {
  console.log(`  ${cliff} admitted on latest are refused on next: ${cliffCause.engines} by engines.dsh, `
    + `${cliffCause.peers} by a dsh peer (${cliffCause.pinned} pinned), ${cliffCause.malformed} malformed`);
}
console.log(`  ${shadowing.length} list a host-supplied @deepseek-ai package in dependencies (${supplied.size} supplied by ${tags.latest})`);
console.log(`  ours: ${ours.map((o) => `${o.name}@${o.version} ${hosts.map((h) => `${h.tag}=${o[h.tag]}`).join(" ")}`).join(", ")}`);
if (unreadable) console.log(`  unreadable: ${unreadable}`);
