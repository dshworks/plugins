---
title: dsh 0.2.1-rc.5 is latest, and 71 plugins rc.2 installed are refused by it
summary: On 2026-10-29 npm pointed both latest and next at dsh 0.2.1-rc.5. It is rc.3 plus 13 commits, the install gate is the same file, and one plugin contract changed, the reasoning body slot. 71 published plugins that rc.2 installed are refused by rc.5, each because it lists the releases it accepts or caps its range below rc.5. Master's breaking batch is on npm now too, as 0.2.2-alpha.2 under the alpha tag.
---

On 2026-10-29 npm published `@deepseek-ai/dsh` 0.2.1-rc.5 at 14:15 UTC, and
by 16:01 UTC, the last change to the package, both `latest` and `next` pointed
at it. `npx @deepseek-ai/dsh` and `npx @deepseek-ai/dsh@next` now run the same
build.

## What rc.5 is

The tag is [13 commits after rc.3](https://github.com/deepseek-ai/deepseek-harness/compare/dsh-v0.2.1-rc.3...dsh-v0.2.1-rc.5),
rc.4 included. rc.4 fixes the view-tab tooltips and keeps diagnostics off ACP's
stdout. rc.5 changes how a thinking block renders.

The install gate,
[plugin-compatibility.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.5/packages/boot/app-boot/src/plugin-compatibility.ts),
is byte-identical at rc.2 and rc.5. So is plugin-manager's source.

## The one contract that moved

A plugin that contributes to the `conversation.chat.reasoning.body` slot gets
different props
([guide](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.5/docs/upgrade-guide/v0.2.1-rc.4/reasoning-body-props/guide.md)):

- `text` is now display text. When the reasoning starts with a
  `<signature>...</signature>` block, Chat strips it, and a block holding only a
  signature is not drawn at all
  ([reasoning-text.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.5/packages/client/ui-chat/src/client/reasoning-text.ts)).
- `rawText` is new and carries the model output unchanged.

A custom reasoning renderer or translation wrapper that needs the original
output should read `rawText`. One that only displays `text` keeps working.

## Who is refused now

The gate did not change, but the version it judges did. Measured on 2026-11-02
against the `latest` manifest of each of the 6,920 published plugin packages
the registry lists:

- rc.5 refuses 1,466. The same manifests on rc.2 give 1,485.
- **71 install on rc.2 and are refused by rc.5**: 34 by an `engines.dsh`
  range and 37 by a dsh peer range.
- None of the 71 trips on anything rc.5 introduced. Each stops at a release
  before it. 23 name 0.2.1-rc.2 alone. 34 list exact versions joined by
  `||`, and none of the lists has rc.5. 12 add exact versions, or a window closed at rc.3, to
  ranges written for older dsh. The last 2 cap their range at `<=0.2.1-rc.2`
  and `<=0.2.1-rc.4`.
- 90 go the other way: rc.2 refused them and rc.5 admits them. Each of their
  ranges names rc.3, rc.4 or rc.5.

The packages and the rule each one tripped are in
[/_data/notes/dsh-021-rc5-latest.json](/_data/notes/dsh-021-rc5-latest.json).
The front page's [refusal census](/#installs) re-measures this every night.

A list of releases is refused by every release that is not on it, and each
release candidate is a new version. If you tested on rc.2 and nothing you use
has changed since, `>=0.2.1-rc.2 <0.2.2-0` says so: it admits rc.5 and the
0.2.1 release, and refuses 0.2.2-alpha.2, below, which does change things. If a plugin you rely on is refused, and you have checked that it
works anyway,
`dsh plugin allow-version <package@version> --dsh-version 0.2.1-rc.5 --accept-risk`
exempts that one pair.

## Master's batch is on npm, as an alpha

The [2026-10-26 note](/notes/rc3-is-small-master-is-not) listed the breaking
changes on master that no release carried. On 2026-10-27 npm published
0.2.2-alpha.2 under the `alpha` tag, cut from master. It carries 26 of the 27
upgrade guides master files under `v0.2.1-rc.2/`, and its manifest declares
`node >=24.9.0`. `ctx.tools.execute` takes a batch there
([executor.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.2-alpha.2/packages/core/tools/src/executor.ts)),
`@deepseek-ai/dsh-tools` exports `./pipeline` and no longer `./types`, and the
Discover switch reads "Custom plugin indexes"
([guide](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.2-alpha.2/docs/user/guide/plugin-market.md)).
Neither `latest` nor `next` has any of it. Its install gate is still the same
file.

## Our plugins

dsh's gate admits all five on rc.5. dsh-watch 0.2.3, the version on npm, arms
standing watches with a single `ctx.tools.execute` call, which 0.2.2-alpha.2
no longer takes. [dsh-watch#12](https://github.com/dshworks/dsh-watch/pull/12)
speaks both APIs and is not published yet.

## What this cannot see

- The census reads manifests, not code. A plugin that reads the reasoning
  slot's `text` and expects a signature in it does not show up here.
- 44 names the registry lists are not served by npm and are not counted.
