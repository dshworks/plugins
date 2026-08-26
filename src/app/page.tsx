import { getEcosystem, getMeta, getSeams, getSpecimen, getSponsors, getTag, saidPulse } from "@/lib/data";
import { tagLabel } from "@/lib/tags";
import { OURS, oursCount } from "@/lib/ours";
import Console from "./console";
import Seats from "./seats";
import Reveal from "./reveal";
import { AgeChart, SeamMap, ShelfMap, StarLadder } from "./charts";

/* THE PROMISE
 *
 * THESIS          This page is the install decision *running*, not an essay
 *                 about it. It refuses the awesome-list front door, and it
 *                 refuses to rank its competitors on its own front page.
 * OWN-WORLD       House material — black ground, JetBrains Mono 300, 3px
 *                 hairlines, pink section labels, cyan links, charts in one
 *                 accent. The sponsor board is the single thing that breaks
 *                 register: a matte split-flap plate in its own world, so the
 *                 advertising reads as laid ON the page, not drawn into it.
 * STORY           A stranger types before reading; sees one real plugin
 *                 already decided, receipt clickable; watches a seat on the
 *                 board demonstrate what buying it would do; then meets three
 *                 measured charts about this ecosystem, not about rivals -- the
 *                 last of which, the seam map, is the only one that hands the
 *                 reader something to go and do.
 * FIRST VIEWPORT  Site bar; one title line with the live counts; the console
 *                 frame — pink caret, live field, indexed count — holding a
 *                 real plugin's five-line verdict; the board's top edge
 *                 arriving at the fold.
 * FORM            Page: staging "First Viewport Is the Product Running", roll
 *                 3778195c. Board: staging "Sponsor Seats as a Numbered
 *                 Plate" (brief-pinned by the user), dressed in
 *                 worlds/split-flap-departure-board.
 * --
 * FINISH          unreviewed is unfinished: this build ends with the review,
 *                 the verdict, and DESIGN.md.
 */
