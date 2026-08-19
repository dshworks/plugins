import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPlugin, getTag, installCommand, saidPulse } from "@/lib/data";
import { tagLabel } from "@/lib/tags";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPlugin(slug);
  if (!p) return { title: "Not found" };
  const desc = p.description ?? `A DeepSeek Harness plugin: ${p.repo}.`;
  return {
    title: p.name,
    description: desc.slice(0, 200),
    alternates: { canonical: `/p/${p.slug}` },
    openGraph: { title: `${p.name} — dsh plugins`, description: desc.slice(0, 200) },
  };
}

// Five rows, in the order a reader actually asks them. Every answer is a fact
// already in the registry or arithmetic on one — nothing here is scored,
// graded, or estimated. A directory that invents a number is asking to be
// believed, which is the thing this site exists not to do. That rule is also
// why the fourth row says "carries the memory tag" and not "does this job":
// the tag is what the data supports, and the stronger sentence would be a lie
// wearing a fact's clothes.
export default async function PluginPage({ params }: Props) {
  const { slug } = await params;
  const p = await getPlugin(slug);
  if (!p) notFound();

  const tag = p.tag ? await getTag(p.tag) : null;
  const siblings = (tag?.plugins ?? []).filter((s) => s.slug !== p.slug);
  const fresher = siblings.filter(
    (s) => s.days !== null && p.pulse.days !== null && s.days < p.pulse.days,
  );

  return (
    <main className="wrap">
      <header style={{ paddingTop: "2rem" }}>
        <h1>{p.name}</h1>
        <p className="meta">
          <a href={`https://github.com/${p.repo}`}>{p.repo}</a>
          <span className="dot">·</span>
          {p.stars.toLocaleString()}★
          <span className="dot">·</span>
          {saidPulse(p.pulse)}
          {p.official && (<><span className="dot">·</span><span className="pill">first-party</span></>)}
        </p>
        {p.description && <p className="lede">{p.description}</p>}
        {/* The repository stopped resolving. Said at the top, before the
            install command, because a reader who copies that command and gets
            a 404 has been failed by this page — and said as "gone", not as a
            quality judgment, since a deleted repo and a repo made private look
            identical from outside and one of them can come back. The row and
            its receipt stay: the install path really was verified on the date
            below, and deleting that history would be the worse record. */}
        {p.status === "broken" && (
          <p className="fine" style={{ maxWidth: "var(--measure)" }}>
            <span className="pill warn">repo gone</span> As of the last sweep,{" "}
            <code>{p.repo}</code> no longer resolves on GitHub — deleted, or made private. The
            install command below will fail. Everything else on this page is the record of what
            was true while it existed;{" "}
            <a href="https://github.com/dshworks/awesome-dsh-plugins/blob/main/data/gone.json">
              the check is published
            </a>
            .
          </p>
        )}
      </header>

      <div className="panel">
        <Row label="Proof">
          {p.proof ? (
            <>
              <p style={{ marginBottom: "0.35rem" }}>
                <a href={p.proof.url}>
                  <code>{p.proof.path}</code>
                </a>{" "}
                carries <code>{p.proof.key}</code>.
              </p>
              <p className="fine">
                That file, on the default branch, is why this is listed. Open it. It is not a
                badge and not a score — every other directory in this ecosystem prints{" "}
                <em>verified</em> and none of them will tell you what they read.
              </p>
            </>
          ) : (
            <>
              <p style={{ marginBottom: "0.35rem" }}>
                <span className="pill warn">no receipt</span>
              </p>
              <p className="fine">
                Nothing in this repo proved an install path when it was last read. The row is kept
                and marked rather than deleted — an unreadable tree and a dead project look the
                same from outside.
              </p>
            </>
          )}
        </Row>

        <Row label="Install">
          <code className="cmd">{installCommand(p)}</code>
          <p className="fine" style={{ margin: "0.5rem 0 0" }}>
            {p.npm ? (
              <>
                Published to npm as <code>{p.npm}</code>.
              </>
            ) : (
              <>
                Installed from git. <strong>Git installs run code on your machine at install
                time, outside any sandbox</strong> — pin a commit and read the{" "}
                <code>prepare</code> script first.
              </>
            )}
          </p>
        </Row>

        <Row label="Pulse">
          <p style={{ marginBottom: "0.35rem" }}>
            {saidPulse(p.pulse)}
            {tag && fresher.length > 0 && (
              <>
                {" "}— {fresher.length.toLocaleString()} of the {(tag.count - 1).toLocaleString()}{" "}
                others tagged <code>{tag.tag}</code> pushed more recently.
              </>
            )}
            {tag && fresher.length === 0 && tag.count > 1 && (
              <>
                {" "}— the most recently pushed of the {tag.count.toLocaleString()} plugins tagged{" "}
                <code>{tag.tag}</code>.
              </>
            )}
          </p>
          <p className="fine">
            dsh is a developer preview that has already removed one manifest format with no
            migration, so this is the signal that matters most and the one nobody publishes.
            Checked against dsh <code>{p.verifiedAgainst ?? "unknown"}</code> on{" "}
            {p.lastVerified ?? "an unrecorded date"}.
          </p>
        </Row>

        {tag && tag.count > 1 && (
          <Row label="Also">
            <p style={{ marginBottom: "0.35rem" }}>
              <strong>{tag.count.toLocaleString()}</strong> plugins in the registry carry the{" "}
              <a href={`/tag/${tag.tag}`}>{tagLabel(tag.tag)}</a> tag. Freshest first:
            </p>
            <p className="fine" style={{ marginBottom: "0.6rem" }}>
              A tag is a shelf, not a verdict — this one holds things that overlap and things
              that only look like they do. It is here so you can see the crowd before you pick
              from it, which is more than a card in a grid of six thousand will ever tell you.
            </p>
            <ul className="rows">
              {siblings.slice(0, 5).map((s) => (
                <li key={s.slug}>
                  <span className="line">
                    <a href={`/p/${s.slug}`}>{s.name}</a>
                    <span className="fine">
                      {s.stars.toLocaleString()}★
                      <span className="dot">·</span>
                      {s.days === null ? "no push date" : `${s.days}d`}
                      {s.npm && (<><span className="dot">·</span>npm</>)}
                    </span>
                  </span>
                  {s.description && <p className="desc">{s.description}</p>}
                </li>
              ))}
            </ul>
          </Row>
        )}

        <Row label="Not">
          <p className="fine" style={{ marginBottom: 0 }}>
            Not a security review — an install path was checked, not a codebase. Not a quality
            ranking — stars are a dated snapshot carried so you can sort, not an opinion. Not
            official — dsh is DeepSeek&rsquo;s, this registry is not.
          </p>
        </Row>
      </div>

      <p className="fine">
        <a href={`https://github.com/${p.repo}`}>Source</a>
        <span className="dot">·</span>
        <a href="https://dsh.works/awesome-dsh-plugins/">The whole registry</a>
        <span className="dot">·</span>
        <a href={`/api/plugins/${p.slug}`}>This page as JSON</a>
      </p>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="row">
      <div className="label">{label}</div>
      <div className="body">{children}</div>
    </div>
  );
}
