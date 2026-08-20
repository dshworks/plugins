#!/usr/bin/env node
// Measures how old the ecosystem actually is.
//
// The registry records when each repo was last *pushed*, which turned out to
// say almost nothing: 99.6% of 6,290 plugins were pushed inside seven days, so
// "is it maintained?" has no discriminating power here. The interesting field
// is when each repo was *created*, and we do not carry that — fetching it per
// repo would be 7k API calls.
//
// GitHub's search API answers the population question in one call per day:
// `topic:dsh-plugin created:<DATE` returns a total_count that is exact even
// though the result list caps at 1000. Thirteen calls give the whole curve.
//
// Output is committed to data/ecosystem.json so the site builds offline and
// so the numbers on the page can be re-derived by anyone running this script.
// Every series carries the query that produced it — the same standard we hold
// the entries to.

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "ecosystem.json");
const TOPIC = process.env.TOPIC ?? "dsh-plugin";

// dsh's first public release. Days before it are pre-history: repos that
// existed for another reason and acquired the topic later.
const LAUNCH = "2026-08-13";
const FIRST = "2026-08-06";

const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? "";
const headers = {
  accept: "application/vnd.github+json",
  "user-agent": "dsh.works-ecosystem-measure",
  ...(token ? { authorization: `Bearer ${token}` } : {}),
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => {
  const d = new Date(`${s}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return iso(d);
};

// Search is rate-limited hard (30/min authenticated, 10 unauthenticated) and
// returns 403 rather than queueing, so this paces itself and retries once.
async function count(q) {
  const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&per_page=1`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers });
    if (res.ok) return (await res.json()).total_count;
    if (res.status === 403 || res.status === 429) {
      const wait = Number(res.headers.get("retry-after") ?? 20) * 1000;
      console.error(`  rate limited, waiting ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    throw new Error(`${res.status} ${res.statusText} for ${q}`);
  }
  throw new Error(`gave up on ${q}`);
}

const today = iso(new Date());
const days = [];
for (let d = FIRST; d <= today; d = addDays(d, 1)) days.push(d);

console.error(`measuring topic:${TOPIC} over ${days.length} days${token ? "" : " (no token: slow)"}`);

// Cumulative "created before D", differenced into a daily series. Asking for
// each day directly would need a range query per day and cost the same, but
// the cumulative form also gives us the pre-history bucket for free.
const cumulative = {};
for (const d of days) {
  cumulative[d] = await count(`topic:${TOPIC} created:<${d}`);
  console.error(`  before ${d}: ${cumulative[d]}`);
  await sleep(token ? 2100 : 6500);
}
const total = await count(`topic:${TOPIC}`);
await sleep(token ? 2100 : 6500);
const withStars = await count(`topic:${TOPIC} stars:>=1`);

// What dsh is on right now. The registry records the release each entry was
// checked under, and the interesting number is the gap between the two: when
// rc.7 ships and 6,290 rows still say rc.6, that is not an error to paper over
// — it is the one fact a dated registry can tell a reader that an undated one
// cannot. So we fetch it and print it rather than quietly relabelling rows.
// What `npx @deepseek-ai/dsh` actually installs, and — separately — whether
// something newer is already on the registry under another tag.
//
// These come apart, and on 2026-08-20 they were apart: `latest` was
// 0.1.0-rc.7 while 0.1.0-rc.8 had been published to `next` the day before,
// with GitHub release notes and everything. A reader who saw the rc.8
// announcement and then read a page dated against rc.7 would reasonably think
// the page was stale. It was not; `latest` is the honest answer to "what do
// you get", and `next` is the honest answer to "what exists". Report both and
// the confusion has nowhere to live.
async function currentRelease() {
  try {
    const res = await fetch("https://registry.npmjs.org/@deepseek-ai/dsh", { headers });
    if (!res.ok) return null;
    const pkg = await res.json();
    const tags = pkg["dist-tags"] ?? {};
    const version = tags.latest;
    if (!version) return null;
    const at = (v) => pkg.time?.[v]?.slice(0, 10) ?? null;
    const release = { version, published: at(version) };
    // Any tag pointing somewhere other than `latest`, newest first. Recorded
    // as a list rather than hardcoding `next`, because the tag a project uses
    // for prereleases is a convention, not a rule.
    const ahead = Object.entries(tags)
      .filter(([tag, v]) => tag !== "latest" && v !== version && at(v) && at(v) >= release.published)
      .map(([tag, v]) => ({ tag, version: v, published: at(v) }))
      .sort((a, b) => b.published.localeCompare(a.published));
    if (ahead.length) release.ahead = ahead;
    return release;
  } catch {
    return null;
  }
}
const release = await currentRelease();
if (release) {
  console.error(`  dsh latest on npm: ${release.version} (${release.published})`);
  for (const a of release.ahead ?? []) {
    console.error(`  ahead of latest: ${a.version} on the '${a.tag}' tag (${a.published}) — not what npx installs`);
  }
}

const series = [];
for (let i = 0; i < days.length; i++) {
  const d = days[i];
  const next = i + 1 < days.length ? cumulative[days[i + 1]] : total;
  series.push({ date: d, created: Math.max(0, next - cumulative[d]) });
}

const out = {
  $comment:
    "Measured from the GitHub search API. total_count is exact even though the result list caps at 1000. Re-derive with scripts/measure-ecosystem.mjs.",
  measured: today,
  topic: TOPIC,
  launch: LAUNCH,
  query: `topic:${TOPIC} created:<DATE`,
  total,
  withStars,
  release,
  // Everything with the topic that existed before dsh did. These are repos
  // that acquired the topic later, not plugins written for a shipped product.
  beforeFirstDay: cumulative[FIRST],
  sinceLaunch: total - cumulative[LAUNCH],
  series,
};

await writeFile(OUT, `${JSON.stringify(out, null, 2)}\n`);
const pct = ((out.sinceLaunch / total) * 100).toFixed(1);
console.error(`\n${total} repos in topic:${TOPIC}`);
console.error(`${out.beforeFirstDay} predate ${FIRST}; ${out.sinceLaunch} (${pct}%) created on or after launch ${LAUNCH}`);
console.error(`wrote ${OUT}`);
