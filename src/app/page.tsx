import { getMeta, getTag } from "@/lib/data";
import { tagLabel } from "@/lib/tags";
import Search from "./search";

// The dsh.works front door. It replaced a static landing page that listed what
// the org publishes; this one leads with the question a visitor actually has —
// should I install this thing — and lists what we publish underneath, because
// the registries exist to answer that question and not the other way round.
//
// It deliberately does not print a leaderboard. Twenty other directories rank
// this same topic by stars, and a popularity ranking is the one claim the data
// cannot support.
export default async function Home() {
  const meta = await getMeta();
  if (!meta) {
    return (
      <main className="wrap">
        <h1>Data not built</h1>
        <p>
          Run <code>npm run data</code>.
        </p>
      </main>
    );
  }

  const shelves = await Promise.all(
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
          answers <em>what exists</em>, by scraping the same GitHub topic and printing a count.
          The counts run from 20 to 6,685 for the same universe — which tells you the number is a
          filter policy, not a fact.
        </p>
        <p className="lede">
          This one answers the next question. For each of{" "}
          <strong>{meta.counts.plugins.toLocaleString()}</strong> plugins: the file that proves it
          installs, whether anyone still pushes to it, and how crowded the shelf is that it sits
          on.
        </p>
        <p className="fine">
          {meta.counts.withProof.toLocaleString()} carry a receipt you can click
          <span className="dot">·</span>
          {meta.counts.npm.toLocaleString()} install from npm
          <span className="dot">·</span>
          {meta.counts.themes.toLocaleString()} themes next door
          <span className="dot">·</span>
          built {meta.built} against dsh <code>{meta.verifiedAgainst ?? "—"}</code>
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
      {shelves.map((t) => (
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
                    {s.npm && (
                      <>
                        <span className="dot">·</span>npm
                      </>
                    )}
                  </span>
                </span>
                {s.description && <p className="desc">{s.description}</p>}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <h2>Why the receipt matters</h2>
      <div className="panel">
        <div className="row">
          <div className="label">Proof</div>
          <div className="body">
            <p style={{ marginBottom: 0 }}>
              An entry carries <code>evidence</code>: the file that proves it installs, as{" "}
              <code>path#key</code> — <code>package.json#dsh.bundle</code>,{" "}
              <code>skills/reviewer/SKILL.md#frontmatter</code>. A link you open, not a badge you
              trust. Twenty other directories print <em>verified</em>; none will tell you what
              they read.
            </p>
          </div>
        </div>
        <div className="row">
          <div className="label">Rejections</div>
          <div className="body">
            <p style={{ marginBottom: 0 }}>
              What was swept and left out is published too, with a one-line reason each in{" "}
              <a href="https://github.com/dshworks/awesome-dsh-plugins/blob/main/data/rejected.json">
                rejected.json
              </a>
              . Rejections of judgment are permanent; rejections of fact carry a{" "}
              <code>recheckAfter</code> date and get swept again, so shipping a manifest late is
              not a life sentence. A list that hides its cutting-room floor is asking you to take
              curation on faith.
            </p>
          </div>
        </div>
        <div className="row">
          <div className="label">Dated</div>
          <div className="body">
            <p style={{ marginBottom: 0 }}>
              Every row carries <code>lastVerified</code> and <code>verifiedAgainst</code> — the
              exact dsh release it was checked under. The harness is a developer preview that has
              already removed one manifest format with no migration, so an undated &ldquo;works
              with dsh&rdquo; is a rumour.
            </p>
          </div>
        </div>
      </div>

      <h2>The registries</h2>
      <p>
        <a href="https://github.com/dshworks/awesome-dsh-plugins">awesome-dsh-plugins</a> is the
        open dataset every page here is rendered from: {meta.counts.plugins.toLocaleString()}{" "}
        entries, MIT, with 98.8% of the <code>dsh-plugin</code> topic decided and the rejections
        published. <a href="/awesome-dsh-plugins/">The reef</a> browses the same data as a
        gallery.
      </p>
      <p>
        <a href="https://github.com/dshworks/awesome-dsh-themes">awesome-dsh-themes</a> covers
        ThemeRuntime packages, <code>--dsw-*</code> token overrides, and skins that restyle the
        Web UI — {meta.counts.themes.toLocaleString()} of them, same receipt discipline, plus
        real screenshots and live in-browser previews in{" "}
        <a href="/awesome-dsh-themes/">the gallery</a>.
      </p>
      <p>
        <a href="https://github.com/dshworks/howto-dsh">howto-dsh</a> is what registry data
        cannot tell you: how composition actually works, which tutorials are already wrong, and
        where the harness will bite. Every claim cites a source path in the harness repo so you
        can re-verify it instead of believing us.
      </p>

      <h2 id="ours">What we ship ourselves</h2>
      <p className="fine">
        Three plugins, in the registry on the same terms as everyone else&rsquo;s — same schema,
        same proof file, same verified-against date. Reading six thousand plugins taught us what
        was missing. No other directory in this ecosystem ships one.
      </p>
      <ul className="rows">
        <li>
          <span className="line">
            <a href="/dsh-meter/">dsh-meter</a>
            <span className="fine">cost</span>
          </span>
          <p className="desc">
            DeepSeek bills by the hour now. One line under the composer: what this session cost,
            which tariff is running, how long until it flips, and the balance behind it. Both
            published rate cards, priced at dispatch time.
          </p>
        </li>
        <li>
          <span className="line">
            <a href="https://github.com/dshworks/dsh-watch">dsh-watch</a>
            <span className="fine">unattended</span>
          </span>
          <p className="desc">
            Background stream listeners that wake the agent: matching lines from a command or a
            growing file arrive as batched, budgeted notices — plus a daemon host, because no
            stock dsh surface keeps an agent standing.
          </p>
        </li>
        <li>
          <span className="line">
            <a href="/dsh-crew/">dsh-crew</a>
            <span className="fine">crew</span>
          </span>
          <p className="desc">
            Claude Code and Codex, each in a real terminal pane inside your dsh session —
            typeable, with five tools so the dsh agent seats them, hands them work, and reads
            their screens.
          </p>
        </li>
      </ul>

      <h2>Use it as an API</h2>
      <p className="fine">
        Open data, MIT, no key, CORS open. The audience for a plugin directory is people running
        agents; making them parse HTML would be a strange way to serve them.
      </p>
      <ul className="rows">
        <ApiRow href="/api/plugins" what="Counts, the tag list, endpoints, build date." />
        <ApiRow href="/api/plugins/dsh-context" what="One plugin: its proof, install command, pulse and shelf." />
        <ApiRow href="/api/tags/memory" what="A whole shelf, ordered by last push." />
        <ApiRow href="/llms.txt" what="The map, written for agents, in one fetch." />
        <ApiRow href="/awesome-dsh-plugins/plugins.json" what="The upstream registry, unprojected." />
      </ul>

      <h2>Shipping a plugin?</h2>
      <p>
        Tag the repo <a href="https://github.com/topics/dsh-plugin"><code>dsh-plugin</code></a>.
        There is no official marketplace; that topic is the official discovery surface and it is
        what the sweep watches — so tagging is enough to be found, no PR required. To land faster
        or fix a wrong row, open a PR against{" "}
        <a href="https://github.com/dshworks/awesome-dsh-plugins/blob/main/data/plugins.json">
          <code>data/plugins.json</code>
        </a>
        .
      </p>

      <h2>What this is not</h2>
      <p className="fine">
        <strong>Not official.</strong> dsh is DeepSeek&rsquo;s, at{" "}
        <a href="https://github.com/deepseek-ai/deepseek-harness">deepseek-ai/deepseek-harness</a>{" "}
        and on npm as <code>@deepseek-ai/dsh</code>. This site is community-run and unaffiliated.
      </p>
      <p className="fine">
        <strong>Not a security review.</strong> An install path was verified, not a codebase. Git
        installs run code on your machine at install time, outside any sandbox — pin a commit and
        read the <code>prepare</code> script.
      </p>
      <p className="fine">
        <strong>Not a quality ranking.</strong> Star counts are a dated snapshot of a
        repo&rsquo;s popularity, carried so you can sort; they are not an opinion. Nothing here
        is sold, sponsored, or promoted.
      </p>
      <p className="fine">
        <strong>Not eternal.</strong> Preview software moves weekly. Anything checked against an
        older release is marked as such rather than quietly refreshed.
      </p>
    </main>
  );
}

function ApiRow({ href, what }: { href: string; what: string }) {
  return (
    <li>
      <span className="line">
        <a href={href}>
          <code>dsh.works{href}</code>
        </a>
      </span>
      <p className="desc">{what}</p>
    </li>
  );
}
