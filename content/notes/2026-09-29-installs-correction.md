---
title: Correction: dsh does not install plugins the way we measured
summary: From 2026-09-04 to 2026-09-29 the front page said most published dsh plugins no longer install. That census modelled a fresh npm install, which is not how dsh installs a plugin. Re-measured under dsh's own compatibility gate, dsh 0.1.7-rc.2 refuses 142 of 1,989 published plugin packages, and 0.2.0-rc.1, already on npm's next tag, refuses 743.
---

## What we published

From 2026-09-04 until this note, the front page's
[install section](https://dsh.works/#installs) was headed "Most of the shelf
no longer installs". On the morning of 2026-09-29 it said, from a census
dated 2026-09-28:

- 146 of the 1,274 published packages that name a dsh version accept dsh
  0.1.7-rc.2, about 11%.
- A stale plugin installed on its own leaves "thirteen harness packages
  resolved to two versions at once, with no warning of any kind".
- Our own plugins "stopped resolving" when dsh 0.1.2-rc.1 shipped, and none of
  the four we ship accepted 0.1.7-rc.2.

The [note of 2026-09-18](https://dsh.works/notes/v41-flash-and-dsh-015)
repeated the same model.

## Why it was wrong

The census treated an install as one fresh npm tree: npm's rule that a
prerelease never satisfies a caret written for a different `major.minor.patch`,
and npm's habit of installing a peer at the highest version that matches. The
thirteen packages came from exactly that, an `npm install` of dsh-watch 0.2.0
beside dsh 0.1.2-rc.1.

Nobody installs a dsh plugin that way. `dsh plugin --profile <p> add <spec>`
([plugin.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.1/apps/cli/src/plugin.ts#L62-L84))
runs pnpm inside the profile
([operations.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.1/packages/boot/plugin-manager/src/operations.ts#L357)),
and dsh creates every profile with `nodeLinker: hoisted` and
`autoInstallPeers: false`
([profile.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.1/packages/boot/app-boot/src/profile.ts#L226-L235)),
the same two lines at every tag in the harness repository, back to
0.1.0-rc.7. A peer is never
installed. When a plugin imports a harness package the profile does not hold,
dsh routes the import to the copy the running host ships
([resolver.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.1/packages/boot/app-boot/src/profile-resolution/resolver.ts#L468-L510)).

A separate run of that real path on 2026-09-29 installed
`@xiaoyuyu6420/dsh-backup@0.13.2`, `@dshworks/dsh-meter@0.5.3` and a fixture
whose range adds the next dsh line, and found no harness package at two
versions. The npm model had reported 29, 10 and 18 on the same three.

The range did not matter for another reason: until dsh 0.1.7-rc.1, nothing in
dsh read it.

## What dsh checks now

dsh 0.1.7-rc.1 added a compatibility gate
([commit 2c67633990](https://github.com/deepseek-ai/deepseek-harness/commit/2c67633990),
[plugin-compatibility.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.1/packages/boot/app-boot/src/plugin-compatibility.ts#L61-L88)).
The file is byte-identical in 0.1.7-rc.2 and 0.2.0-rc.1.

- It reads the `peerDependencies` a plugin declares on `@deepseek-ai/dsh` or
  `@deepseek-ai/dsh-*`, and nothing else: not `dependencies`, not
  `engines.dsh`.
- It tests each with `semver.satisfies(runtime, range, { includePrerelease: true })`,
  so a caret admits every prerelease up to the next minor: `^0.1.5-rc.1`
  admits 0.1.7-rc.2 and refuses 0.2.0-rc.1. An empty range, or a string that
  is not a range such as `latest`, is refused.
- A refused plugin is not installed
  ([operations.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.1/packages/boot/plugin-manager/src/operations.ts#L332-L351)),
  and one already in a profile is switched off at startup with a
  `dsh: disabling profile plugin` line on stderr
  ([compatibility-preflight.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.1/packages/boot/app-boot/src/compatibility-preflight.ts#L74-L83)),
  unless you grant that exact version an exemption with
  `dsh plugin allow-version`.

Applied line for line to the npm manifest of every package in the registry
on 2026-09-29 at 08:17 UTC
([the method](https://github.com/dshworks/plugins/blob/main/scripts/measure-installability.mjs),
[the data](https://github.com/dshworks/plugins/blob/main/data/installability.json)):

- 1,989 packages. 1,194 declare a dsh peer range. 795 declare none, and the
  gate admits those without reading anything. Admitted means dsh will load
  it, not that it works.
- dsh 0.1.7-rc.2, npm's `latest`, refuses 142. 90 of them pin an exact dsh
  version.
- On any dsh before 0.1.7-rc.1, 25 of the 28 versions npm has published,
  nothing is refused.

## The real cliff is 0.2.0

dsh 0.2.0-rc.1 was published on npm's `next` tag on 2026-09-28. The same gate
there refuses 743, and 618 of those are admitted by 0.1.7-rc.2. A caret
anywhere on the 0.1 line stops short of 0.2.0, prereleases included, so the
day `latest` moves, those 618 are refused at install and switched off at
startup. Our four were among them at 08:17 UTC. Between 08:18 and 08:32 all
four shipped a release whose dsh peer ranges include `^0.2.0-rc.1`
(dsh-meter 0.5.5, dsh-watch 0.2.3, dsh-crew 0.2.3, dsh-ego-browser 0.1.3),
which is the fix the next paragraph describes. The front page re-measures
every night and counts them as admitted.

This one can be met ahead of time, which the 2026-09-18 note said it could
not: adding `|| ^0.2.0-rc.1` to a dsh peer range admits both lines, and
because dsh never installs a peer, the wider range cannot pull a newer harness
into an older host.

## What can split a profile

`dependencies`. pnpm installs what a plugin lists there into the profile, and
dsh prefers a copy it finds in the profile over the host's. 486 published
packages list an `@deepseek-ai/*` package the 0.1.7-rc.2 host already ships:

- 410 list `@deepseek-ai/schemastery`.
- 36 list `@deepseek-ai/cordis`, which dsh sets up so that every plugin shares
  one instance
  ([profile.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.1/packages/boot/app-boot/src/profile.ts#L226-L229)).
- 155 list a `@deepseek-ai/dsh-*` package, and 81 of those declare no dsh peer
  range for the gate to read.

That is a count of manifests, not of observed breakage. At 08:17 UTC all four
of ours listed `@deepseek-ai/schemastery` there; the releases above moved it to
`peerDependencies`, where dsh hands them the host's copy.

## What changed here

- The [front page section](https://dsh.works/#installs) is rewritten around
  the gate and re-measured every night. It prints the 0.2.0 cliff while npm
  serves a `next` ahead of `latest`.
- The census hashes the gate file at every dsh version it measures, and the
  build fails if dsh changes it, so the page cannot go on quoting a rule dsh
  no longer applies.
- The 2026-09-18 note carries a correction where it repeated the model.
