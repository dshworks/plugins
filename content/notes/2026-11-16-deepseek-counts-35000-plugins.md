---
title: DeepSeek counts about 35,000 plugins and says an official market is coming
summary: On 2026-11-05 the DeepSeek Harness team put third-party plugins at about 35,000, said about 60% of active users had made or installed one, and announced an official plugin market and a support programme for authors. The post does not say what it counted. Here are the counts we can check, the four plugins it named (all four install and boot on dsh 0.2.2-rc.1), and what an official market changes for this site.
---

On 2026-11-05 the DeepSeek Harness team posted
[DeepSeek Harness 与插件社区共同成长](https://mp.weixin.qq.com/s/xqyrRaiBpIcf0jeJzP7W0g)
(DeepSeek Harness grows with its plugin community) on DeepSeek's WeChat account.
What it says, in its own terms:

- v0.1 shipped on 2026-08-13 and the desktop app on 2026-09-29.
- As of 2026-11-04, counting only users of the official API: 1.54 million
  daily active users and about 92 trillion tokens a day.
- About 35,000 third-party plugins. About 60% of active users have made or
  installed at least one.
- DeepSeek will make the plugin API more stable and compatible, harden plugin
  security, and **build an official plugin market** where authors upload and
  users find plugins.
- A support programme for plugin authors is being prepared: token incentives,
  technical exchange and recommendations. The sign-up form only collects
  interest; rules come when the programme launches.

We cannot check the user and token figures. The plugin count we can at least
put next to our own.

## What "35,000" could be counting

The post does not define a plugin. Here is what we measured, all on
2026-11-16, after this week's sweep:

| what | count |
|---|---|
| GitHub repos carrying a dsh topic (`dsh-plugin`, `deepseek-harness` and nine more) | 37,156 |
| Rows in our registry, each with a file that proves an install path | 36,924 |
| ...of which name an npm package | 13,458 |
| npm packages a dsh 0.2.1+ Discover tab can install from our [market index](https://dsh.works/awesome-dsh-plugins/market/index.json) | 12,780 |
| Repos we read and rejected, each with a published reason | 5,918 |
| Themes, in the sister registry | 958 |

DeepSeek's figure is below both of ours, and neither is the same count:

- The topic count includes the 5,918 repos we rejected, 3,753 of them for
  having no install path at all.
- Our rows include packages found on npm that carry no topic.
- Both move quickly. Our rows went from 32,321 at the 11-07 sweep to 36,924
  at this one, so a figure like 35,000 depends on the day it was taken. The
  post dates its user and token figures (as of 11-04). For plugins it says
  only "since launch" (发布至今), in a post published on 11-05.

The post itself says the plugins' "maturity and fit vary"
(成熟度和适用场景各有差异). The rejection list is where that shows.

The counts come from the same files the front page reads:
[coverage.json](https://github.com/dshworks/awesome-dsh-plugins/blob/main/data/coverage.json),
[stats.json](https://dsh.works/awesome-dsh-plugins/stats.json) and
[rejected.json](https://github.com/dshworks/awesome-dsh-plugins/blob/main/data/rejected.json).

## The four plugins it named

The post profiles four authors and says to type the package name into dsh's
plugin install page. We did that on dsh 0.2.2-rc.1, the current `latest`:
`dsh plugin --profile web add <name>` into a fresh `DSH_HOME`, then booted the
web profile.

| package | installed | `engines.dsh` | boot | our page |
|---|---|---|---|---|
| `dsh-media-desk` | 2.7.1 | `>=0.2.1-rc.5 <0.3.0` | boots, no inactive entry | [/p/dsh-media-desk](/p/dsh-media-desk) |
| `dsh-guizang-design` | 0.1.4 | `>=0.2.1-rc.2 <0.3.0` | boots, no inactive entry | [/p/dsh-guizang-design](/p/dsh-guizang-design) |
| `dsh-context` | 0.84.1 | `>=0.2.0-rc.2 \|\| >=0.2.1-rc.2 \|\| >=0.2.2-rc.1` | boots, no inactive entry | [/p/dsh-context](/p/dsh-context) |
| `agentero-dsh` | 0.1.8 | `>=0.2.1-rc.5 <0.3.0` | boots, no inactive entry | [/p/agentero-dsh-plugin](/p/agentero-dsh-plugin) |

All four were already in the registry. Every declared range also admits
0.2.2-rc.3, the current `next`.

Two of the "installed" versions are not npm's newest. `dsh-media-desk` 2.7.2 and
`dsh-context` 0.85.1 were published 11 to 13 hours before our run, and pnpm,
which dsh installs through, holds back releases younger than 24 hours by
default. Pinning the version installs it. That is a trap for anyone shipping a
hotfix, so it now has its own page:
[`dsh plugin add` installs the release before the one you just published](https://github.com/dshworks/howto-dsh/blob/main/fix/plugin-add-installs-the-previous-release.md).
The install log for each run is in the
[evidence file](/_data/notes/deepseek-plugin-community.json).

## What an official market changes here

Our front page said "there is no official marketplace". That is still true
today, and it now says "yet".

Until a market ships, discovery runs the way it has since launch: the
[`dsh-plugin` topic](https://github.com/topics/dsh-plugin) the harness README
asks authors to add, and the "Custom plugin indexes" switch that lets a dsh
0.2.2 Discover tab read an index such as ours. Neither goes away when a market
arrives.

A market where authors upload will be the better shelf. Being found should not
depend on a community sweep. What this site argues for is different: a receipt
per plugin. That means the file that proves it installs, the dsh release that
proof was checked under, and a published reason for every rejection. When the
market ships, we will check which of those it carries and say so here. Until
then this registry keeps doing what it does. It does not compete for uploads.

## Also from DeepSeek: the "full-stack" app API

On 2026-11-13 DeepSeek
[opened the DeepSeek App's conversation features through the API](https://mp.weixin.qq.com/s/78KBHc4-4N5b2vfL9SkutQ).
Server-side `deepseek_web_search` and `deepseek_read_url` tools now work in all
three chat formats, with deep search when thinking is on. There is also
document parsing on upload, a `safety_check` switch, and standalone OCR, ASR
and TTS endpoints. It shipped a demo client,
[deepseek-ai/chat-demo](https://github.com/deepseek-ai/chat-demo).

Token prices did not move. The
[pricing page](https://api-docs.deepseek.com/quick_start/pricing/) now prices
each tool per use. Search (text and image) and web fetch stay at $0.75 per
1,000. File parsing and OCR cost $0.225 per 1,000 pages. TTS is $0.45 per
10,000 characters, and ASR $0.116 per hour of audio, both half price for a
limited time. The rewrite renamed the search table's rows. That broke
[dsh-meter](https://github.com/dshworks/dsh-meter)'s daily pricing check, which
reads that table, and it is fixed
([dsh-meter#40](https://github.com/dshworks/dsh-meter/pull/40)). dsh's own source names none of
the new tools at 0.2.2-rc.1, rc.3 or `master`. Its web search still calls the
Search API, billed as before.

## What this cannot see

- What DeepSeek counted. 35,000 is set beside our counts, not reconciled with
  them.
- The user and token figures, and the 60%. They come from DeepSeek's telemetry.
- Whether the four plugins work. We proved install and boot with an invalid
  API key, so no model was called and no tool ran.
- The market's design. The post announces it and describes nothing else.
