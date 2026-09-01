// The editor's pick.
//
// This is the one thing on the site chosen by a person rather than by a rule,
// and it sits in obvious tension with everything else here — the console
// specimen is picked BY RULE precisely so that a directory showing you one
// plugin has to say how it got there. So this block does not pretend to be a
// rule. It says a human chose it, says who, says why, and says what it cost:
// nothing, because it is not for sale and never will be.
//
// The bar for landing here, applied in this order:
//   1. the source is public and I read it — not a README, the code;
//   2. it builds on a seam the ecosystem has left empty (see /#unbuilt), so the
//      pick teaches something rather than repeating the popular thing;
//   3. it ships: on npm, with a receipt in the registry, pushed recently;
//   4. no relationship with us of any kind.
//
// Rotating this is manual and rare, and the date it was written is printed, so
// a stale pick is visible as a stale pick.
export type Pick = {
  slug: string;
  repo: string;
  npm?: string;
  /** Their words, from the repo. */
  their: string;
  /**
   * The numeric case, as a template. `{seam}`, `{total}` and `{memory}` are
   * filled from data/seams.json at render time.
   *
   * These started life as three literals typed on the day the pick was
   * written, and five days later all three were wrong. The `picked` date makes
   * a stale *choice* visible, which is what it is for -- but a count of what
   * the shelf holds is not a fact about the choice, and the shelf moves every
   * day. So the sentence is a template and the numbers come from the same
   * census the chart on the page renders.
   */
  claim: string;
  /** Mine. Why this one, in a sentence a reader can disagree with. */
  note: string;
  /** The specific thing worth looking at, and the file it is in. */
  detail: { what: string; href: string; label: string }[];
  seam: { ctx: string; href: string };
  picked: string;
  by: string;
};

export const PICK: Pick = {
  slug: "billion-context-dsh",
  repo: "Tyan66666/billion-context-dsh",
  npm: "billion-context-dsh",
  their:
    "Model-driven context management (Active Context Pruning) for the DeepSeek Harness — the model decides when and what to compress.",
  claim:
    "Almost nobody builds on ctx.compaction: {seam} plugins in {total} mention the context window at all, while {memory} are tagged memory.",
  note:
    "This is one of the few that went at the problem from inside the engine instead of keeping notes beside it — and the design earns the position. The model itself marks what to compress, so there is no second summarization call to pay for, and the originals stay in the append-only session log, which is why decompress, search and replay still work afterwards. Most compaction is lossy and hopes you do not notice.",
  detail: [
    {
      what: "It registers a real CompactionEngine, not a wrapper — the harness's own backend interface.",
      href: "https://github.com/Tyan66666/billion-context-dsh/blob/main/src/index.ts",
      label: "src/index.ts",
    },
    {
      what:
        "It documents where the harness would not bend: dsh has no in-memory message rewrite hook, so ranges are carried by an injected nudge table instead. Writing down what did not work is rarer than the plugin.",
      href: "https://github.com/Tyan66666/billion-context-dsh/blob/main/docs/dsh-porting-verification.md",
      label: "docs/dsh-porting-verification.md",
    },
  ],
  seam: { ctx: "ctx.compaction", href: "/#unbuilt" },
  picked: "2026-08-26",
  by: "the maintainer of this registry",
};
