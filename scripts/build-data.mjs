#!/usr/bin/env node
// Build-time data pass. The registries are the source of truth; this script
// projects them into what the decision pages actually need and nothing else.
//
// Why a projection and not the raw file: data/plugins.json is 3.2 MB, most of
// which is fields no reader of a decision page ever sees. The Worker bundle has
// a hard size limit, and shipping a megabyte of unread JSON to the edge to
// render one page is the kind of waste that turns into a rewrite later.
//
// Everything here is derived from data that already exists. No field is
// invented, estimated, or scored — if we cannot point at where a number came
// from, it does not go in the file.
//
// Env: DATA_SOURCE=local reads the sibling checkouts instead of the network.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TODAY = new Date().toISOString().slice(0, 10);
const LOCAL = process.env.DATA_SOURCE === "local";

const REMOTE = {
  plugins: "https://raw.githubusercontent.com/dshworks/awesome-dsh-plugins/main/data/plugins.json",
  themes: "https://raw.githubusercontent.com/dshworks/awesome-dsh-themes/main/data/themes.json",
};
const LOCAL_PATHS = {
  plugins: join(ROOT, "../awesome-dsh-plugins/data/plugins.json"),
  themes: join(ROOT, "../awesome-dsh-themes/data/themes.json"),
};

async function load(which) {
  if (LOCAL) return JSON.parse(readFileSync(LOCAL_PATHS[which], "utf8"));
  const res = await fetch(REMOTE[which], { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`${which}: HTTP ${res.status}`);
  return res.json();
}

// --- derivations ------------------------------------------------------------

const days = (iso) => (iso ? Math.round((Date.parse(TODAY) - Date.parse(iso)) / 86400000) : null);

// dsh is a developer preview that has already removed one manifest format with
// no migration. "Last pushed" is the only maintenance signal in the data, and
// it is a fact, not a score — so the buckets are named after what was observed,
// never after a judgment ("healthy", "quality", "grade A").
function pulse(pushedAt) {
  const d = days(pushedAt);
  if (d === null) return { band: "unknown", days: null };
  if (d <= 14) return { band: "this-fortnight", days: d };
  if (d <= 60) return { band: "this-quarter", days: d };
  if (d <= 180) return { band: "this-half", days: d };
  return { band: "cold", days: d };
}

// `evidence` is `path#key`. The link has to land on the file, and the key has
// to stay visible as a label, or the reader does not know what to look for.
function proof(entry) {
  if (!entry.evidence) return null;
  const hash = entry.evidence.indexOf("#");
  if (hash < 1) return null;
  const path = entry.evidence.slice(0, hash);
  const key = entry.evidence.slice(hash + 1);
  return { path, key, url: `https://github.com/${entry.repo}/blob/HEAD/${path}` };
}

// --- run --------------------------------------------------------------------

const [pluginsFile, themesFile] = await Promise.all([load("plugins"), load("themes")]);
const raw = pluginsFile.plugins ?? [];
const themes = themesFile.themes ?? [];

const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const takenSlugs = new Set();
const entries = raw.map((p) => {
  let s = slug(p.name);
  while (takenSlugs.has(s)) s = `${s}-${slug(p.repo.split("/")[0])}`;
  takenSlugs.add(s);
  return {
    slug: s,
    name: p.name,
    repo: p.repo,
    path: p.path,
    npm: p.npm,
    description: p.description,
    category: p.category,
    tags: p.tags ?? [],
    stars: p.stars ?? 0,
    pushedAt: p.pushedAt,
    official: p.official === true,
    status: p.status,
    verifiedAgainst: p.verifiedAgainst,
    lastVerified: p.lastVerified,
    proof: proof(p),
    pulse: pulse(p.pushedAt),
  };
});

// The primary tag, for the "what else carries this" panel. A plugin usually
// carries several; the rarest one is the most specific thing it claims to be,
// which beats the first tag in the array (that is just alphabetical).
//
// This is a TAG, not a job, and the site says so. 451 entries carry `memory`
// and they do not all do the same thing — a context-insight panel, a shell
// bridge and a session-deleter all land there. Calling that "451 plugins that
// do this job" would be the same unfalsifiable overclaim this registry exists
// to avoid. Tighter grouping is real work; misnaming the loose one is a lie.
const tagCount = new Map();
for (const e of entries) for (const t of e.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
for (const e of entries) {
  e.tag = e.tags.length
    ? e.tags.slice().sort((a, b) => (tagCount.get(a) ?? 0) - (tagCount.get(b) ?? 0))[0]
    : null;
}

// Grouped by primary tag, ordered by what a reader actually wants to know
// first: is anyone still working on it. Stars break ties; stars alone would
// just reproduce the popularity ranking every other directory already prints.
const byTag = new Map();
for (const e of entries) {
  if (!e.tag) continue;
  if (!byTag.has(e.tag)) byTag.set(e.tag, []);
  byTag.get(e.tag).push(e);
}
for (const [, list] of byTag) {
  list.sort((a, b) => (a.pulse.days ?? 1e9) - (b.pulse.days ?? 1e9) || b.stars - a.stars);
}

// The tag lists are an index, not a copy. Embedding five sibling records on
// every entry took the output from 1.5 MB to 10.8 MB — measured, which is why
// it is not the design.
const bySlug = new Map(entries.map((e) => [e.slug, e]));
const tags = [...byTag.entries()]
  .map(([tag, list]) => ({ tag, count: list.length, order: list.map((e) => e.slug) }))
  .sort((a, b) => b.count - a.count);

// --- emit -------------------------------------------------------------------
//
// Three shapes, because they have three different readers:
//
//   index.json        the browser, for search. Every entry, smallest useful form.
//   p/<slug>.json     the Worker, for one decision page. Fetched per request
//                     through the ASSETS binding, so it never enters the bundle.
//   tags/<tag>.json   the Worker, for "what else carries this tag".
//
// The whole set is ~4 MB. Bundling it into the Worker would blow the 3 MB
// script limit; putting it in KV would add a service to keep in sync with git
// for data that is already static. Static assets are the honest fit: same
// deploy, same version, no second source of truth.

const OUT = join(ROOT, "public/_data");
mkdirSync(join(OUT, "p"), { recursive: true });
mkdirSync(join(OUT, "tags"), { recursive: true });

const write = (rel, value) => {
  const json = JSON.stringify(value);
  writeFileSync(join(OUT, rel), json);
  return json.length;
};

const meta = {
  built: TODAY,
  source: LOCAL ? "local checkout" : "dshworks registries",
  // The newest release anything was checked against, not whichever entry
  // sorted first — that was reporting rc.5 while the registry was on rc.6.
  verifiedAgainst: [...new Set(entries.map((e) => e.verifiedAgainst).filter(Boolean))].sort().pop() ?? null,
  counts: {
    plugins: entries.length,
    withProof: entries.filter((e) => e.proof).length,
    npm: entries.filter((e) => e.npm).length,
    themes: themes.length,
    tags: tags.length,
    // Entries whose repository stopped resolving. Counted and published rather
    // than quietly dropped: "6,290 plugins" with 59 dead ones inside it is a
    // number doing exactly what this site accuses other directories of.
    gone: entries.filter((e) => e.status === "broken").length,
  },
  tags: tags.map(({ tag, count }) => ({ tag, count })),
};

// Search index rows are tuples, not objects: 6,290 objects with eight named
// keys each is ~400 KB of repeated key names on the wire for no reader.
// Descriptions are cut to one line's worth for the same reason — on a word
// boundary, because "Default whale, four skins, four silent states. Not a"
// reads as a bug, and a list of them reads as a broken site.
const oneLine = (text) => {
  const s = (text ?? "").trim();
  if (s.length <= 96) return s;
  const cut = s.slice(0, 96);
  const at = Math.max(cut.lastIndexOf(" "), cut.lastIndexOf("，"), cut.lastIndexOf("。"), cut.lastIndexOf("、"));
  return `${(at > 60 ? cut.slice(0, at) : cut).replace(/[\s,;:·、，。—-]+$/, "")}…`;
};
const indexBytes = write("index.json", {
  built: meta.built,
  counts: meta.counts,
  tags: meta.tags,
  plugins: entries.map((e) => [
    e.slug, e.name, oneLine(e.description), e.tag ?? "",
    e.stars, e.pulse.days ?? -1, e.npm ? 1 : 0, e.proof ? 1 : 0,
    // 9th field: the repository stopped resolving. Carried in the index rather
    // than looked up per row, so a search result can say so before the reader
    // clicks through and copies a command that cannot work.
    e.status === "broken" ? 1 : 0,
  ]),
});

const metaBytes = write("meta.json", meta);

// The sitemap needs 6,290 slugs and nothing else. Reading them out of the
// 1 MB search index means parsing a megabyte of names, descriptions and star
// counts inside the Worker to throw all but one field away — and at the apex
// that read came back empty, which is exactly the kind of failure that ships
// looking like it worked (a valid sitemap, 18 URLs, no error anywhere).
const slugBytes = write("slugs.json", { built: TODAY, slugs: entries.map((e) => e.slug) });

// The front page's charts. Split out because only one page reads it and the
// decision pages should not pay for it.
//
// Two of these three series are measured elsewhere and committed — the topic's
// age curve by scripts/measure-ecosystem.mjs, the directory claims by hand off
// the sites themselves — so each carries the date it was taken. The rest is
// counted here from the registry, which means the numbers on the chart and the
// numbers in the prose cannot drift apart.
const readLocal = (name, fallback) => {
  try {
    return JSON.parse(readFileSync(join(ROOT, "data", name), "utf8"));
  } catch {
    console.log(`data: no data/${name}; the front page will omit that chart`);
    return fallback;
  }
};
const ecosystem = readLocal("ecosystem.json", null);
const directories = readLocal("directories.json", null);

// Stars are a dated popularity snapshot, not a quality signal, and the whole
// point of showing the distribution is that it is a power law: the median
// plugin has one star, so ranking six thousand of them by stars is ranking
// noise. Thresholds, not buckets — "how many clear this bar" is the question.
const starLadder = [0, 1, 2, 5, 10, 50, 100, 1000].map((min) => ({
  min,
  count: entries.filter((e) => e.stars >= min).length,
}));

const ecosystemBytes = write("ecosystem.json", {
  built: TODAY,
  counts: meta.counts,
  authors: new Set(entries.map((e) => e.repo.split("/")[0].toLowerCase())).size,
  stars: {
    ladder: starLadder,
    median: entries.length
      ? entries
          .map((e) => e.stars)
          .sort((a, b) => a - b)[Math.floor(entries.length / 2)]
      : 0,
  },
  tags: tags.map(({ tag, count }) => ({ tag, count })),
  age: ecosystem && {
    measured: ecosystem.measured,
    topic: ecosystem.topic,
    launch: ecosystem.launch,
    query: ecosystem.query,
    total: ecosystem.total,
    release: ecosystem.release ?? null,
    beforeFirstDay: ecosystem.beforeFirstDay,
    sinceLaunch: ecosystem.sinceLaunch,
    series: ecosystem.series,
  },
  directories: directories && {
    surveyed: directories.surveyed,
    method: directories.method,
    note: directories.note,
    sites: directories.sites,
  },
  // The front page's rail: what was pushed most recently across the whole
  // registry, stars breaking ties. Same order every shelf uses, so the rail is
  // the top of the pile and not a second ranking. Description is cut on a word
  // like the search index; a card is narrower than a page.
  fresh: entries
    .slice()
    .sort((a, b) => (a.pulse.days ?? 1e9) - (b.pulse.days ?? 1e9) || b.stars - a.stars)
    .slice(0, 24)
    .map((e) => ({
      slug: e.slug, name: e.name, repo: e.repo, description: oneLine(e.description),
      tag: e.tag, stars: e.stars, days: e.pulse.days, npm: !!e.npm, proof: !!e.proof,
    })),
  pushedToday: entries.filter((e) => e.pulse.days === 0).length,
});

// The specimen: the one plugin the front page has already decided about
// before the visitor types anything. It is not a recommendation and not a
// paid slot — it is whichever entry currently carries the most complete
// receipt, picked by a rule printed under it so nobody has to wonder how a
// plugin gets there. Freshest first among entries that have every field a
// decision needs (proof, an npm install path, and at least one star), which
// means it rotates on its own as the registry moves.
//
// The rule is here rather than in the page so the page cannot quietly change
// it. If this slot ever becomes purchasable it stops being a specimen, and
// the four seats exist precisely so it never has to.
const specimenOf = (list) =>
  list
    // `status !== broken` is not a quality filter — it is the one case where
    // showing the entry would hand the visitor an install command for a
    // repository that no longer exists, on the surface whose entire promise is
    // that its commands are real.
    .filter((e) => e.proof && e.npm && e.stars >= 1 && e.status !== "broken")
    .sort((a, b) => (a.pulse.days ?? 1e9) - (b.pulse.days ?? 1e9) || b.stars - a.stars)[0] ?? null;

const specimen = specimenOf(entries);
const specimenBytes = write("specimen.json", {
  built: TODAY,
  rule: "freshest entry carrying a proof file, an npm install path, and at least one star",
  plugin: specimen && {
    slug: specimen.slug, name: specimen.name, repo: specimen.repo, npm: specimen.npm,
    description: specimen.description, tag: specimen.tag, tags: specimen.tags,
    stars: specimen.stars, pulse: specimen.pulse, proof: specimen.proof,
    verifiedAgainst: specimen.verifiedAgainst, lastVerified: specimen.lastVerified,
    // Where it sits on its own shelf, so the card can say "41st of 451 by last
    // push" without the page loading the whole tag file to count.
    shelf: specimen.tag
      ? { tag: specimen.tag, size: byTag.get(specimen.tag).length, rank: byTag.get(specimen.tag).indexOf(specimen) + 1 }
      : null,
  },
});

// The seat inventory, copied through untouched. It is hand-edited in
// data/sponsors.json and read by the page exactly as written — no derivation,
// no join against the registry, deliberately. The moment sponsorship data can
// reach a plugin record, the registry stops being worth reading.
const sponsorsBytes = write("sponsors.json", JSON.parse(readFileSync(join(ROOT, "data/sponsors.json"), "utf8")));

let detailBytes = 0;
for (const e of entries) detailBytes += write(`p/${e.slug}.json`, e);

let tagBytes = 0;
for (const t of tags) {
  const list = t.order.map((slug) => {
    const o = bySlug.get(slug);
    return { slug: o.slug, name: o.name, repo: o.repo, stars: o.stars, days: o.pulse.days, npm: !!o.npm, proof: !!o.proof, gone: o.status === "broken", description: o.description };
  });
  tagBytes += write(`tags/${t.tag}.json`, { tag: t.tag, count: t.count, plugins: list });
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
console.log(`data: ${entries.length} plugins, ${tags.length} tags, ${themes.length} themes`);
console.log(`data: index ${kb(indexBytes)}, meta ${kb(metaBytes)}, slugs ${kb(slugBytes)}, ecosystem ${kb(ecosystemBytes)}, ${entries.length} detail ${kb(detailBytes)}, ${tags.length} tag ${kb(tagBytes)}, specimen ${kb(specimenBytes)}, sponsors ${kb(sponsorsBytes)}`);
console.log(`data: specimen is ${specimen ? `${specimen.name} (${specimen.pulse.days}d, ${specimen.stars}★)` : "none — no entry carries a full receipt"}`);
const noProof = entries.filter((e) => !e.proof).length;
if (noProof) console.log(`data: ${noProof} entries carry no proof and will say so on their page`);
