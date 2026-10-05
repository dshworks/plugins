---
title: What the next dsh removes, and which listed plugins still reach for it
summary: dsh 0.2.1-alpha.1 removes the runtime invariant service, the Automation tasks bundle, and the display text dsh read from a subpath plugin's own package.json. 0.2.0-rc.2, npm's latest, still ships all three. Of 17,292 listed repositories, 1,363 still name the invariant package and 840 ship a companion for it; one published plugin that both versions admit loses a row at startup.
---

## What to change in your plugin

Three things are gone in dsh 0.2.1-alpha.1, published on npm's `alpha` tag on
2026-10-03. If your plugin touches one of them:

- **The invariant service.** Delete `@deepseek-ai/dsh-invariants` from
  `dependencies`, `peerDependencies` and `devDependencies`. Delete the
  `./invariant` export, its `src/invariant.ts` and `lib/invariant.js`, and any
  bundle row whose `name` is `@deepseek-ai/dsh-invariants` or ends in
  `/invariant`. The package has no 0.2.1:
  `npm view @deepseek-ai/dsh-invariants@^0.2.1-alpha.1` finds no version, so a
  range moved in step with your other dsh packages has nothing to resolve to
  ([upgrade guide](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-alpha.1/docs/upgrade-guide/v0.2.0-rc.2/remove-runtime-invariants/guide.md)).
- **A subpath plugin's title, description and icon.** If your bundle loads
  `your-pkg/sub` and its text came from an exported `./sub/package.json`, move
  `name` and `description` into `meta.title` and `meta.description` of
  `./sub/locale/*.json`, export the image as `./sub/icon`, and drop the
  `./sub/package.json` export
  ([upgrade guide](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-alpha.1/docs/upgrade-guide/v0.2.0-rc.2/subpath-plugin-display-manifest/guide.md)).
- **The Automation tasks bundle.** Nothing, for a plugin. dsh removes
  `@deepseek-ai/dsh-experimental-schedule-bundle` from a profile's bundle list
  itself when the profile loads
  ([upgrade guide](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-alpha.1/docs/upgrade-guide/v0.2.0-rc.2/schedule-bundle-retired/guide.md)).

None of the four plugins we ship names any of the three.

## Which release removes them

The upgrade guides sit under `docs/upgrade-guide/v0.2.0-rc.2/`, and each one
reads "In v0.2.0-rc.2, ... The next release removes ...". The directory names
the release you upgrade from. dsh 0.2.0-rc.2, npm's `latest` since 2026-09-29,
still ships all three:

