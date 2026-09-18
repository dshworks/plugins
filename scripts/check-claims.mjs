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
// not. So this checks the places prose carries a figure, each check named for
// the defect that put it here, and nothing else -- a tripwire that fires on
// everything is a tripwire that gets switched off.
//
// Usage: node scripts/check-claims.mjs   (run before build; exits 1 on failure)

import { existsSync, readdirSync, readFileSync } from "node:fs";
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
  // The forward-looking paragraph only renders when npm is serving a version
  // ahead of the tag, and it quotes both counts. An older census has neither
  // field, and a census that dropped them would render the paragraph with
  // `undefined` in two places rather than not at all.
  check(typeof inst.dshNewest === "string" && Number.isInteger(inst.admitsNewest),
    "data/installability.json has no dshNewest/admitsNewest; the copy that quotes them "
    + "would print undefined. Re-run scripts/measure-installability.mjs.");
  check(inst.admitsNewest <= inst.declaring,
    `data/installability.json says ${inst.admitsNewest} of ${inst.declaring} admit the newest dsh.`);
}

// A deadline that has passed is not urgency. `sponsors.json` says in its own
// comment that `sale.until` is a real date printed on the page and must be
// edited when it passes; it was not, and for nine days /sponsor advertised
// "Intro pricing until 31 August" and "after that the rate goes back up" at a
// rate that had not gone anywhere. Both surfaces now drop a lapsed sale at
// render time, so this is about the published file rather than the pixels:
// data/sponsors.json is linked from the site as the public record of the term.
{
  const sponsors = JSON.parse(read("data/sponsors.json"));
  if (sponsors.sale) {
    const ends = Date.parse(sponsors.sale.until);
    check(Number.isFinite(ends) && Date.now() <= ends + 86_400_000,
      `data/sponsors.json still carries an intro that ended ${sponsors.sale.until}. `
      + "Remove the `sale` block or give it a new date — the file is published as the "
      + "record of what a seat costs.");
  }
}

// --- 4. what the page says about OUR plugins comes from the census ----------
//
// "three of the four plugins we ship were in the broken column until
// {measured}" was typed on 2026-09-04 with the census date glued on. On
// 2026-09-17 dsh's `latest` moved to the 0.1.5 line, all four went broken, and
// the sentence read as though they had just been fixed. The same paragraph
// said "Ours are not among them either" about the forward census. Both are
// derived from installability.json's `ours` now; a count written beside the
// phrase comes back red.
{
  const src = page.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  const NUM = "(?:no|none|one|two|three|four|five|six|seven|eight|nine|ten|all|\\d+)";
  const typed = src.match(new RegExp(`\\b${NUM}\\s+of\\s+(?:the\\s+|our\\s+)?(?:${NUM}\\s+)?plugins\\s+we\\s+ship`, "i"))
    ?? src.match(/\bOurs are (?:not )?among\b/);
  check(!typed,
    `page.tsx says "${typed?.[0].replace(/\s+/g, " ")}" — a typed claim about our own plugins. `
    + "Derive it from eco.installability.ours.");

  const listed = [...read("src/lib/ours.ts").matchAll(/\bnpm:\s*"([^"]+)"/g)].map((m) => m[1]);
  const measured = (JSON.parse(read("data/installability.json")).ours ?? []).map((o) => o.name);
  const missing = listed.filter((n) => !measured.includes(n));
  check(listed.length > 0 && missing.length === 0,
    `data/installability.json does not measure ${missing.join(", ") || "any of ours"}; `
    + "the sentence about our plugins would be built from nothing. Re-run scripts/measure-installability.mjs.");
}

// --- 5. no hand-typed percentage in the copy ---------------------------------
//
// "with 98.8% of the dsh-plugin topic decided" was typed on 2026-08-19. The
// registry widened its denominator to eleven topics the next day and was
// publishing 86% by 2026-09-17; this page never moved. Same for "a category
// that is 0.14% of the population". A percentage with a decimal point is a
// measurement, and a measurement belongs in data. Whole-number thresholds
// ("under 1%") are rules, not readings, and are left alone.
{
  const text = page
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .match(/[>}][^<>{}]*(?=[<{])/g) ?? [];
  for (const t of text) {
    const hit = t.match(/\d+\.\d+%/);
    if (hit) fail.push(`page.tsx types "${hit[0]}" into the copy ("${t.slice(1).replace(/\s+/g, " ").trim().slice(0, 70)}"). Template it from the census it came from.`);
  }
}

// --- 6. llms.txt says what the page says -------------------------------------
//
// The page narrowed "Nothing here is sold, sponsored, or promoted" the day the
// seats went on sale (2026-08-19). llms.txt -- the one surface written for
// agents, which quote it back verbatim -- kept the blanket sentence for a
// month, and carried "11k plugins" while the registry passed 13,000.
{
  const llms = read("src/app/llms.txt/route.ts");
  const body = llms.slice(llms.indexOf("const body"));
  const sponsors = JSON.parse(read("data/sponsors.json"));
  check(!(sponsors.seats?.length && /nothing\s+here\s+is\s+sold/i.test(body)),
    "llms.txt says nothing here is sold while data/sponsors.json lists seats for sale. "
    + "Say what the page says: the seats are the one thing for sale.");
  const literal = body.replace(/\$\{[^}]*\}/g, "").match(/\b\d+(?:\.\d+)?k\b|\b\d{1,3},\d{3}\b/);
  check(!literal,
    `llms.txt types the count "${literal?.[0]}". Fill it from the data it describes.`);
}

// --- 7. every note links its sources ------------------------------------------
//
// A note is the one place a number may be written down rather than read, so it
// has to carry the date in its filename and at least one link a reader can
// follow to check it. A note that asks to be believed is the thing this site
// exists to argue against.
{
  const dir = join(ROOT, "content", "notes");
  const notes = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")) : [];
  for (const f of notes) {
    const text = read(`content/notes/${f}`);
    check(/^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/.test(f),
      `content/notes/${f}: name it YYYY-MM-DD-slug.md; the date in the name is the note's date.`);
    check(/^---\n[\s\S]*?\btitle:\s*\S[\s\S]*?\bsummary:\s*\S[\s\S]*?\n---\n/.test(text),
      `content/notes/${f}: frontmatter needs a title and a summary.`);
    check(/\]\(https:\/\/[^)\s]+\)/.test(text),
      `content/notes/${f}: links no source. Every note must cite something a reader can open.`);
  }
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
