// Charts, as server-rendered inline SVG.
//
// No chart library. These are three fixed shapes over small arrays, and a
// library would put ~50 KB of client JavaScript in front of a picture that
// never changes after the build — on a page whose entire argument is that you
// should not have to trust things you cannot check. Inline SVG renders with
// JS off, prints, scales, and can be read in view-source.
//
// The motion lives in CSS (`.ch-rise` / `.ch-run`) and only exists once the
// reveal client has declared itself; see reveal.tsx.

import { tagLabel } from "@/lib/tags";

const fmt = (n: number) => n.toLocaleString("en-US");

/**
 * Scroll frame for a plot.
 *
 * These charts carry twenty-two labelled rows and thirteen dated columns. On a
 * phone the SVG scales to the viewport and the labels go under four pixels —
 * legible as a shape, useless as a reading. Letting the plot keep its width
 * and scroll sideways is the honest trade: the reader gets the same chart the
 * desktop gets, and the shape is still visible in the first screenful.
 */
function Plot({ children }: { children: React.ReactNode }) {
  return <div className="figure-plot">{children}</div>;
}

// --- the age of the ecosystem ----------------------------------------------

export type AgeSeries = { date: string; created: number }[];

/**
 * Repos created per day in the topic, with the day dsh shipped marked.
 *
 * This is the only chart on the site that is not derived from our own
 * registry, and the one that most needs its provenance printed: it comes from
 * GitHub's search API, whose `total_count` is exact even when the result list
 * caps at 1000. The footer says so and names the query.
 */