- `@deepseek-ai/dsh-invariants` and the `ctx.invariants` service it registers
  ([index.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/packages/runtime-diagnostics/invariants/src/index.ts#L29-L113)),
  plus 38 harness packages that export a `./invariant` companion, such as
  [dsh-session](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/packages/core/session/package.json#L21-L24).
  At 0.2.1-alpha.1 the package is gone and no harness package exports
  `./invariant`
  ([commit f028f25667](https://github.com/deepseek-ai/deepseek-harness/commit/f028f25667)).
  npm's last version of the package is 0.2.0-rc.2.
- `@deepseek-ai/dsh-experimental-schedule-bundle`, offered as an optional
  bundle
  ([profile.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/packages/boot/app-boot/src/profile.ts#L213-L218)).
  At 0.2.1-alpha.1 it is listed as retired and dropped from the bundle list
  when a profile loads
  ([profile.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-alpha.1/packages/boot/app-boot/src/profile.ts#L206-L210),
  [L663-L674](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-alpha.1/packages/boot/app-boot/src/profile.ts#L663-L674),
  [L738](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-alpha.1/packages/boot/app-boot/src/profile.ts#L738)),
  and the Web composition mounts `schedule` and `ui-schedule` itself
  ([cordis.patch.yml](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-alpha.1/packages/bundle/web-app/cordis.patch.yml#L139-L140),
  [L389-L390](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-alpha.1/packages/bundle/web-app/cordis.patch.yml#L389-L390)).
- The subpath read. At 0.2.0-rc.2, as at 0.1.7-rc.2, dsh resolves
  `${specifier}/package.json` for every plugin row, subpath or not
  ([package-meta.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/packages/boot/app-boot/src/package-meta.ts#L148-L153)).
  At 0.2.1-alpha.1 only a package root reads it, and a subpath's image comes
  from `${specifier}/icon`
  ([L174-L180](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-alpha.1/packages/boot/app-boot/src/package-meta.ts#L174-L180),
  [L40](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-alpha.1/packages/boot/app-boot/src/package-meta.ts#L40)).

The compatibility gate is the same file at both tags
([plugin-compatibility.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-alpha.1/packages/boot/app-boot/src/plugin-compatibility.ts#L61-L87)).
It reads a peer range on `@deepseek-ai/dsh-invariants` like any other dsh peer
and does not know the package is gone. `@lemoncat7/dsh-web-search` 0.3.3, which
peers on it at `^0.2.0-rc.2`, installs on 0.2.1-alpha.1 with
`dsh plugin --profile <p> add`, and the profile holds no copy of it.

## The invariant service: 1,363 name it, one row breaks

Measured on 2026-10-05 on the default branch of every repository the registry
listed that morning, 17,292, with lockfiles, docs, tests and copies of dsh's
own files left out:

- 1,363 name `@deepseek-ai/dsh-invariants` in a `package.json`. Of the 5,178
  registry npm names that resolve on npm, the `latest` manifest lists it in
  `peerDependencies` for 250, `dependencies` for 13 and `devDependencies` for
  405.
- 951 export `./invariant`, and 840 ship a companion that registers with the
  service. 305 published `latest` manifests export `./invariant`.
- Of the 839 companion files we re-read, 724 register an installer that does
  nothing, `const install = () => {}`. 85 report a failure through the `fail`
  callback.

Most of it never ran. At 0.2.0-rc.2 the one composition dsh ships that mounts
the service is `sdk-minimal`
([cordis.patch.yml](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/packages/bundle/sdk-minimal/cordis.patch.yml#L106-L119)).
The `web`, `headless`, `acp` and `sdk` templates do not
([profile.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.0-rc.2/packages/boot/app-boot/src/profile.ts#L179-L195)).
A companion declares `inject = ['invariants']` and waits for a service nothing
provides, before the removal and after it.

What 0.2.1-alpha.1 changes is a bundle that mounts the service itself. Five
listed bundles insert `@deepseek-ai/dsh-invariants` as a row:

| Plugin | Row | dsh 0.2.0-rc.2 | dsh 0.2.1-alpha.1 |
|---|---|---|---|
| @tingrudeng/dsh-feishu-bot 0.1.0-rc.11 | [cordis.patch.yml](https://github.com/TingRuDeng/dsh-feishu-bot/blob/2231480b66/cordis.patch.yml#L40-L44) | admitted, row loads | admitted, row fails to import |
| dsh-goalmesh-plugin 0.3.0, git only | [cordis.patch.yml](https://github.com/Jarad-z/dsh-goalmesh/blob/e342c5350b/packages/goalmesh-plugin/cordis.patch.yml#L2-L3) | admitted | admitted; lists the package in `dependencies`, so the profile holds a 0.1 copy (not run) |
| @kiwifruit/dsh-context-pro 0.6.7 | [cordis.patch.yml](https://github.com/kiwifruit13/dsh-context-pro/blob/407ee7895f/cordis.patch.yml#L9-L10) | refused by its peer ranges | refused |
| @vibeinging/dsh-red-alert 0.1.3 | [cordis.patch.yml](https://github.com/vibeinging/dsh-red-alert/blob/10f9041aa5/cordis.patch.yml#L2-L3) | refused | refused |
| dsh-engineering-control-plane 0.2.2 | [cordis.patch.yml](https://github.com/bailong-Hakuryu/dsh-engineering-control-plane/blob/0d60d25778/cordis.patch.yml#L6-L7) | refused | refused |

The feishu-bot row was run. In a scratch profile with the plugin installed,
`dsh web` on 0.2.1-alpha.1 prints `dsh: warning: 3 entries did not activate`
and `invariants (@deepseek-ai/dsh-invariants): failed to import`, and the
plugin's own `feishu-invariant` row waits for `invariants, feishu`. The same
install on 0.2.0-rc.2 prints 2 entries, both waiting for the Feishu service the
scratch profile never configured. dsh keeps running on both. One row does not
load.

Five more listed repositories are hosts, not plugins. They assemble a dsh
composition in their own code, name the removed modules there, and pin their
own dsh: [Cherry Studio](https://github.com/CherryHQ/cherry-studio/blob/50d69b6856/src/main/ai/runtime/dsh/compositionBuilder.ts#L160-L164)
and [@openma/deepseek-harness-acp](https://github.com/openma-ai/deepseek-harness-acp/blob/66394607bb/src/harness.ts#L282-L286)
at 0.2.0-rc.2,
[deepseekharness-acp-interactive](https://github.com/ClickPM/dsh-acp-interactive/blob/66b15f139f/config/cordis.yml#L103-L112)
at `^0.2.0-rc.2`,
[Agora](https://github.com/logan-suu/Agora/blob/937bf8cebf/packages/runtime/executor/src/harness-executor.ts#L16-L21)
at 0.1.1-rc.2 and
[star-harness](https://github.com/dmsobtl/star-harness/blob/feaceb5714/src/framework/spine.ts#L18)
at 0.1.0-rc.6. Nothing changes for them while those versions hold. When they
move to the 0.2.1 line, by hand or because a caret range takes a stable 0.2.x,
the entries have no module to load.

Every other runtime import of the package we found sits in scripts, demos,
spikes, smoke tests, type declarations, or companions no shipped bundle
mounts. Four more rows naming the removed modules sit in example, validation,
benchmark or development profiles, not in a bundle a user installs.

## The Automation tasks bundle: nothing to fix

35 listed repositories name `@deepseek-ai/dsh-experimental-schedule-bundle`
outside lockfiles, docs and tests. None needs it to load: no bundle patch names
it, and no `latest` manifest on npm lists it. The mentions are pnpm
`minimumReleaseAgeExclude` entries (17), TypeScript path maps, a pinned override, desktop
distributions that vendor or pin it, and retired-bundle lists authors already
keep, such as
[anywhere-labs/dsh-desktop](https://github.com/anywhere-labs/dsh-desktop/blob/a1ff68b296/dsh-desktop-next/src/profile-schedule.ts#L8).
[LexFlow](https://github.com/LexFlowApp/LexFlow/blob/469b846d5e/src/main/index.ts#L89-L94)
copied 0.2.0-rc.2's optional-bundle list into its own code. 0.2.1-alpha.1's
list drops the schedule bundle and adds `dsh-experimental-inspector-profile`
([profile.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-alpha.1/packages/boot/app-boot/src/profile.ts#L223-L228)).

Four listed repositories insert Schedule rows of their own:
dsh-schedule-enable, dsh-wiki, dsh-supervisor and dsh-app. 0.2.1-alpha.1's Web composition now
mounts `schedule` and `ui-schedule` too. We have not run that combination.

## Subpath display text: four plugins, cosmetic

In 553 listed packages, the bundle patch loads a subpath of the same package as
a plugin row. For 10 packages dsh resolves a `package.json` at that subpath. Six lose nothing on
0.2.1-alpha.1: their locale files already carry `meta.title` and
`meta.description`, or the subpath manifest's `name` is the specifier, which is
what Settings falls back to
([PluginInventorySettingsTab.tsx](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-alpha.1/packages/client/ui-settings-plugin-inventory/src/client/PluginInventorySettingsTab.tsx#L93-L99)).
Four change:

- [@lutrodev/dsh-roleplay](https://www.npmjs.com/package/@lutrodev/dsh-roleplay/v/0.1.8)
  0.1.8: 17 rows lose their titles. The subpath exports exist in the
  published package, not on the repository's default branch.
- [@roarpeng/graphflow](https://github.com/Roarpeng/GraphFlow/blob/9d0de7dfa9/package.json#L49)
  2.2.0: one row loses its title and description. It exports its root
  `package.json` as `./dsh/package.json`.
- [@wanghailong0419/dsh-toolkit](https://github.com/LongSir0419/dsh-toolkit/blob/ad3d3fdac8/package.json#L32-L34)
  0.1.10: three rows lose their descriptions.
- [dsh-private-plugins](https://github.com/vb2250158/dsh-plugins/blob/89a6ae76d4/package.json#L23-L74),
  not on npm: 8 rows lose titles, 3 lose descriptions.

None of the ten subpath manifests declares an icon. Nothing fails to load. A
row shows its module name instead.

## What this cannot see

- Default branches only, as of registry commit 8327eb1. 889 listed repositories
  return 404 (deleted, private or renamed), and 27 were cut off partway.
- On npm, `latest` manifests only. An older version already installed in a
  profile is not counted.
- Outcomes on 0.2.1-alpha.1 were run for one bundle, dsh-feishu-bot, and one
  install, @lemoncat7/dsh-web-search. The rest follow from the source and the
  gate.
- GitHub code search was a cross-check, not the count. The package name alone
  matches 24,768 files, mostly copies of dsh itself, and the API stops at 1,000
  results. Of the 219 listed repositories it surfaced, one we had wrongly left
  out is now counted; the rest were copies of dsh, path maps, lockfiles, docs,
  tests, or file types dsh does not load.
- Every line cited above was re-read off the repository after the scan; 4,008
  of 4,011 still matched, and the three that moved are in files edited since.


Every repository counted above, with the file and line it was counted on:
[evidence](/_data/notes/dsh-021-removals.json).
