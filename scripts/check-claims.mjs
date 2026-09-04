#!/usr/bin/env node
// Fail the build when the copy makes a claim the data does not.
//
// This site argues that a directory should print dated, checkable numbers
// instead of adjectives. Twice it did not hold itself to that:
//
//   1. `sinceLaunch` is derived, with a comment saying why a literal would go
//      stale by the weekend -- and three lines below it a heading said
//      "built last week" in prose. It stayed there for nineteen days.
//   2. The editor's pick argued from "126 plugins in 11,197 ... 1,898 tagged
//      memory". Five days later the same census said 127, 11,690 and 1,831.
//      All three literals were wrong; none of them was a fact about the pick.
//
// Both are the same defect: a number that moves, written as text that does
// not. So this checks the two places prose is allowed to carry a figure, and
// nothing else -- a tripwire that fires on everything is a tripwire that gets
// switched off.
//
// Usage: node scripts/check-claims.mjs   (run before build; exits 1 on failure)

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

const fail = [];
const check = (ok, msg) => { if (!ok) fail.push(msg); };

const page = read("src/app/page.tsx");
const pick = read("src/lib/pick.ts");

// --- 1. no relative time words in the copy ----------------------------------
//
// The age of the ecosystem is the one number on this page that changes every
// single day, so it is the one that may never be spelled. Checked against the
// rendered strings only: JSX text and headings, not comments, which are where
// this rule is explained and therefore where the words legitimately appear.
const TIME_WORD = /\b(last|past|this)\s+(week|month|fortnight)\b|\b(yesterday|today|recently)\b/i;
const jsxText = page
  .replace(/\/\*[\s\S]*?\*\//g, "")     // block comments
  .replace(/^\s*\/\/.*$/gm, "")          // line comments
  .match(/>[^<>{}]{12,}</g) ?? [];
for (const t of jsxText) {
  const s = t.slice(1, -1).replace(/\s+/g, " ").trim();
  if (TIME_WORD.test(s)) {
    fail.push(`page.tsx says "${s.slice(0, 80)}" — a relative time word in the copy. `
      + `The age is derived as \`sinceLaunch\`; print the number.`);
  }
}

// --- 2. the pick's numbers come from the census, not from a keyboard --------
check(/\{seam\}/.test(pick) && /\{total\}/.test(pick) && /\{memory\}/.test(pick),
  "pick.ts: PICK.claim lost one of its {seam}/{total}/{memory} tokens — "
  + "those numbers must be filled from data/seams.json, not typed.");
check(!/\d{1,3},\d{3}/.test(pick.split("export const PICK")[1] ?? ""),
  "pick.ts: a literal thousands-separated number in the PICK body. "
  + "Every count on this shelf moves daily; template it.");

// --- 3. the census the copy quotes is not stale ------------------------------
//
// A template that reads a data file only helps if the data file is refreshed.
// The deploy workflow rebuilds it daily, so a week-old census means the job
// has been failing quietly -- which is exactly how a red scheduled run goes
// unnoticed.
//
// Both censuses. data/ecosystem.json is the one that actually went stale: the
// deploy re-ran `npm run data` daily and never re-ran the measurement, so the
// front page published a fresh `built:` date over a 12-day-old chart -- and
// the sentence "dsh shipped N days ago" was N days before the CENSUS, not
// before today. The site's whole argument is that a number should say where it
// came from and when.
//
// 14 days, not 1: the measure step can fail on a bad GitHub day without
// blocking a deploy of otherwise-current data. This is the alarm for a job
// that has been broken for a fortnight, not a daily gate.
for (const [file, field, script] of [
  ["data/seams.json", "built", "scripts/measure-seams.mjs"],
  ["data/ecosystem.json", "measured", "scripts/measure-ecosystem.mjs"],
  // The one census whose subject moves without warning: it is measured against
  // whatever dsh's `latest` dist-tag points at, and that changed under us on
  // 2026-09-03 with the shelf's answer changing the same day.
  ["data/installability.json", "measured", "scripts/measure-installability.mjs"],
]) {
  const data = JSON.parse(read(file));
  const days = Math.round((Date.now() - Date.parse(data[field])) / 86400000);
  check(days <= 14,
    `${file} was measured ${days} days ago (${data[field]}). `
    + `The copy quotes it as current; re-run ${script}.`);
}

// A census measured against a dsh version that is no longer `latest` is not
// stale by date and is still wrong: the whole claim is "beside the dsh npm
// serves you". Checked against the file the site itself publishes rather than
// the network, so the build stays offline; measure-installability re-reads npm.
{
  const inst = JSON.parse(read("data/installability.json"));
  const eco = JSON.parse(read("data/ecosystem.json"));
  const shipping = eco.release?.version ?? null;
  check(!shipping || shipping === inst.dshLatest,
    `data/installability.json was measured against dsh ${inst.dshLatest}, but the site says `
    + `${shipping} is what npx installs. Re-run scripts/measure-installability.mjs.`);
  check(inst.declaring > 0 && inst.current <= inst.declaring,
    `data/installability.json is not internally consistent: ${inst.current} of ${inst.declaring}.`);
}

if (fail.length) {
  console.error("check-claims: FAILED");
  for (const f of fail) console.error(`  - ${f}`);
  process.exit(1);
}
const ages = ["data/seams.json:built", "data/ecosystem.json:measured", "data/installability.json:measured"].map((spec) => {
  const [file, field] = spec.split(":");
  const on = JSON.parse(read(file))[field];
  return `${file.replace("data/", "").replace(".json", "")} ${on}`;
});
console.error(`check-claims: ok (${ages.join(", ")})`);
