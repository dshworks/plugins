#!/usr/bin/env node
// Measures which of the harness's extension seams the ecosystem actually uses.
//
// The registry answers "is this plugin real?" per row. This answers a question
// no per-row page can: across 11k plugins, what has everybody built, and what
// has nobody built? That is the difference between a directory and a map.
//
// METHOD, and why it is a census and not a sample.
//
// The first version of this measurement sampled 227 plugins' entry files for
// `ctx.<service>` calls and concluded that 52 of the harness's 83 services were
// never used by anyone. That was wrong, and wrong in an instructive way:
// `ctx.lsp` was on the "unused" list while the registry held 16
// code-intelligence plugins, one of them an explicit LSP provider. A 227-row
// sample cannot see a category that is 0.14% of the population -- the expected
// number of hits was 0.3, so finding none meant nothing at all.
//
// So this script does not sample source. It matches a regex over every name
// and description in the registry, which we already hold for all of them. The
// number it produces is "plugins that SAY they do this", which is a weaker
// claim per row and a far stronger one in aggregate: no sampling error, and
// the reader can re-run the same regex on the same public file.
//
// Every seam carries the regex that counted it and the harness source path
// that proves the seam exists. Same standard as the entries: if you cannot
// point at where a number came from, it does not go in the file.
//
// Env: DATA_SOURCE=local reads the sibling checkout instead of the network.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "data", "seams.json");
const TODAY = new Date().toISOString().slice(0, 10);
const LOCAL = process.env.DATA_SOURCE === "local";
const REMOTE = "https://raw.githubusercontent.com/dshworks/awesome-dsh-plugins/main/data/plugins.json";
const LOCAL_PATH = join(ROOT, "../awesome-dsh-plugins/data/plugins.json");

// The dsh release every source path below was read at. A seam is a claim about
// a version, for the same reason an entry is.
const HARNESS = "0.1.1-rc.2";

// Hand-curated, and deliberately so. Each row names a real service on `ctx`,
// the file in the harness that defines it, and one sentence on what having it
// would let you build. The regex is the counting rule, published so the number
// can be argued with.
//
// `deep: true` marks a seam that changes what the agent DOES -- how it plans,
// what it remembers, when it stops. `deep: false` is the surface everyone
// already builds on: add a tool, add a page, add a setting.
const SEAMS = [
  { id: "tools", ctx: "ctx.tools", deep: false,
    src: "packages/core/tools/src/index.ts",
    what: "Add a tool the model can call. The obvious plugin, and the one everybody wrote.",
    rx: "\\btool\\b|tools|toolkit|mcp" },
  { id: "webServer", ctx: "ctx.webServer", deep: false,
    src: "packages/host/webserver/src/index.ts",
    what: "Add a page or an endpoint to the Web UI. The second obvious plugin.",
    rx: "web ?ui|panel|dashboard|web page|settings tab" },

  { id: "subagents", ctx: "ctx.subagents", deep: true,
    src: "packages/subagent/subagent/src/index.ts",
    what: "Spawn and steer child agents from inside a run.",
    rx: "sub.?agent" },
  { id: "terminals", ctx: "ctx.terminals", deep: true,
    src: "packages/terminal/terminal/src/index.ts",
    what: "Own a real pty. Long-lived shells the agent drives, not one-shot commands.",
    rx: "terminal|tmux|\\bpty\\b|shell session" },
  { id: "workflowEngine", ctx: "ctx.workflowEngine", deep: true,
    src: "packages/workflow/workflow/src/index.ts",
    what: "Define multi-step runs the harness executes, instead of prompting a plan and hoping.",
    rx: "workflow|pipeline|orchestrat" },
  { id: "tokenMeter", ctx: "ctx.tokenMeter", deep: true,
    src: "packages/llm/token-meter/src/index.ts",
    what: "Ask the harness what a session actually costs, rather than counting characters yourself.",
    rx: "token (count|meter|usage)|tokenmeter|context usage" },
  { id: "compaction", ctx: "ctx.compaction", deep: true,
    src: "packages/compaction/compaction/src/index.ts",
    what: "Decide what falls out of the context window and what survives.",
    rx: "compact|prun(e|ing)|context window|token budget" },
  { id: "authorization", ctx: "ctx.authorization", deep: true,
    src: "packages/credentials/authorization/src/index.ts",
    what: "Own the credential-authorization flow instead of pasting keys into settings.",
    rx: "authoriz|oauth|\\brbac\\b|\\bacl\\b" },
  { id: "feedback", ctx: "ctx.messageFeedback", deep: true,
    src: "packages/feedback/message-feedback/src/index.ts",
    what: "Collect thumbs up/down on messages — the raw material of an eval set.",
    rx: "feedback|thumbs|\\brating\\b|eval(uation)?\\b|benchmark" },
  { id: "jobs", ctx: "ctx.jobs", deep: true,
    src: "packages/jobs/jobs/src/index.ts",
    what: "Run work in the background, outside a conversation turn.",
    rx: "\\bjob\\b|scheduled|\\bcron\\b|background task|unattended|daemon" },
  { id: "agentTeams", ctx: "ctx.agentTeams", deep: true,
    src: "packages/experimental/agent-team/src/index.ts",
    what: "The experimental team service: durable teammates, a task DAG, a mailbox.",
    rx: "agent.?team|teammate|swarm|\\bcrew\\b|multi.?agent" },
  { id: "sandbox", ctx: "ctx.sandbox", deep: true,
    src: "packages/sandbox/sandbox/src/index.ts",
    what: "Choose what the agent is allowed to touch, enforced rather than asked.",
    rx: "sandbox|seatbelt|bubblewrap|firejail" },
  { id: "timer", ctx: "ctx.timer", deep: true,
    src: "packages/extensions/cordis-client-runner/src/client/timer.ts",
    what: "Wake up on a schedule. A standing agent instead of a reactive one.",
    rx: "\\btimer\\b|interval|heartbeat" },
  { id: "uiRenderer", ctx: "ctx.uiRenderer", deep: true,
    src: "packages/client/ui-renderer/src/index.ts",
    what: "Draw a message yourself: render a diff, a table, a chart inline.",
    rx: "renderer|custom render|markdown render" },
  { id: "lsp", ctx: "ctx.lsp", deep: true,
    src: "packages/lsp/lsp/src/index.ts",
    what: "Register a language server. Real go-to-definition instead of grep.",
    rx: "\\blsp\\b|language.?server|code.?intel|tree.?sitter" },
  { id: "spillStore", ctx: "ctx.spillStore", deep: true,
    src: "packages/spill/spill/src/index.ts",
    what: "Push a huge tool result out of the window and hand back a reference.",
    rx: "\\bspill\\b|truncat|offload|large output" },
  { id: "planMode", ctx: "ctx.planMode", deep: true,
    src: "packages/plan/plan-mode/src/index.ts",
    what: "Turn plan mode on and off from code, on conditions you choose.",
    rx: "plan mode|planmode|plan-mode" },
  { id: "invariants", ctx: "ctx.invariants", deep: true,
    src: "packages/runtime-diagnostics/invariants/src/index.ts",
    what: "Assert things about a live run and fail loudly when they stop holding.",
    rx: "invariant|assertion|property test" },
  { id: "e2b", ctx: "ctx.e2b", deep: true,
    src: "packages/e2b/e2b/src/index.ts",
    what: "Run the agent's code somewhere that is not your laptop.",
    rx: "\\be2b\\b|remote sandbox|code runtime|firecracker" },
];

