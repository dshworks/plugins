import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getNote } from "@/lib/notes";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const n = getNote(slug);
  if (!n) return { title: "Not found" };
  return {
    title: n.title,
    description: n.summary.slice(0, 200),
    alternates: { canonical: `/notes/${n.slug}` },
    openGraph: { type: "article", title: n.title, description: n.summary.slice(0, 200) },
  };
}

export default async function NotePage({ params }: Props) {
  const { slug } = await params;
  const n = getNote(slug);
  if (!n) notFound();

  return (
    <main className="wrap">
      <article className="note">
        <header style={{ paddingTop: "2.5rem" }}>
          <p className="fine">
            <a href="/notes">notes</a> · <time dateTime={n.date}>{n.date}</time>
          </p>
          <h1>{n.title}</h1>
          {n.summary && <p className="lede">{n.summary}</p>}
        </header>
        {/* Our own markdown, rendered at build time from content/notes/. */}
        <div className="note-body" dangerouslySetInnerHTML={{ __html: n.html }} />
      </article>
    </main>
  );
}
