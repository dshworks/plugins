---
title: dsh 0.2.1-rc.2 is latest, and 226 of the 311 are refused now
summary: npm moved dsh's latest tag to 0.2.1-rc.2 on 2026-10-19, so a fresh dsh judges a plugin by its engines.dsh first. Of the 311 published plugins we counted on 2026-10-17 as installing on 0.2.0-rc.2 and refused by 0.2.1-rc.2, 85 have shipped a release it admits; 226 are refused for anyone who installs dsh today. We also ship a fifth plugin, for SOLIDWORKS.
---

On 2026-10-19 npm's `latest` tag for `@deepseek-ai/dsh` moved from 0.2.0-rc.2
to 0.2.1-rc.2. There is no new release: 0.2.1-rc.2 was published on
2026-10-17 and sat on `next` until the tag moved (the packument was modified at
06:29:58 UTC). `npx @deepseek-ai/dsh` now runs 0.2.1-rc.2, and its install
check reads `engines.dsh` before anything else. What to change in a plugin is
in [the 2026-10-17 note](/notes/v41-flash-1017-and-the-engines-gate); nothing
about the rule moved since.

## The 311, two days later

On 2026-10-17 we listed 311 published plugins that 0.2.0-rc.2 installs and
0.2.1-rc.2 refuses. On 2026-10-19 we read the manifest npm tags `latest` for
each of them again and applied 0.2.1-rc.2's
[gate](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.2/packages/boot/app-boot/src/plugin-compatibility.ts#L55-L74):

- **85 install now.** Each published a release since: 24 of the 53 refused by
  `engines.dsh`, and 61 of the 258 refused by a dsh peer.
- **226 are still refused.** 5 of them published a new release since
  2026-10-17 that 0.2.1-rc.2 refuses too.
- None was unpublished.

Both lists are in
[/_data/notes/dsh-021-cliff-due.json](/_data/notes/dsh-021-cliff-due.json).
Across the registry, dsh 0.2.1-rc.2 refuses 1,477 of the 6,282 published plugin
packages it lists, measured the same day; the front page's
[refusal census](/#installs) re-measures that every night.

If you upgrade a dsh that already has one of the 226 in a profile, the plugin
is switched off at startup with one line on stderr,
`dsh: disabling profile plugin ...`
([compatibility-preflight.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.2/packages/boot/app-boot/src/compatibility-preflight.ts#L82)).
If you have checked that it works anyway,
`dsh plugin allow-version <package@version> --dsh-version 0.2.1-rc.2 --accept-risk`
exempts that one pair.

## What the registry stamps

The [plugin registry](https://github.com/dshworks/awesome-dsh-plugins) records
the dsh version each row's install path was checked against. From today it
stamps 0.2.1-rc.2 on what it proves
([#173](https://github.com/dshworks/awesome-dsh-plugins/pull/173)). Rows proven earlier keep the version and
date they were proven on: moving them because a tag moved would claim a check
nobody ran. The files the prover reads at dsh-v0.2.1-rc.2 say what they said at
0.2.0-rc.2, apart from the `engines.dsh` rule it already follows: a package
still needs `dsh.bundle` (plugin-manager
[index.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.2/packages/boot/plugin-manager/src/index.ts#L623)),
and dsh still reads only its `bundle`, `client` and `profile` keys.

## A fifth plugin of ours

[dsh-solidworks](https://github.com/dshworks/dsh-solidworks) connects dsh to
the SOLIDWORKS on your desk, 2016 or later, on a Windows PC or in a Windows VM
beside your Mac. dsh models a part from a paragraph and checks its volume
against its own arithmetic, reads the face you selected, assembles parts,
checks interference, and makes the drawing as a PDF. Your files open read-only
unless you say otherwise. Its README opens with four recordings of real
sessions on SOLIDWORKS 2019. It is
[`@dshworks/dsh-solidworks`](https://www.npmjs.com/package/@dshworks/dsh-solidworks)
on npm.

None of our five plugins is among the 226. dsh-meter, dsh-watch, dsh-crew,
dsh-ego-browser and dsh-solidworks each install on 0.2.1-rc.2 from a scratch
profile in their own daily release check, run again on 2026-10-19.