async function load() {
  if (LOCAL) return JSON.parse(readFileSync(LOCAL_PATH, "utf8"));
  const res = await fetch(REMOTE, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`plugins: HTTP ${res.status}`);
  return res.json();
}

const registry = await load();
const plugins = registry.plugins ?? [];
const blob = plugins.map((p) => `${p.name} ${p.description ?? ""}`);

const rows = SEAMS.map((s) => {
  const re = new RegExp(s.rx, "i");
  const count = blob.reduce((n, b) => n + (re.test(b) ? 1 : 0), 0);
  return { ...s, count, share: count / plugins.length };
}).sort((a, b) => a.count - b.count);

const deep = rows.filter((r) => r.deep);
const out = {
  built: TODAY,
  harness: HARNESS,
  total: plugins.length,
  source: "https://github.com/dshworks/awesome-dsh-plugins/blob/main/data/plugins.json",
  method:
    "Case-insensitive regex over every `name` + `description` in the registry. " +
    "Counts plugins that say they do this, not plugins proven to call the service. " +
    "A census, not a sample: an earlier sampled version missed a whole category and said nobody had built it.",
  // Headline numbers, deliberately not cherry-picked. The ratio is against the
  // MEDIAN deep seam, not the emptiest one -- dividing by 2 would produce a
  // more impressive number and a less honest one.
  loudest: rows[rows.length - 1].count,
  medianDeep: deep[Math.floor(deep.length / 2)].count,
  ratio: Math.round(rows[rows.length - 1].count / Math.max(1, deep[Math.floor(deep.length / 2)].count)),
  underOnePct: deep.filter((r) => r.share < 0.01).length,
  deepCount: deep.length,
  // The sharpest single comparison on the page, so it is derived here rather
  // than typed into the copy. Counted across ALL tags, not the primary one:
  // meta.json's tag counts are by primary tag and would say something smaller
  // and different, and two numbers for one idea is how a page starts lying.
  memoryTagged: plugins.filter((p) => (p.tags ?? []).includes("memory")).length,
  seams: rows,
};

// Every `src` above is rendered as a link on the front page. Five of them were
// wrong on the first pass -- guessed from the service name rather than read off
// the tree -- and a dead link on the one page arguing that claims should be
// checkable is the worst possible place to have one. So check them, against the
// tag, before writing the file anybody renders.
const RAW = `https://raw.githubusercontent.com/deepseek-ai/deepseek-harness/dsh-v${HARNESS}`;
const dead = [];
await Promise.all(
  rows
    .filter((r) => r.src)
    .map(async (r) => {
      try {
        const res = await fetch(`${RAW}/${r.src}`, { method: "GET", signal: AbortSignal.timeout(20000) });
        if (!res.ok) dead.push(`${r.ctx} -> ${r.src} (HTTP ${res.status})`);
      } catch (err) {
        dead.push(`${r.ctx} -> ${r.src} (${err.message})`);
      }
    }),
);
if (dead.length) {
  console.error(`seams: ${dead.length} source path(s) do not exist at dsh-v${HARNESS}:`);
  for (const d of dead) console.error(`  ${d}`);
  process.exit(1);
}
console.log(`seams: all ${rows.filter((r) => r.src).length} source paths resolve at dsh-v${HARNESS}`);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
console.log(`seams: ${rows.length} measured over ${plugins.length} plugins -> data/seams.json`);
for (const r of rows) console.log(`  ${String(r.count).padStart(5)}  ${(r.share * 100).toFixed(2).padStart(5)}%  ${r.ctx}`);
