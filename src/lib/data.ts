// Data access. Everything the pages read is a static asset deployed alongside
// the Worker, fetched through the ASSETS binding — an internal lookup, not a
// network call, so a decision page costs one subrequest and no egress.
//
// The alternative was bundling the registry into the Worker. It is 3.8 MB;
// the script limit is 3 MB. Measured before designing, not after deploying.

import { env } from "cloudflare:workers";

export type Proof = { path: string; key: string; url: string };
export type Pulse = { band: "this-fortnight" | "this-quarter" | "this-half" | "cold" | "unknown"; days: number | null };

export type Plugin = {
  slug: string;
  name: string;
  repo: string;
  path?: string;
  npm?: string;
  description?: string;
  category?: string;
  tags: string[];
  stars: number;
  pushedAt?: string;
  official: boolean;
  status?: string;
  verifiedAgainst?: string;
  lastVerified?: string;
  proof: Proof | null;
  pulse: Pulse;
  tag: string | null;
};

export type TagFile = {
  tag: string;
  count: number;
  plugins: { slug: string; name: string; stars: number; days: number | null; npm: boolean; proof?: boolean; gone?: boolean; description?: string }[];
};

export type Meta = {
  built: string;
  source: string;
  verifiedAgainst: string | null;
  counts: { plugins: number; withProof: number; npm: number; themes: number; tags: number; gone?: number };
  tags: { tag: string; count: number }[];
};

// The binding, not a network call. `env.ASSETS.fetch` is an internal lookup
// into the deployed asset set, so a decision page costs no egress and cannot
// read a version of the data other than the one shipped with this code.
//
// Under `vinext dev` (plain Node) there is no binding; vite.config.ts aliases
// `cloudflare:workers` to a stub whose `env` is empty, and the fallback below
// reads the same files off the dev server's public/ directory.
async function asset<T>(path: string): Promise<T | null> {
  const rel = `/_data/${path}`;
  try {
    const res = env.ASSETS
      ? await env.ASSETS.fetch(`https://assets.local${rel}`)
      : await fetch(`${process.env.DEV_ASSET_ORIGIN ?? "http://127.0.0.1:5173"}${rel}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// The front page's charts. Its own file because only one page reads it, and a
// decision page should not fetch a survey it never draws.
export type Ecosystem = {
  built: string;
  counts: Meta["counts"];
  authors: number;
  stars: { ladder: { min: number; count: number }[]; median: number };
  tags: { tag: string; count: number }[];
  age: {
    measured: string;
    topic: string;
    launch: string;
    query: string;
    total: number;
    release: { version: string; published: string | null } | null;
    beforeFirstDay: number;
    sinceLaunch: number;
    series: { date: string; created: number }[];
  } | null;
  directories: {
    surveyed: string;
    method: string;
    note: string;
    sites: { host: string; claims: number; curation: string; ours?: boolean }[];
  } | null;
};

// The four seats. Read straight from the hand-edited inventory — this type
// deliberately shares no field with Plugin, and nothing joins the two. A seat
// is a box on a page; if it could ever touch a registry row, the registry
// would stop being the thing this site is for.
export type Sponsors = {
  updated: string;
  price: { amount: number; currency: string; period: string; said: string };
  checkout: string | null;
  terms: string;
  contact: string;
  seats: {
    n: number;
    sponsor: { name: string; url: string; line: string; since: string; until: string } | null;
  }[];
};

// The plugin the front page has already decided about, picked by a printed
// rule in build-data.mjs. Not a recommendation, not for sale.
export type Specimen = {
  built: string;
  rule: string;
  plugin:
    | (Pick<Plugin, "slug" | "name" | "repo" | "npm" | "description" | "tag" | "tags" | "stars" | "pulse" | "proof" | "verifiedAgainst" | "lastVerified"> & {
        shelf: { tag: string; size: number; rank: number } | null;
      })
    | null;
};

export const getMeta = () => asset<Meta>("meta.json");
export const getSponsors = () => asset<Sponsors>("sponsors.json");
export const getSpecimen = () => asset<Specimen>("specimen.json");
export const getEcosystem = () => asset<Ecosystem>("ecosystem.json");
export const getPlugin = (slug: string) => asset<Plugin>(`p/${encodeURIComponent(slug)}.json`);
export const getTag = (tag: string) => asset<TagFile>(`tags/${encodeURIComponent(tag)}.json`);

// Just the slugs, for the sitemap. The search index carries the same list
// wrapped in a megabyte of fields the sitemap discards; a purpose-built file
// is one field per row and costs the Worker nothing to parse.
export const getSlugs = () => asset<{ built: string; slugs: string[] }>("slugs.json");

// The install command the registry's README derives, reproduced so the reader
// can copy it without leaving the page.
export function installCommand(p: Plugin): string {
  if (p.npm) return `dsh plugin --profile web add ${p.npm}`;
  const spec = p.path ? `github:${p.repo}#path=${p.path}` : `github:${p.repo}`;
  return `dsh plugin --profile web add "${spec}"`;
}

// Days since last push, said as a person would. `null` means GitHub did not
// give us a push date, which is a different fact from "a long time ago".
export function saidPulse(pulse: Pulse): string {
  if (pulse.days === null) return "no push date on record";
  if (pulse.days <= 0) return "pushed today";
  if (pulse.days === 1) return "pushed yesterday";
  if (pulse.days < 30) return `pushed ${pulse.days} days ago`;
  const months = Math.round(pulse.days / 30);
  return months < 24 ? `pushed ${months} month${months === 1 ? "" : "s"} ago` : `pushed ${Math.round(pulse.days / 365)} years ago`;
}
