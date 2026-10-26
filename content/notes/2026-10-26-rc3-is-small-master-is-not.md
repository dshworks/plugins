---
title: dsh 0.2.1-rc.3 is small. Master is not.
summary: npm's next tag moved to dsh 0.2.1-rc.3 on 2026-10-23. It is rc.2 plus six commits and changes no plugin contract, yet it refuses 52 published plugins that rc.2 admits, 29 of them pinned to one dsh version. The breaking batch dsh's docs now describe (a batch ctx.tools.execute, the Node 24.9 floor, web_fetch reaching private addresses) is on master and in no release yet.
---

On 2026-10-23 at 07:54 UTC npm published `@deepseek-ai/dsh` 0.2.1-rc.3 under
the `next` tag. `latest`, what `npx @deepseek-ai/dsh` runs, is still
0.2.1-rc.2. To try rc.3, run `npx @deepseek-ai/dsh@next`.

## What rc.3 is

The tag is [six commits after rc.2](https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.2.1-rc.2...dsh-v0.2.1-rc.3).
It adds navigation entry customization in the web UI and analytics for it.
The model list on the DeepSeek API-key route now follows DeepSeek's
`GET /models`
([c48f852](https://github.com/deepseek-ai/deepseek-harness/commit/c48f8523f2)),
and today that lists `deepseek-flash` and `deepseek-v4-pro`. New Session now
opens the blank Session you left instead of creating another, so an unsent
draft is no longer lost
([guide](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.3/docs/upgrade-guide/v0.2.1-rc.2/new-session-blank-reuse/guide.md)).
This is the only upgrade guide rc.3 carries.

Nothing a plugin builds on changed. The install gate,
[plugin-compatibility.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.3/packages/boot/app-boot/src/plugin-compatibility.ts),
is the same blob (2e4ca57) at both tags, and the core packages changed only
their version numbers.

The gate still judges the version, though. Measured on 2026-10-26 against the
`latest` manifest of every published plugin the registry lists:

- rc.3 refuses 1,454 of 6,431 packages and rc.2 refuses 1,437.
- 52 install on rc.2 and are refused by rc.3: 19 by an `engines.dsh` range
  and 33 by a dsh peer range.
- 29 of those 33 name one exact dsh version, so they are refused by every
  release except that one.

A plugin pinned to 0.2.1-rc.2 is refused by rc.3 even though rc.3 changed
nothing it uses. Declare the range you have tested, not one prerelease. The
front page's [refusal census](/#installs) re-measures this
every night.

## What master has that no release does

dsh's documentation lives in the repository and follows `master`. Its upgrade
guides are filed under the release you upgrade from, not the one that ships
them. Since rc.2 was cut,
`master` has gained 29 upgrade guides, and neither the rc.2 tag nor the rc.3
tag contains any of them. Read at
[22ddee3](https://github.com/deepseek-ai/deepseek-harness/tree/22ddee3792402c3e70ec5f86a63c3e3e895a2f60)
on 2026-10-26, these are the ones a plugin or a user will feel:

- **`ctx.tools.execute` takes a batch.** It takes
  `{ calls: [{ type: 'tool-call', id, name, arguments }], signal, agent? }`
  and resolves `{ results: [{ callId, result }] }`
  ([executor.ts](https://github.com/deepseek-ai/deepseek-harness/blob/22ddee3792402c3e70ec5f86a63c3e3e895a2f60/packages/core/tools/src/executor.ts#L18-L58)).
  A plugin that sends the old single call throws. The same change adds
  `ctx.tools.setExecutor`, so checking for it tells the two APIs apart. Tool
  execution moves into executor plugins, and shipped profiles mount one
  ([guide](https://github.com/deepseek-ai/deepseek-harness/blob/22ddee3792402c3e70ec5f86a63c3e3e895a2f60/docs/upgrade-guide/v0.2.1-rc.2/tool-executor-plugins/guide.md)).
- **`@deepseek-ai/dsh-tools/types` is gone.** The package exports `./pipeline`
  instead
  ([package.json](https://github.com/deepseek-ai/deepseek-harness/blob/22ddee3792402c3e70ec5f86a63c3e3e895a2f60/packages/core/tools/package.json)).
  An import of the old subpath fails to resolve.
- **`sessionProjections.register()` returns a handle.** A plugin that ignores
  it keeps working. One that returns it from an async `apply` fails with
  "Invalid effect"
  ([guide](https://github.com/deepseek-ai/deepseek-harness/blob/22ddee3792402c3e70ec5f86a63c3e3e895a2f60/docs/upgrade-guide/v0.2.1-rc.2/session-projection-handles/guide.md)).
- **Node.js 24.9 or newer**
  ([guide](https://github.com/deepseek-ai/deepseek-harness/blob/22ddee3792402c3e70ec5f86a63c3e3e895a2f60/docs/upgrade-guide/v0.2.1-rc.2/node-24/guide.md)).
  The published rc.3 declares no `engines` field and runs on Node 22: we
  booted it on 22.23.3.
- **`web_fetch` reaches private addresses.** At rc.3 the fetch provider still
  refuses loopback, private and link-local answers
  ([web.md at rc.3](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.3/docs/subsystems/web.md#L131)).
  On master it fetches them like any other host, cloud metadata endpoints
  included, and the shipped presets still run `web_fetch` without asking
  first
  ([web.md on master](https://github.com/deepseek-ai/deepseek-harness/blob/22ddee3792402c3e70ec5f86a63c3e3e895a2f60/docs/subsystems/web.md#L134-L136)).
  If dsh runs where the model should not reach internal services, plan a
  `tools/pre-execute` policy before you upgrade to the release that ships
  this
  ([guide](https://github.com/deepseek-ai/deepseek-harness/blob/22ddee3792402c3e70ec5f86a63c3e3e895a2f60/docs/upgrade-guide/v0.2.1-rc.2/web-fetch-private-destinations/guide.md)).
- **The Discover switch is renamed.** "Custom plugin markets" becomes "Custom
  plugin indexes" and moves out of the More menu. [Our steps](/#discover)
  keep the name rc.2 and rc.3 print, and the build now fails the day
  `latest` prints the new one.

No release has been announced for any of this. Expect it in the next release
cut from `master`.

## Our plugins

All five install and run on rc.3. Each was run from a scratch profile with a
real `deepseek-flash` call, and all five were loaded in the web profile.

- dsh-watch arms its standing watches through `ctx.tools.execute` with a
  single call, so master's batch API would make every standing watch fail
  with a warning.
  [dsh-watch#11](https://github.com/dshworks/dsh-watch/pull/11) speaks both
  APIs and has been run live on rc.2 and rc.3. It reaches npm as 0.2.4
  ([#12](https://github.com/dshworks/dsh-watch/pull/12)).
- In dsh-meter, dsh-crew, dsh-ego-browser and dsh-solidworks we found nothing
  that changes on master.

Our own mirror of DeepSeek's docs said on 2026-10-26 that these changes ship
in rc.3. That was wrong: it read the guide's directory as the release. The
mirror now lists, for each npm tag, which guides that release's git tag
actually carries
([deepseek-docs#29](https://github.com/thevibeworks/deepseek-docs/pull/29)).

## What this cannot see

- The master facts are read from source at one commit. They can change
  before a release.
- We did not scan the registry for plugins that call `ctx.tools.execute`
  with a single call or import `dsh-tools/types`. The census above reads
  manifests, not code.
- Of our plugins on rc.3, dsh-crew's panes and dsh-solidworks' tools were not
  called: the container has no PTY UI and no SOLIDWORKS.
