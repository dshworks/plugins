---
title: dsh 0.2.2-rc.1 is latest, and the 0.2.2 breaks reach every install
summary: npm's latest and next tags both point at dsh 0.2.2-rc.1, published 2026-11-04. It is 0.2.2-alpha.3 plus a vendor bump, so what the 0.2.2 alphas changed now reaches every fresh install. Tool calls go in batches. The Schedule tools and store are rewritten. apply_patch ships off. A bundle can refuse a platform. On one set of 10,714 manifests, 100 plugins that rc.5 installed are refused by rc.1, and 134 go the other way. Our own dsh-watch 0.2.3 installs on rc.1 and never arms its standing watches.
---

npm published `@deepseek-ai/dsh` 0.2.2-rc.1 on 2026-11-04 at 09:20 UTC.
The [GitHub release](https://github.com/deepseek-ai/deepseek-harness/releases/tag/dsh-v0.2.2-rc.1)
followed at 13:07 UTC. By 2026-11-05 13:21 UTC, the last change to the
package, both `latest` and `next` pointed at it. `npx @deepseek-ai/dsh` now
runs it. Its manifest declares `node >=24.9.0`; rc.5's declared no engine.

## What rc.1 is

rc.1 is [4 commits after 0.2.2-alpha.3](https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.2.2-alpha.3...dsh-v0.2.2-rc.1):
a vendor bump and the version bump. It is 2,623 commits after 0.2.1-rc.5. Its
tree carries 98 upgrade guides, the same 98 alpha.3 carries and 54 more than
rc.5.

The install gate,
[plugin-compatibility.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.2-rc.1/packages/boot/app-boot/src/plugin-compatibility.ts),
is byte-identical at rc.5 and rc.1.

## Who is refused now

The front page's census counts the packages the registry lists today, and
that count grew from 6,920 on 2026-11-02 to 10,714. So the 11-02 and 11-07
headlines are not comparable. This comparison holds the population still.
Measured on 2026-11-07, both versions judged the same `latest` manifests of
the same 10,714 packages:

- rc.5 refuses 1,580. rc.1 refuses 1,546.
- **100 install on rc.5 and are refused by rc.1**: 49 by an `engines.dsh`
  range and 51 by a dsh peer range.
- 134 go the other way: rc.5 refused them and rc.1 admits them. All but one
  of their ranges start at a 0.2.2 prerelease. The last admits 0.2.0 and
  0.2.2 and skips 0.2.1.

None of the 100 trips on anything rc.1 introduced. Each range stops before it:

- 20 name 0.2.1-rc.5 alone.
- 26 list exact versions joined by `||`, alone or beside ranges written for
  older dsh. None of those lists has rc.1. 6 of them name 0.2.2-alpha.2 or
  0.2.2-alpha.3, and neither admits rc.1.
- 34 cap at `<0.2.2-0`.
- 14 cap at `<0.2.1`. 12 of those are ranges written for 0.2.0 that admitted
  0.2.1's release candidates only through prerelease ordering. The other 2
  admit nothing but 0.2.1's release candidates.
- 6 cap at `<=0.2.1`, `<=0.2.1-rc.5` or `<=0.2.1-rc.6`.

These are the five of the 100 that npm counted most downloads for, from
2026-10-07 to 2026-11-05:

- `@anionex/dsh-vision-toolkit` 0.1.49, 15,645 downloads: its list stops at
  0.2.1-rc.5.
- `dsh-web-search-pro` 0.2.3, 6,799: capped at `<0.2.2-0`.
- `@anionex/dsh-turn-rewind` 0.3.12, 6,276: its list stops at 0.2.1-rc.5.
- `@anweat/dsh-browser` 0.2.2, 5,813: capped at `<0.2.2-0`.
- `@godv61/dsh-task-engine` 0.40.1, 5,748: lists 0.2.1-rc.3, rc.4 and rc.5.

The packages, the rule each one tripped, and the 134 are in
[/_data/notes/dsh-022-rc1-latest.json](/_data/notes/dsh-022-rc1-latest.json).
The front page's [refusal census](/#installs) re-measures every night.

Our [2026-11-02 note](/notes/rc5-is-latest) suggested
`>=0.2.1-rc.2 <0.2.2-0` for a plugin tested on rc.2. 8 of the 100 carry
exactly that range, and it did its job: it refuses 0.2.2, which changes the
contracts below. Test on rc.1, then widen.

A range meant to stop before 0.2.2 has to say `<0.2.2-0`. The gate compares
with prereleases included, so `<0.2.2` admits 0.2.2-rc.1. So do `~0.2.1` and
`^0.2.1`, which also refuse every 0.2.1 release candidate. If a plugin you
rely on is refused, and you have checked that it works anyway,
`dsh plugin allow-version <package@version> --dsh-version 0.2.2-rc.1 --accept-risk`
exempts that one pair.

## A bundle can name its platforms

A bundle may now declare `dsh.bundle.platforms`: a nonempty list of Node
platform names such as `darwin`, `linux` and `win32`
([bundle-platform.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.2-rc.1/packages/boot/app-boot/src/bundle-platform.ts)).
Leaving it out allows every platform. Aliases like `macos` are invalid. The
check first shipped in 0.2.2-alpha.2, so this is its first time on `latest`.

Measured with the rc.1 CLI on Linux:

- `dsh plugin add` of a bundle declaring `["win32"]` installs the package,
  prints `bundle activation rejected`, leaves the bundle selection unchanged,
  and exits 1.
- A malformed value, `["windows"]`, ends the same command with an uncaught
  error and a stack trace, exit 1. That package also stays installed.

At startup an unsupported bundle's layer is skipped and its selection kept
([app-boot README](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.2-rc.1/packages/boot/app-boot/README.md)).
The Plugins page hides unsupported bundles from its default lists.

Of the 10,248 published packages whose `latest` manifest declares
`dsh.bundle`, 2 declare platforms, and both values are valid.
`@riverzh/dsh-gitbash` says `["win32"]` and `dsh-power-menu-mac` says
`["darwin"]`.

## What the alphas changed, now on latest

All of this is in the rc.1 tag.

- **Tool calls are batches.** `ctx.tools.execute` takes `{ calls, signal }`,
  plus an optional `agent` and `log`, and single calls read their outcome from
  `results`
  ([executor.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.2-rc.1/packages/core/tools/src/executor.ts),
  [guide](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.2-rc.1/docs/upgrade-guide/v0.2.1-rc.2/tool-executor-plugins/guide.md)).
  `@deepseek-ai/dsh-tools` no longer exports `./types`; `./pipeline` has
  `ToolExecutionPipeline` and `executeToolBatch`. dsh rejects the removed
  `mode` and `maxParallelSubCalls` fields at load and no longer reads
  `DSH_TOOLS_MODE`.
- **Schedule is rewritten**
  ([guide](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.2-rc.1/docs/upgrade-guide/v0.2.2-alpha.2/schedule-agent-tools/guide.md)).
  The model's tools are `schedule_create`, `schedule_list`, `schedule_view`
  and `schedule_edit`. `schedule_update`, `schedule_delete` and the timing
  selectors are gone. Creation takes an RRULE and a `target`. Each tool can
  read and change any task on the Host by id. Prompts and skills that name
  the old tools break, and so do imports of the removed types.
- **Schedule's store writes version 2**
  ([guide](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.2-rc.1/docs/upgrade-guide/v0.2.2-alpha.2/schedule-remote-host-tasks/guide.md)).
  A version-1 binary refuses to open the store after the first v2 write. Back
  it up before you upgrade if you might go back to 0.2.1.
- **No read-before-write, and no `apply_patch`.** `dsh-base` ships
  `fs-observation-policy` with `disabled: true`, so `write` and `edit` no
  longer refuse a file the model has not read. dsh's own
  [guide](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.2-rc.1/docs/upgrade-guide/v0.2.2-alpha.2/fs-observation-policy-default-off/guide.md)
  says the base and Web `standard` presets now list `apply_patch`. The tag
  ships `applyPatch: false` in
  [base](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.2-rc.1/packages/bundle/base/cordis.patch.yml#L300)
  and in all three Web presets. Upstream commit e1609fe164 turned it off on
  2026-11-02, and the guide was not updated.
- **Projection frames carry every key at once.** A live `projection` frame on
  `session/control` or `session/observeProjections` now holds
  `changes: [{ key, val }]` for every key one event changed. Direct readers
  of those streams must change. `ctx.sessionProjections.onChanged` keeps its
  behavior
  ([guide](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.2-rc.1/docs/upgrade-guide/v0.2.2-alpha.2/projection-event-frames/guide.md)).

## Custom plugin indexes

The switch that turns on the Discover tab is now **Custom plugin indexes**,
under **Plugins > Experimental plugins**
([guide](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.2-rc.1/docs/user/guide/plugin-market.md)).
At rc.5 it was **Custom plugin markets**, behind **More** beside
**Experimental plugins**.

A version in an index comes from npm or from Git. A Git source is
`{ "type": "git", "url", "commit", "path" }`, with a 40-character commit and
an optional subdirectory. dsh installs it as
`git+<url>.git#<commit>&path:/<path>`. The format is not new: rc.5's guide
documents the same row. New since rc.5 is plugin-manager's Git transport, which
installs a self-hosted Git plugin over SSH when only SSH can read it. Either
way, the install runs the normal compatibility check.

The registry's index at
[dsh.works/awesome-dsh-plugins/market/index.json](https://dsh.works/awesome-dsh-plugins/market/index.json)
passes rc.1's own index parser: 10,088 plugins and 82,360 versions, all from
npm.

## Our plugins

dsh's gate admits all five of ours on rc.1. We ran four of them there, and
gate admission is not the same as working:

- **dsh-watch 0.2.3, the version on npm, is broken on dsh 0.2.2-rc.1.** Its
  standing watches (`autoArm`) never arm, and it prints nothing about it. It
  arms them with one tool call in the old shape, and rc.1 takes only batches.
  Measured on rc.1: a probe watch never started in 30 seconds under 0.2.3.
  Under the build in
  [dsh-watch#12](https://github.com/dshworks/dsh-watch/pull/12) it started in
  2 seconds. #12 is not published.
- dsh-meter 0.5.5 counted a real headless call on rc.1.
- dsh-ego-browser 0.1.4 and dsh-crew 0.2.4 answer on their web routes on rc.1.

## What this cannot see

- The census reads manifests, not code. A plugin whose range admits rc.1 but
  sends single tool calls or names `schedule_update` counts as admitted.
  dsh-watch 0.2.3 is one: its peer range `^0.2.0-rc.1` admits rc.1.
- Downloads are npm's counts, which include mirrors and CI.
- 54 names the registry lists are not served by npm and are not counted.
