import type { Metadata } from "next";
import { getNotes } from "@/lib/notes";

export const metadata: Metadata = {
  title: "Notes",
  description:
    "Dated notes on what changed under the dsh plugin ecosystem: releases, prices, and the censuses this site publishes.",
  alternates: { canonical: "/notes", types: { "application/rss+xml": "/notes/feed.xml" } },
};

// Newest first, one row each: the date, the title, the summary. A note is a
// dated record, so the date leads and is never rewritten.
export default function NotesIndex() {
  const notes = getNotes();
  return (
    <main className="wrap">
      <header style={{ paddingTop: "2.5rem" }}>
        <h1>Notes</h1>
        <p className="lede">
          What changed under the plugins this site measures, dated, with the sources linked so you
          can check it. Field notes on the harness itself live in{" "}
          <a href="https://github.com/dshworks/howto-dsh">howto-dsh</a>. Theme news is on{" "}
          <a href="https://dshthemes.com/notes/">dshthemes.com/notes</a>.
        </p>
        <p className="fine">
          <a href="/notes/feed.xml">RSS</a>
        </p>
      </header>
      <ul className="rows">
        {notes.map((n) => (
          <li key={n.slug}>
            <span className="line">
              <span className="fine">{n.date}</span>
              <a href={`/notes/${n.slug}`}>{n.title}</a>
            </span>
            {n.summary && <p className="desc">{n.summary}</p>}
          </li>
        ))}
      </ul>
    </main>
  );
}
