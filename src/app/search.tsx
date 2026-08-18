"use client";

import { useEffect, useMemo, useState } from "react";
import { tagLabel } from "@/lib/tags";

// Row shape in index.json: a tuple, not an object. 6,290 objects with eight
// named keys each is 400 KB of repeated key names on the wire; the tuple is
// the same data at less than half the size. It is indexed once, here.
type Row = [slug: string, name: string, desc: string, tag: string, stars: number, days: number, npm: 0 | 1, proof: 0 | 1];

// The index is 924 KB and most visitors never search, so it is not loaded
// until the box is touched. Everything above it was server-rendered and is
// readable — and crawlable — with no JavaScript at all.
export default function Search({ count, tags }: { count: number; tags: { tag: string; count: number }[] }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [tag, setTag] = useState<string | null>(null);

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

  const active = q.trim() || tag;

  return (
    <>
      <input
        type="search"
        placeholder={`Search ${count.toLocaleString()} plugins by name or description`}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Search plugins"
      />
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
      {active && (
        <>
          {loading && <p className="fine" style={{ marginTop: "0.8rem" }}>Loading the index…</p>}
          {rows && hits.length === 0 && !loading && (
            <p className="fine" style={{ marginTop: "0.8rem" }}>
              Nothing matches. The registry publishes{" "}
              <a href="https://github.com/dshworks/awesome-dsh-plugins/blob/main/data/rejected.json">
                what it left out
              </a>{" "}
              too — it may be there, with a reason.
            </p>
          )}
          {hits.length > 0 && (
            <ul className="rows" style={{ marginTop: "0.8rem" }}>
              {hits.map((r) => (
                <li key={r[0]}>
                  <span className="line">
                    <a href={`/p/${r[0]}`}>{r[1]}</a>
                    <span className="fine">
                      {r[4].toLocaleString()}★
                      <span className="dot">·</span>
                      {r[5] < 0 ? "no push date" : `${r[5]}d`}
                      {r[6] === 1 && (<><span className="dot">·</span>npm</>)}
                      {r[7] === 0 && (<><span className="dot">·</span><span className="pill warn">no receipt</span></>)}
                    </span>
                  </span>
                  {r[2] && <p className="desc">{r[2]}</p>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
