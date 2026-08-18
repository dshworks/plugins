import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTag } from "@/lib/data";
import { tagLabel } from "@/lib/tags";

type Props = { params: Promise<{ tag: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const file = await getTag(tag);
  if (!file) return { title: "Not found" };
  return {
    title: `${file.count} plugins tagged ${tagLabel(file.tag)}`,
    description: `Every DeepSeek Harness plugin carrying the ${file.tag} tag, ordered by last push rather than by stars.`,
    alternates: { canonical: `/tag/${file.tag}` },
  };
}

// The crowd page. Twenty other directories show you 451 memory-ish plugins as
// 451 separate cards and leave you to work out that most of them overlap.
// Ordered by last push, because "which of these still works" is the question
// a pile of near-identical plugins actually raises — and a star count from
// whenever a repo was popular does not answer it.
export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const file = await getTag(tag);
  if (!file) notFound();

  const fortnight = file.plugins.filter((p) => p.days !== null && p.days <= 14).length;
  const cold = file.plugins.filter((p) => p.days !== null && p.days > 180).length;

  return (
    <main className="wrap">
      <header style={{ paddingTop: "2rem" }}>
        <h1>{tagLabel(file.tag)}</h1>
        <p className="lede">
          <strong>{file.count.toLocaleString()}</strong> plugins carry the <code>{file.tag}</code>{" "}
          tag. {fortnight.toLocaleString()} were pushed in the last fortnight
          {cold > 0 && <>, {cold.toLocaleString()} not in six months</>}.
        </p>
        <p className="fine">
          A tag is a shelf, not a verdict: it holds plugins that genuinely overlap and plugins
          that only look like they do. Ordered by last push — dsh is a developer preview that has
          already dropped one manifest format with no migration, so recency is the signal that
          decides whether a plugin is worth your afternoon.
        </p>
      </header>

      <ul className="rows">
        {file.plugins.map((p) => (
          <li key={p.slug}>
            <span className="line">
              <a href={`/p/${p.slug}`}>{p.name}</a>
              <span className="fine">
                {p.stars.toLocaleString()}★
                <span className="dot">·</span>
                {p.days === null ? "no push date" : `${p.days}d`}
                {p.npm && (<><span className="dot">·</span>npm</>)}
              </span>
            </span>
            {p.description && <p className="desc">{p.description}</p>}
          </li>
        ))}
      </ul>

      <p className="fine" style={{ marginTop: "1.5rem" }}>
        <a href="/">All tags</a>
        <span className="dot">·</span>
        <a href={`/api/tags/${file.tag}`}>This list as JSON</a>
      </p>
    </main>
  );
}
