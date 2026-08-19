"use client";

import { useEffect, useMemo, useState } from "react";
import { tagLabel } from "@/lib/tags";

// The first viewport, and the whole reason this page was rebuilt.
//
// The old front page opened with a headline and four paragraphs arguing that
// counting plugins is the wrong question. The argument is right; nobody read
// it, because a plugin directory gets a few seconds to prove it is not the
// twenty-second list of the same GitHub topic, and prose cannot prove that.
//
// So the machine goes first. The field is live over all 6,290 rows before you
// have read a word, and underneath it one real plugin is already decided —
// proof file, install command, pulse, shelf, and what none of it is evidence
// of. You feel the product work, and the charts below are then evidence for
// something you have already seen rather than a promise about it.
//
// `children` is that decided plugin, rendered on the server. It is what a
// reader with no JavaScript gets, and it is what shows until the first
// keystroke — this component only ever replaces it, never gates it.

type Row = [slug: string, name: string, desc: string, tag: string, stars: number, days: number, npm: 0 | 1, proof: 0 | 1, gone: 0 | 1];

export default function Console({
  count,
  tags,
  children,
}: {
  count: number;
  tags: { tag: string; count: number }[];
  children: React.ReactNode;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);

  // The index is ~924 KB and most visitors never type, so it is not fetched
  // until the box is actually used. Everything above was server-rendered and
  // is readable — and crawlable — with no JavaScript at all.
  useEffect(() => {
    if (rows || loading || (!q && !tag)) return;
    setLoading(true);
    fetch("/_data/index.json")
      .then((r) => r.json() as Promise<{ plugins: Row[] }>)
      .then((d) => setRows(d.plugins))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [q, tag, rows, loading]);

  const hits = useMemo(() => {
    if (!rows) return [];
    const needle = q.trim().toLowerCase();
    const out: Row[] = [];
    for (const r of rows) {
      if (tag && r[3] !== tag) continue;
      if (needle && !r[1].toLowerCase().includes(needle) && !r[2].toLowerCase().includes(needle)) continue;
      out.push(r);
      if (out.length >= 400) break;
    }
    // Freshest first, as everywhere else on this site. -1 means no push date
    // on record, which sorts last rather than pretending to be day zero.
    return out.sort((a, b) => (a[5] < 0 ? 1e9 : a[5]) - (b[5] < 0 ? 1e9 : b[5]) || b[4] - a[4]).slice(0, 60);
  }, [rows, q, tag]);

  const active = Boolean(q.trim() || tag);
  const matched = rows ? hits.length : 0;

  return (
    <>
      <div className="console">
        <div className="console-q">
          <span className="caret" aria-hidden="true">
            &gt;
          </span>
          <input
            type="search"
            placeholder={`search ${count.toLocaleString()} plugins`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label={`Search ${count} plugins by name or description`}
          />
          <span className="count">
            {active && rows ? `${matched}${matched >= 60 ? "+" : ""} shown` : `${count.toLocaleString()} indexed`}
          </span>
        </div>

        <div className="console-body">
          {active ? (
            <>
              {loading && <p className="fine" style={{ margin: 0 }}>Loading the index…</p>}
              {rows && hits.length === 0 && !loading && (
                <p className="fine" style={{ margin: 0 }}>
                  Nothing matches. The registry publishes{" "}
                  <a href="https://github.com/dshworks/awesome-dsh-plugins/blob/main/data/rejected.json">
                    what it left out
                  </a>{" "}
                  too — it may be there, with a reason.
                </p>
              )}
              {hits.length > 0 && (
                <ul className="rows">
                  {hits.map((r) => (
                    <li key={r[0]}>
                      <span className="line">
                        <a href={`/p/${r[0]}`}>{r[1]}</a>
                        <span className="fine">
                          {r[4].toLocaleString()}★<span className="dot">·</span>
                          {r[5] < 0 ? "no push date" : `${r[5]}d`}
                          {r[6] === 1 && (
                            <>
                              <span className="dot">·</span>npm
                            </>
                          )}
                          {r[7] === 0 && (
                            <>
                              <span className="dot">·</span>
                              <span className="pill warn">no receipt</span>
                            </>
                          )}
                          {/* Said in the result, not only on the page behind
                              it: the reader should know before the click, not
                              after copying the command. */}
                          {r[8] === 1 && (
                            <>
                              <span className="dot">·</span>
                              <span className="pill warn">repo gone</span>
                            </>
                          )}
                        </span>
                      </span>
                      {r[2] && <p className="desc">{r[2]}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            children
          )}
        </div>
      </div>

      <ul className="chips">
        {tags.slice(0, 10).map((t) => (
          <li key={t.tag}>
            <button
              type="button"
              className="chip"
              aria-pressed={tag === t.tag}
              onClick={() => setTag(tag === t.tag ? null : t.tag)}
            >
              {tagLabel(t.tag)} {t.count.toLocaleString()}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