export function AgeChart({
  series,
  launch,
  before,
  firstDay,
}: {
  series: AgeSeries;
  launch: string;
  before: number;
  firstDay: string;
}) {
  const W = 720;
  const H = 190;
  const BASE = 150;
  const TOP = 26;

  // The pre-history bucket is everything that carried the topic before our
  // window opens. It is one bar of a different kind, set apart by a gap, and
  // never merged into the daily series — a count of "some months" sitting in a
  // row of single days would read as a day.
  const cols = [{ date: "before", created: before, pre: true }, ...series.map((d) => ({ ...d, pre: false }))];
  const max = Math.max(...cols.map((c) => c.created), 1);
  // The y-axis labels own the first 28px and the pre/daily split nudges bars
  // ±6, so the columns get what is left. Dividing the full width instead put
  // today's bar half outside the frame.
  const GUTTER = 28;
  const slot = (W - GUTTER - 8) / cols.length;
  const bw = Math.min(slot * 0.62, 40);
  const h = (v: number) => Math.max(1, ((BASE - TOP) * v) / max);

  // Linear, not log. The cliff between 36 repos a day and 1,857 the day after
  // launch *is* the finding; a log axis would flatten it into a gentle slope
  // and quietly argue the opposite of what the data says.
  const gridlines = [0, 0.5, 1].map((f) => ({ y: BASE - (BASE - TOP) * f, v: Math.round(max * f) }));

  return (
    <Plot>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Repositories created per day in the dsh-plugin topic. ${fmt(before)} existed before ${firstDay}; the count jumps from double digits to ${fmt(Math.max(...series.map((s) => s.created)))} in a day after dsh shipped on ${launch}.`}>
      {gridlines.map((g) => (
        <g key={g.y}>
          <line className="ch-grid" x1={GUTTER} x2={W} y1={g.y} y2={g.y} />
          <text className="ch-axis" x="0" y={g.y + 3}>{fmt(g.v)}</text>
        </g>
      ))}
      {cols.map((c, i) => {
        // The pre-history bar is pushed left, away from the daily run, so the
        // eye does not read "everything before" as another Tuesday.
        const x = i * slot + (slot - bw) / 2 + GUTTER + (c.pre ? -6 : 6);
        const bh = h(c.created);
        const isLaunch = c.date === launch;
        return (
          <g key={c.date} style={{ ["--i" as string]: i }}>
            <rect
              className={`ch-bar ch-rise${isLaunch ? " is-accent" : ""}`}
              x={x}
              y={BASE - bh}
              width={bw}
              height={bh}
              rx="1"
            >
              <title>{`${c.pre ? `before ${firstDay}` : c.date}: ${fmt(c.created)} repos created`}</title>
            </rect>
            <text className="ch-axis" x={x + bw / 2} y={BASE + 12} textAnchor="middle">
              {c.pre ? "prior" : c.date.slice(8)}
            </text>
            {/* The launch marker is the whole reading key: without it this is
                just a lopsided bar chart, with it the cliff has a cause. */}
            {isLaunch && (
              <>
                <line className="ch-grid" x1={x + bw / 2} x2={x + bw / 2} y1={TOP - 8} y2={BASE - bh - 4} />
                <text className="ch-label" x={x + bw / 2} y={TOP - 12} textAnchor="middle">
                  dsh ships
                </text>
              </>
            )}
          </g>
        );
      })}
      <line className="ch-grid" x1={GUTTER} x2={W} y1={BASE} y2={BASE} strokeDasharray="0" />
    </svg>
    </Plot>
  );
}

// --- what the directories claim ---------------------------------------------

export type Site = { host: string; claims: number; curation: string; ours?: boolean };

export function ShelfMap({ tags }: { tags: { tag: string; count: number }[] }) {
  const max = Math.max(...tags.map((t) => t.count), 1);
  return (
    <ul className="shelf">
      {tags.map((t, i) => (
        <li key={t.tag} data-reveal="shelf" style={{ ["--i" as string]: i }}>
          <a href={`/tag/${t.tag}`}>
            <span className="shelf-name">{tagLabel(t.tag)}</span>
            <span className="shelf-track">
              <span className="shelf-fill" style={{ width: `${(t.count / max) * 100}%` }} />
            </span>
            <span className="shelf-count">{fmt(t.count)}</span>
          </a>
        </li>
      ))}
    </ul>
  );
}

// --- the star ladder ---------------------------------------------------------

/**
 * How many plugins clear each star threshold.
 *
 * Printed because the median is one star. Twenty directories rank this topic
 * by popularity; this is what that ranking is sorting. It is a thresholds
 * chart rather than a histogram because "how many clear this bar" is the
 * question a reader deciding whether to trust a star count actually has.
 */
export function StarLadder({ ladder, total }: { ladder: { min: number; count: number }[]; total: number }) {
  const rows = ladder.filter((l) => l.min > 0);
  const ROW = 20;
  const LABEL = 74;
  const W = 720;
  const H = rows.length * ROW + 4;
  return (
    <Plot>
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Plugins by star threshold, out of ${fmt(total)}. ${rows.map((r) => `${fmt(r.count)} have at least ${r.min}`).join("; ")}.`}>
      {rows.map((r, i) => {
        const y = i * ROW;
        const w = Math.max(1, ((W - LABEL - 60) * r.count) / total);
        return (
          <g key={r.min} style={{ ["--i" as string]: i }}>
            <text className="ch-label dim" x={LABEL - 8} y={y + 13} textAnchor="end">
              {r.min}★+
            </text>
            <rect className="ch-bar ch-run" x={LABEL} y={y + 4} width={w} height={ROW - 9} rx="1">
              <title>{`${fmt(r.count)} of ${fmt(total)} plugins have at least ${r.min} star${r.min === 1 ? "" : "s"}`}</title>
            </rect>
            <text className="ch-axis" x={LABEL + w + 6} y={y + 13}>
              {fmt(r.count)}
              <tspan className="ch-axis">
                {" · "}
                {r.count / total < 0.005 ? "<1" : Math.round((r.count / total) * 100)}%
              </tspan>
            </text>
          </g>
        );
      })}
    </svg>
    </Plot>
  );
}

// --- who the count is actually made of --------------------------------------

/**
 * Share of the shelf held by the N largest accounts, as a cumulative ladder.
 *
 * Same form as the star ladder on purpose: thresholds, not buckets, because
 * the question is "how much comes from how few". Cumulative, so each bar
 * contains the ones above it and the shape of the curve is the finding — a
 * steep first step and then almost flat.
 *
 * No account is named. Naming the top one would turn a fact about our
 * denominator into a claim about a person, and it is not their fault that a
 * directory publishes a count.
 */
