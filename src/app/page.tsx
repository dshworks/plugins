import { getEcosystem, getMeta, getTag } from "@/lib/data";
import { tagLabel } from "@/lib/tags";
import Search from "./search";
import Reveal from "./reveal";
import { AgeChart, ClaimsChart, ShelfMap, StarLadder } from "./charts";

// The dsh.works front door.
//
// The first version of this page made its argument in prose: twenty other
// directories count the same topic, the counts disagree, therefore the count
// is not the interesting number. All true, and all invisible — a reader had to
// get through four paragraphs to reach a claim they still could not check.
//
// This version makes the same argument with the data, because we have it and
// nobody else publishes it. Three measured pictures carry the page: almost the
// whole topic was created in the week after dsh shipped, the directories'
// counts span two orders of magnitude for one universe, and the median plugin
// has a single star. Each says outright where its numbers came from, since a
// chart without provenance is the exact unfalsifiable claim this site exists
// to argue against.
//
// It still does not print a leaderboard. Ranking six thousand plugins by stars
// is ranking noise, and the star ladder below is here to show that, not to
// invite it.
export default async function Home() {
  const [meta, eco] = await Promise.all([getMeta(), getEcosystem()]);
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
    meta.tags.slice(0, 4).map(async (t) => {
      const file = await getTag(t.tag);
      return { tag: t.tag, count: t.count, plugins: (file?.plugins ?? []).slice(0, 3) };
    }),
  );

  const age = eco?.age ?? null;
  const dirs = eco?.directories ?? null;
  const proofPct = Math.round((meta.counts.withProof / meta.counts.plugins) * 100);

  // Derived, not written into the copy. "Eleven days old" was true the
  // afternoon this page was built and would have been a lie by the weekend,
  // and a stale number in the headline of a page arguing for dated claims is
  // the worst possible place to have one.
  const sinceLaunch = age
    ? Math.max(1, Math.round((Date.parse(age.measured) - Date.parse(age.launch)) / 86400000))
    : 0;
  const launchPct = age ? Math.round((age.sinceLaunch / age.total) * 100) : 0;

  return (
    <main className="wrap">
      <Reveal />

      <header style={{ paddingTop: "2.5rem" }}>
        <h1>Should you install it?</h1>
        <p className="lede">
          Twenty-two directories list DeepSeek Harness plugins. Every one answers <em>what
          exists</em>, by scraping the same GitHub topic and printing a count. This one answers
          the next question — for each of{" "}
          <strong>{meta.counts.plugins.toLocaleString()}</strong> plugins: the file that proves it
          installs, whether anyone has touched it since, and how crowded the shelf is that it sits
          on.
        </p>
      </header>

      <ul className="strip">
        <Stat n={meta.counts.plugins.toLocaleString()} k="plugins, each with a page" />
        <Stat n={`${proofPct}%`} k="carry a receipt you can click" />
        <Stat n={eco ? eco.authors.toLocaleString() : "—"} k="different authors" />
        <Stat n={eco ? `${eco.stars.median}★` : "—"} k="median plugin" />
      </ul>

      {age && (
        <>
          <h2>Almost all of this was built last week</h2>
          <p className="lede">
            This is the fact that should govern every install decision here, and no other
            directory prints it. dsh shipped on {age.launch}, {sinceLaunch} days ago.{" "}
            <strong>{age.sinceLaunch.toLocaleString()}</strong> of the{" "}
            {age.total.toLocaleString()} repositories carrying the <code>{age.topic}</code> topic
            — {launchPct}% of them — were created on or after that day. Only{" "}
            {age.beforeFirstDay.toLocaleString()} existed before any of this started.
          </p>
          <div className="figure" data-reveal="age">
            <div className="figure-head">
              <span className="figure-stat">{age.sinceLaunch.toLocaleString()}</span>
              <span className="figure-unit">
                repos created since dsh shipped, out of {age.total.toLocaleString()} in the topic
              </span>
            </div>
            <AgeChart
              series={age.series}
              launch={age.launch}
              before={age.beforeFirstDay}
              firstDay={age.series[0]?.date ?? age.launch}
            />
            <div className="figure-foot">
              <span>
                GitHub search, <code>{age.query}</code> — exact counts, measured {age.measured}
              </span>
              <a href="https://github.com/dshworks/plugins/blob/main/scripts/measure-ecosystem.mjs">
                re-derive it
              </a>
            </div>
          </div>
          <p className="fine">
            So &ldquo;is it maintained?&rdquo; barely discriminates here. Nearly every one of
            these repos was pushed this week because nearly every one was <em>written</em> this
            week — a push date cannot separate a project from a weekend upload when nothing is old
            enough to have gone stale. That is precisely why every row on this site carries a file
            you can open instead of a badge you have to believe.
          </p>
        </>
      )}

      <h2>Find one</h2>
      <Search count={meta.counts.plugins} tags={meta.tags} />

      <h2>The shelves</h2>
      <p className="fine">
        Where the pile is deepest. A tag is a shelf, not a verdict — {meta.tags[0]?.count.toLocaleString()}{" "}
        plugins carry <code>{meta.tags[0]?.tag}</code> and they do not all do the same thing.
        Inside each, the order is by last push, never by stars.
      </p>
      <ShelfMap tags={eco?.tags ?? meta.tags} />

      <div style={{ marginTop: "2rem" }}>
        {shelves.map((t, gi) => (
          <section key={t.tag} style={{ marginBottom: "1.4rem" }} data-reveal="shelves">
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
            {gi === shelves.length - 1 && (
              <p className="fine" style={{ marginTop: "0.8rem" }}>
                <a href="/api/plugins">All {meta.counts.tags} shelves are in the API →</a>
              </p>
            )}
          </section>
        ))}
      </div>

      {dirs && (
        <>
          <h2>A count is a policy, not a fact</h2>
          <p className="lede">
            These sites index the same GitHub topic. They report between{" "}
            {Math.min(...dirs.sites.map((s) => s.claims)).toLocaleString()} and{" "}
            {Math.max(...dirs.sites.map((s) => s.claims)).toLocaleString()} plugins for it. Nobody
            is lying: each number is a filter — what counts as installable, what got reviewed,
            what the sweep could reach — printed on the front page as though it were a
            measurement.
          </p>
          <div className="figure" data-reveal="claims">
            <div className="figure-head">
              <span className="figure-stat">
                {Math.round(Math.max(...dirs.sites.map((s) => s.claims)) / Math.min(...dirs.sites.map((s) => s.claims)))}×
              </span>
              <span className="figure-unit">
                between the largest and smallest claim about one universe
              </span>
            </div>
            <ClaimsChart sites={dirs.sites} topicTotal={age?.total ?? 0} />
            <div className="figure-foot">
              <span>
                {dirs.method}, {dirs.surveyed} — {dirs.note}
              </span>
              <a href="https://github.com/dshworks/plugins/blob/main/data/directories.json">the list</a>
            </div>
          </div>
          <p className="fine">
            Ours is the pink bar, on the same terms as everyone else&rsquo;s. 6,290 is a policy
            too — it is what survived a sweep that publishes both what it kept and what it cut.
            The argument of this site is not that our number is better. It is that a number is the
            wrong thing to compare, and the receipt on each row is the right one.
          </p>
        </>
      )}

      {eco && (
        <>
          <h2>What a star count is worth here</h2>
          <div className="figure" data-reveal="stars">
            <div className="figure-head">
              <span className="figure-stat">{eco.stars.median}★</span>
              <span className="figure-unit">
                is the median plugin;{" "}
                {(
                  ((eco.stars.ladder.find((l) => l.min === 1)?.count ?? 0) / meta.counts.plugins) *
                  100
                ).toFixed(0)}
                % have even one
              </span>
            </div>
            <StarLadder ladder={eco.stars.ladder} total={meta.counts.plugins} />
            <div className="figure-foot">
              <span>Counted from the registry, stars as of {eco.built}</span>
              <a href="/api/plugins">the data</a>
            </div>
          </div>
          <p className="fine">
            Carried so you can sort, printed so you can see what sorting by it would do. In an
            ecosystem this young a star mostly records who posted first, not what works — which is
            why nothing on this site is ordered by it.
          </p>
        </>
      )}

      <h2>What we do instead</h2>
      <div className="panel">
        <div className="row">
          <div className="label">Proof</div>
          <div className="body">
            <p style={{ marginBottom: 0 }}>
              An entry carries <code>evidence</code>: the file that proves it installs, as{" "}
              <code>path#key</code> — <code>package.json#dsh.bundle</code>,{" "}
              <code>skills/reviewer/SKILL.md#frontmatter</code>. A link you open, not a badge you
              trust. Other directories print <em>verified</em>; none will tell you what they read.{" "}
              {meta.counts.withProof.toLocaleString()} of {meta.counts.plugins.toLocaleString()}{" "}
              carry one, and the {(meta.counts.plugins - meta.counts.withProof).toLocaleString()}{" "}
              that do not say so on their own page.
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
              with dsh&rdquo; is a rumour. This build was checked against{" "}
              <code>{meta.verifiedAgainst ?? "—"}</code>.
            </p>
            {/* The gap, printed rather than papered over. Relabelling 6,290 rows
                to whatever shipped last night would take one sed and destroy the
                only thing that makes them worth reading. */}
            {age?.release && meta.verifiedAgainst && age.release.version !== meta.verifiedAgainst && (
              <p className="fine" style={{ margin: "0.6rem 0 0" }}>
                <span className="pill warn">behind</span> dsh{" "}
                <code>{age.release.version}</code> shipped{" "}
                {age.release.published ?? "recently"} — newer than the release these rows were
                checked against. Nothing here has been re-verified under it yet, and we would
                rather say so than quietly change the label. Treat every install path as checked
                under <code>{meta.verifiedAgainst}</code> until the next sweep dates it forward.
              </p>
            )}
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
        Web UI — {meta.counts.themes.toLocaleString()} of them, same receipt discipline, plus real
        screenshots and live in-browser previews in <a href="/awesome-dsh-themes/">the gallery</a>.
      </p>
      <p>
        <a href="https://github.com/dshworks/howto-dsh">howto-dsh</a> is what registry data cannot
        tell you: how composition actually works, which tutorials are already wrong, and where the
        harness will bite. Every claim cites a source path in the harness repo so you can
        re-verify it instead of believing us.
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
        read the <code>prepare</code> script. When {launchPct}% of the topic was written in the
        last {sinceLaunch} days, that matters more than usual.
      </p>
      <p className="fine">
        <strong>Not a quality ranking.</strong> Star counts are a dated snapshot of a repo&rsquo;s
        popularity, carried so you can sort; they are not an opinion. Nothing here is sold,
        sponsored, or promoted.
      </p>
      <p className="fine">
        <strong>Not eternal.</strong> Preview software moves weekly. Anything checked against an
        older release is marked as such rather than quietly refreshed.
      </p>
    </main>
  );
}

function Stat({ n, k }: { n: string; k: string }) {
  return (
    <li>
      <span className="n">{n}</span>
      <span className="k">{k}</span>
    </li>
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
