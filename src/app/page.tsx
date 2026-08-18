import { getMeta, getTag } from "@/lib/data";
import { tagLabel } from "@/lib/tags";
import Search from "./search";

// The home page states the thesis and then gets out of the way. It does not
// print a leaderboard: twenty other directories rank this same topic by stars,
// and a ranking by popularity is the one thing the data cannot support.
export default async function Home() {
  const meta = await getMeta();
  if (!meta) return <main className="wrap"><h1>Data not built</h1><p>Run <code>npm run data</code>.</p></main>;

  const freshest = await Promise.all(
    meta.tags.slice(0, 6).map(async (t) => {
      const file = await getTag(t.tag);
      return { tag: t.tag, count: t.count, plugins: (file?.plugins ?? []).slice(0, 3) };
    }),
  );

  return (
    <main className="wrap">
      <header style={{ paddingTop: "2.5rem" }}>
        <h1>Should you install it?</h1>
        <p className="lede">
          There are more than twenty directories of DeepSeek Harness plugins. Every one of them
          answers <em>what exists</em>, by scraping the same GitHub topic and printing a count —
          the counts range from 20 to 6,685 for the same universe, which tells you the number is
          a filter policy, not a fact.
        </p>
        <p className="lede">
          This one answers the next question. For each of{" "}
          <strong>{meta.counts.plugins.toLocaleString()}</strong> plugins: the file that proves it
          installs, whether anyone still maintains it, and how crowded the shelf is that it sits
          on.
        </p>
        <p className="fine">
          {meta.counts.withProof.toLocaleString()} of {meta.counts.plugins.toLocaleString()} carry
          a receipt you can click · {meta.counts.npm.toLocaleString()} install from npm · built{" "}
          {meta.built} from the{" "}
          <a href="https://github.com/dshworks/awesome-dsh-plugins">open registry</a>, checked
          against dsh <code>{meta.verifiedAgainst ?? "—"}</code>
        </p>
      </header>

      <h2>Search</h2>
      <Search count={meta.counts.plugins} tags={meta.tags} />

      <h2>The crowded shelves</h2>
      <p className="fine">
        Where the ecosystem is piling up. Each list is ordered by last push, not by stars — the
        question a pile of near-identical plugins raises is which of them still works, and
        popularity does not answer it. A tag is a shelf, not a verdict.
      </p>
      {freshest.map((t) => (
        <section key={t.tag} style={{ marginBottom: "1.6rem" }}>
          <h3>
            <a href={`/tag/${t.tag}`}>{tagLabel(t.tag)}</a>{" "}
            <span className="fine">{t.count.toLocaleString()} plugins</span>
          </h3>
          <ul className="rows">
            {t.plugins.map((s) => (
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
        </section>
      ))}

      <h2>What this is not</h2>
      <p className="fine">
        Not official — dsh is DeepSeek&rsquo;s, at{" "}
        <a href="https://github.com/deepseek-ai/deepseek-harness">deepseek-ai/deepseek-harness</a>;
        this is community-run and unaffiliated. Not a security review — an install path was
        checked, not a codebase. Not a marketplace — nothing here is sold, ranked for payment, or
        promoted. The data is MIT, open, and the same JSON every page on this site is rendered
        from: <a href="/api/plugins">/api/plugins</a>.
      </p>
    </main>
  );
}