export function OwnerLadder({
  ladder,
  total,
  singletonShare,
}: {
  ladder: { k: number; share: number }[];
  total: number;
  singletonShare: number;
}) {
  // The singleton row is NOT cumulative and is drawn last with a different
  // fill, because it answers the opposite question: not "how few accounts hold
  // how much" but "how much comes from accounts that turned up once". Putting
  // it in the same column without saying so would be a chart corrected by its
  // own caption.
  const rows = [...ladder, { k: -1, share: singletonShare }];
  const ROW = 20;
  const LABEL = 132;
  const W = 720;
  const H = rows.length * ROW + 4;
  const label = (k: number) => (k === -1 ? "one-plugin accounts" : k === 1 ? "largest account" : `largest ${k}`);
  return (
    <Plot>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Share of the ${fmt(total)} plugins held by the largest accounts. ${rows
          .map((r) => `${label(r.k)}: ${Math.round(r.share * 100)}%`)
          .join("; ")}.`}
      >
        {rows.map((r, i) => {
          const y = i * ROW;
          const w = Math.max(1, (W - LABEL - 84) * r.share);
          return (
            <g key={r.k} style={{ ["--i" as string]: i }}>
              <text className="ch-label dim" x={LABEL - 8} y={y + 13} textAnchor="end">
                {label(r.k)}
              </text>
              <rect
                className={r.k === -1 ? "ch-bar ch-run is-accent" : "ch-bar ch-run"}
                x={LABEL}
                y={y + 4}
                width={w}
                height={ROW - 9}
                rx="1"
              >
                <title>{`${Math.round(r.share * 100)}% of ${fmt(total)} plugins (${fmt(
                  Math.round(r.share * total),
                )} entries)`}</title>
              </rect>
              <text className="ch-axis" x={LABEL + w + 6} y={y + 13}>
                {Math.round(r.share * 100)}%
                <tspan className="ch-axis">
                  {" · "}
                  {fmt(Math.round(r.share * total))}
                </tspan>
              </text>
            </g>
          );
        })}
      </svg>
    </Plot>
  );
}

// --- what the ecosystem built on, and what it did not -----------------------

export type Seam = {
  id: string;
  ctx: string;
  deep: boolean;
  src: string;
  what: string;
  count: number;
  share: number;
};

/**
 * Extension seams by how many plugins claim to use them.
 *
 * Linear, and deliberately. The first version of this chart used a log axis,
 * on the reasoning that a 2-to-1,627 range draws most rows as nothing —
 * and then it drew `ctx.e2b`, which two plugins in eleven thousand use, at a
 * quarter the width of `ctx.tools`. A reader who trusts the picture would have
 * come away with the opposite of the finding. A chart that has to be corrected
 * by its own caption is a broken chart.
 *
 * Linear says the true thing: two long bars and seventeen hairlines. The exact
 * count sits beside every row, so nothing is lost by refusing to flatter the
 * small numbers — you get the real shape and the real number.
 *
 * Two colours, one distinction: the seams everybody builds on versus the ones
 * that change what the agent does. The pink hairlines are the story.
 */
export function SeamMap({ seams, total }: { seams: Seam[]; total: number }) {
  const rows = [...seams].sort((a, b) => b.count - a.count);
  const ROW = 21;
  const LABEL = 128;
  const W = 720;
  const H = rows.length * ROW + 4;
  const max = rows[0]?.count ?? 1;
  const plot = W - LABEL - 96;
  // A hairline floor so a row with two plugins is still visibly a row. Two
  // pixels is not a lie about the value — the number is printed next to it —
  // it is the difference between "almost none" and "this row is missing".
  const x = (n: number) => Math.max(2, (n / max) * plot);
  return (
    <Plot>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Harness extension seams by how many of ${fmt(total)} plugins use them. ${rows
          .map((r) => `${r.ctx}: ${fmt(r.count)}`)
          .join("; ")}.`}
      >
        {rows.map((r, i) => {
          const y = i * ROW;
          const w = x(r.count);
          return (
            <g key={r.id} style={{ ["--i" as string]: i }}>
              <text className="ch-label dim" x={LABEL - 8} y={y + 14} textAnchor="end">
                {r.ctx}
              </text>
              <rect
                className={`ch-bar ch-run${r.deep ? " is-deep" : ""}`}
                x={LABEL}
                y={y + 5}
                width={w}
                height={ROW - 10}
                rx="1"
              >
                <title>{`${fmt(r.count)} of ${fmt(total)} plugins (${
                  r.share < 0.005 ? "<1" : Math.round(r.share * 100)
                }%) — ${r.what}`}</title>
              </rect>
              <text className="ch-axis" x={LABEL + w + 6} y={y + 14}>
                {fmt(r.count)}
                <tspan className="ch-axis dim">
                  {" · "}
                  {r.share < 0.005 ? "<1" : Math.round(r.share * 100)}%
                </tspan>
              </text>
            </g>
          );
        })}
      </svg>
    </Plot>
  );
}