export default async function Home() {
  const [meta, eco, specimen, sponsors, seams] = await Promise.all([
    getMeta(),
    getEcosystem(),
    getSpecimen(),
    getSponsors(),
    getSeams(),
  ]);
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
  const proofPct = Math.round((meta.counts.withProof / meta.counts.plugins) * 100);
  const p = specimen?.plugin ?? null;
  // Printed rather than absorbed. 6,290 with 59 dead rows inside it is exactly
  // the kind of number this site was built to argue against.
  const gone = meta.counts.gone ?? 0;

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

      {/* The first viewport. One line of orientation, then the machine. The
          h1 is small on purpose: a display headline here would be the site
          talking about itself in the space where it could be working. */}
      <header style={{ paddingTop: "1.8rem" }}>
        <h1>Should you install it?</h1>
        <p className="fine" style={{ maxWidth: "var(--measure)" }}>
          {meta.counts.plugins.toLocaleString()} DeepSeek Harness plugins, {proofPct}% carrying a
          receipt you can open{gone ? `, ${gone} whose repository has since vanished and say so` : ""}.
          Every one of them has a page that answers this. Type, or read the one below.
        </p>
      </header>

      <Console count={meta.counts.plugins} tags={meta.tags}>
        {p ? (
          <>
            <div className="console-head">
              <span className="who">
                <a href={`/p/${p.slug}`}>{p.name}</a>
              </span>
              <span className="fine">
                {p.stars.toLocaleString()}★<span className="dot">·</span>
                {saidPulse(p.pulse)}
                {p.npm && (
                  <>
                    <span className="dot">·</span>npm
                  </>
                )}
              </span>
              <span className="console-slot">decided</span>
            </div>

            <dl className="verdict">
              <dt>Proof</dt>
              <dd>
                {p.proof ? (
                  <a href={p.proof.url}>
                    <code>
                      {p.proof.path}#{p.proof.key}
                    </code>
                  </a>
                ) : (
                  <span className="dim">no receipt on file, and its page says so</span>
                )}
              </dd>

              <dt>Install</dt>
              <dd>
                <code className="cmd">
                  dsh plugin --profile web add {p.npm ?? `github:${p.repo}`}
                </code>
              </dd>

              <dt>Pulse</dt>
              <dd className="dim">
                {saidPulse(p.pulse)}
                {p.shelf && (
                  <>
                    {" · "}
                    {p.shelf.rank === 1 ? "the most recent" : `${ordinal(p.shelf.rank)} most recent`} of
                    the {p.shelf.size.toLocaleString()} on <a href={`/tag/${p.shelf.tag}`}>{tagLabel(p.shelf.tag)}</a>
                  </>
                )}
              </dd>

              <dt>Not</dt>
              <dd className="dim">
                a security review. That install path was verified against dsh{" "}
                <code>{p.verifiedAgainst ?? "—"}</code> on {p.lastVerified ?? "an earlier sweep"};
                the code behind it was not read.
              </dd>
            </dl>

            <div className="console-foot">
              {/* The rule is printed because this slot is worth money and is
                  not for sale. A directory that shows you one plugin without
                  saying how it got there has sold you something already. */}
              <span>
                Shown by rule, not placement: the {specimen?.rule ?? "freshest complete entry"}.
              </span>
              <a href={`/p/${p.slug}`}>its page →</a>
            </div>
          </>
        ) : (
          <p className="fine" style={{ margin: 0 }}>
            No entry currently carries a complete receipt. Type to search{" "}
            {meta.counts.plugins.toLocaleString()} rows.
          </p>
        )}
      </Console>

      {sponsors && <Seats data={sponsors} site="dsh.works" />}

      {/* The bridge out of the seats and into the evidence: four measured
          facts, no adjectives, each one recomputed on every build. It is also
          the answer to "who is this" for a reader who scrolled past the
          console without touching it. */}
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

      {seams && (
        <>
          <h2 id="unbuilt">What nobody has built yet</h2>
          <p>
            {seams.total.toLocaleString()} plugins.{" "}
            {seams.seams.find((x) => x.id === "tools")?.count.toLocaleString()} of them add a
            tool. {seams.seams.find((x) => x.id === "webServer")?.count.toLocaleString()} add a
            page. That is the ecosystem.
          </p>
          <p>The harness has rather more surface than that.</p>
          <div className="figure" data-reveal="seams">
            <div className="figure-head">
              <span className="figure-stat">{seams.ratio}&times;</span>
              <span className="figure-unit">
                more plugins add a tool than touch the median deep seam &mdash;{" "}
                {seams.underOnePct} of {seams.deepCount} are under 1%
              </span>
            </div>
            <SeamMap seams={seams.seams} total={seams.total} />
            <div className="figure-foot">
              <span>
                Pink changes what the agent does. Linear, so the short bars are honestly
                short &mdash; {seams.seams[0].count} plugins to{" "}
                {seams.loudest.toLocaleString()}, counted over every name and description in the
                registry, read against dsh <code>{seams.harness}</code>.
              </span>
              <a href="https://github.com/dshworks/plugins/blob/main/scripts/measure-seams.mjs">
                the script
              </a>
            </div>
          </div>
          <p>
            Seventeen of these seams change what the agent <em>does</em> &mdash; how it plans,
            what it forgets, when it wakes up, whether it can hold a terminal or spawn a child.
            Eleven are under one percent.{" "}
            {seams.seams.find((x) => x.id === "e2b")?.count} plugins in{" "}
            {seams.total.toLocaleString()} use <code>ctx.e2b</code>.{" "}
            {seams.seams.find((x) => x.id === "invariants")?.count} use{" "}
            <code>ctx.invariants</code>. {seams.seams.find((x) => x.id === "planMode")?.count}{" "}
            mention plan mode, and they are all drawing a UI for it.
          </p>
          <p>
            Nobody closed those doors. <code>ctx.lsp.registerProvider()</code> is right there, it
            is documented, it takes one argument. The short bars are short because a tool plugin
            is an afternoon and a compaction strategy needs an opinion about what to throw away.
            Hard things stay unbuilt. This is not a scandal, it is a to-do list.
          </p>
          <p className="fine">
            If you want to write one and would rather not be the{" "}
            {seams.seams.find((x) => x.id === "tools")?.count.toLocaleString()}th person to wrap an
            API, the bottom of that chart is the list. Each links the file in the harness that
            proves the seam is real, at <code>{seams.harness}</code>:
          </p>
          <ul className="rows">
            {seams.seams
              .filter((x) => x.deep && x.src)
              .slice(0, 5)
              .map((x) => (
                <li key={x.id}>
                  <span className="line">
                    <a
                      href={`https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v${seams.harness}/${x.src}`}
                    >
                      <code>{x.ctx}</code>
                    </a>
                    <span className="fine">
                      {x.count} of {seams.total.toLocaleString()}
                    </span>
                  </span>
                  <p className="desc">{x.what}</p>
                </li>
              ))}
          </ul>
          <p>
            The best one: {seams.memoryTagged.toLocaleString()} plugins are tagged{" "}
            <code>memory</code>. {seams.seams.find((x) => x.id === "compaction")?.count} plugins
            in the entire registry mention the context window at all. The largest category in this
            ecosystem is solving the forgetting problem from outside the thing that does the
            forgetting.
          </p>
          <p className="fine">
            We got this wrong first. The original version sampled 227 plugins&rsquo; source, found
            no <code>ctx.lsp</code>, and nearly announced that nobody had built code intelligence
            &mdash; the registry has sixteen, one an explicit language-server provider. A sample
            cannot see a category that is 0.14% of the population. So this is a census over every
            name and description we hold, each row carries the regex that counted it and the
            harness file that proves the seam exists, and both are in{" "}
            <a href="https://github.com/dshworks/plugins/blob/main/data/seams.json">seams.json</a>{" "}
            so you can tell us it is still wrong.
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
              with dsh&rdquo; is a rumour. Most rows here were checked against{" "}
              <code>{meta.verifiedAgainst ?? "—"}</code>
              {(meta.verifiedSpread?.length ?? 0) > 1 && (
                <>
                  {" "}
                  &mdash;{" "}
                  {meta.verifiedSpread!.map(({ version, count }, i) => (
                    <span key={version}>
                      {i > 0 && ", "}
                      {count.toLocaleString()} under <code>{version}</code>
                    </span>
                  ))}
                  . The registry re-verifies in waves, so the newest rows are ahead of the rest;
                  that is the spread, not a rounding
                </>
              )}
              .
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
            {/* latest and next come apart, and when they do a reader who saw
                the release announcement thinks this page is stale. It is not:
                what you install and what exists are different questions. */}
            {age?.release?.ahead?.length ? (
              <p className="fine" style={{ margin: "0.6rem 0 0" }}>
                Newer than that, and not what you get:{" "}
                {age.release.ahead.map((a, i) => (
                  <span key={a.tag}>
                    {i > 0 && ", "}
                    <code>{a.version}</code> has been on npm&rsquo;s{" "}
                    <code>{a.tag}</code> tag since {a.published}
                  </span>
                ))}
                . <code>npx @deepseek-ai/dsh</code> follows <code>latest</code>, so it still
                installs <code>{age.release.version}</code>. A plugin author reading release
                notes and a user running the install line are on different versions right now.
              </p>
            ) : null}
          </div>
        </div>
        <div className="row">
          <div className="label">Paid</div>
          <div className="body">
            <p style={{ marginBottom: 0 }}>
              The four gold seats at the top are advertising, priced at{" "}
              {sponsors?.price.said ?? "a published rate"}, and they are the only thing on this
              site money can move. They sit in their own colour, outside the data, marked{" "}
              <code>rel=&quot;sponsored&quot;</code>, and they buy the box — not a row, a rank, a
              tag, a receipt, or a listing decision. <a href="/sponsor">The terms are published</a>{" "}
              for the same reason the rejections are.
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
        Web UI — {meta.counts.themes.toLocaleString()} of them, same receipt discipline, plus real
        screenshots and live in-browser previews at{" "}
        <a href="https://dshthemes.com">dshthemes.com</a>.
      </p>
      <p>
        <a href="https://github.com/dshworks/howto-dsh">howto-dsh</a> is what registry data cannot
        tell you: how composition actually works, which tutorials are already wrong, and where the
        harness will bite. Every claim cites a source path in the harness repo so you can
        re-verify it instead of believing us.
      </p>

      <h2 id="ours">What we ship ourselves</h2>
      <p className="fine">
        {oursCount()} plugins, in the registry on the same terms as everyone else&rsquo;s — same
        schema, same proof file, same verified-against date. Reading ten thousand plugins taught
        us what was missing. No other directory in this ecosystem ships one.
      </p>
      <ul className="rows">
        {OURS.map((p) => (
          <li key={p.name}>
            <span className="line">
              <a href={p.href}>{p.name}</a>
              <span className="fine">{p.kind}</span>
            </span>
            <p className="desc">{p.what}</p>
          </li>
        ))}
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
        . Buying a seat does none of this and is not a shortcut to any of it.
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
        popularity, carried so you can sort; they are not an opinion. Nothing is ranked, scored,
        or graded here.
      </p>
      {/* This paragraph used to read "Nothing here is sold, sponsored, or
          promoted." Four seats are now sold, so the sentence had to change or
          become a lie — and the site's entire product is not lying about what
          it knows. Narrowed rather than deleted: the precise version is a
          stronger claim than the old blanket one, because it can be checked. */}
      <p className="fine">
        <strong>Not for sale, except the four seats.</strong> The gold band at the top is paid
        placement at {sponsors?.price.said ?? "a published rate"} and it is the entire commercial
        surface of this site. No listing, ranking, receipt, tag, description or number anywhere
        else has ever been bought, and the pipeline that produces them{" "}
        <a href="https://github.com/dshworks/plugins/blob/main/scripts/build-data.mjs">
          cannot read the sponsor file
        </a>{" "}
        into a plugin record. <a href="/sponsor">Terms</a>.
      </p>
      <p className="fine">
        <strong>Not eternal.</strong> Preview software moves weekly. Anything checked against an
        older release is marked as such rather than quietly refreshed.
      </p>
    </main>
  );
}

// 1st, 2nd, 3rd — a rank read aloud. English exceptions at 11-13 included,
// because "11st most recent" on a page about care would be its own argument.
function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  return `${n}${["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
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
