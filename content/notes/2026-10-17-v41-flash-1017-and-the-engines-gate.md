---
title: V4.1-Flash-1017, search billing, and the range dsh 0.2.1 reads first
summary: DeepSeek shipped V4.1-Flash-1017 on 2026-10-17 at the same Flash price, and starts billing search and fetch calls on 2026-10-31 at 16:00 UTC. dsh 0.2.1-rc.2, now on npm's next tag, judges a plugin by its own engines.dsh first and ignores its dsh peers when one is there. 311 published plugins that 0.2.0-rc.2 installs are refused by 0.2.1-rc.2.
---

Three things moved under dsh on 2026-10-17: the model behind `deepseek-flash`,
what a web search costs, and the rule dsh uses to decide whether your plugin
installs.

## What to change in your plugin

dsh 0.2.1-rc.2 is on npm's `next` tag. Since 0.2.1-alpha.4 its install check
reads `engines.dsh` first:

- **If your `package.json` has `engines.dsh`**, that one range decides. Your
  `@deepseek-ai/dsh*` peer ranges are no longer read at all. Make
  `engines.dsh` cover every dsh you support, for example
  `">=0.2.0-rc.2 <0.3.0-0"`.
- **If it has no `engines.dsh`**, nothing changed: every `@deepseek-ai/dsh` and
  `@deepseek-ai/dsh-*` peer must match, prereleases included. A `<0.2.0` upper
  bound admitted 0.2.0-rc.2 only because a prerelease sorts below its release;
  it refuses 0.2.1-rc.2.
- **`engines` must be an object.** `"engines": "node >= 20"` makes the manifest
  unreadable to the check, and dsh refuses the package.
- `workspace:^` still means "this dsh" in a peer. In `engines.dsh` it is
  refused.

dsh tells you which range failed. On 0.2.1-rc.2, from a scratch profile:

```
$ dsh plugin --profile probe add dsh-file-explorer-kit@0.3.9
dsh: installation rejected: Plugin dsh-file-explorer-kit@0.3.9 is incompatible
with dsh 0.2.1-rc.2: requirements {"engines.dsh":"^0.1.1"}. ...
dsh: nothing was installed.
```

The same command on 0.2.0-rc.2 installs it, because that version never reads
`engines`. The rule is
[plugin-compatibility.ts](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.2/packages/boot/app-boot/src/plugin-compatibility.ts#L55-L74)
at dsh-v0.2.1-rc.2, and the
[upgrade guide](https://github.com/deepseek-ai/deepseek-harness/blob/dsh-v0.2.1-rc.2/docs/upgrade-guide/v0.2.1-alpha.3/plugin-engines-dsh/guide.md)
sits under `v0.2.1-alpha.3/` because that directory names the release you
upgrade from.

## How many plugins it catches

We read npm's `latest` manifest for every npm name in the registry and applied
each version's rule. 311 packages that 0.2.0-rc.2 admits are refused by
0.2.1-rc.2:

- **53 by `engines.dsh`.** The commonest is an exact `"0.2.0-rc.2"` (8), then
  long `||` lists of versions that stop at 0.2.1-rc.1 or earlier. 20 of the 53
  declare no dsh peer at all, so 0.2.0-rc.2 admitted them without reading
  anything.
- **258 by a dsh peer.** 143 cap the range below 0.2.0, which admitted
  0.2.0-rc.2 only because a prerelease sorts below its release; 60 pin exactly
  `0.2.0-rc.2`; the other 55 list versions with `||` or cap the range just
  below 0.2.1.

The list, with each package's ranges, is
[/_data/notes/dsh-021-engines-gate.json](/_data/notes/dsh-021-engines-gate.json).
The front page's [refusal census](/#installs) re-measures this every night, so
its count moves as authors publish.

None of the four plugins we ship is among them: dsh-meter, dsh-watch, dsh-crew
and dsh-ego-browser each install on both 0.2.0-rc.2 and 0.2.1-rc.2 in their own
daily release checks.

## The model

[DeepSeek-V4.1-Flash-1017](https://api-docs.deepseek.com/news/news261017)
replaced the model behind `deepseek-flash` on 2026-10-17, with open weights on
Hugging Face and ModelScope. The announcement recommends dsh 0.2.1-rc.1 or later
with it. The price did not change: the pricing page still lists $0.15 / $0.60
per 1M cache-miss input / output tokens off-peak, which is the card
[dsh-meter](/dsh-meter/) already carries. `/models` names it `DeepSeek-V4.1-Flash`.

## Web search starts costing money on 2026-10-31

DeepSeek opened its Search and Fetch APIs at $0.75 per 1,000 successful
requests each. The pricing page says server-side search and fetch from dsh,
Claude Code and Codex already go through those APIs and are free until
00:00 Beijing time on 2026-11-01, which is **2026-10-31 at 16:00 UTC**.

In dsh 0.2.1-rc.2 one `web_search` tool call carries up to four queries, so one
call can be up to four billed requests. dsh-meter counts tokens only today;
[metering search and fetch](https://github.com/dshworks/dsh-meter/issues/36) is
open, to be settled against a real bill after billing starts.
