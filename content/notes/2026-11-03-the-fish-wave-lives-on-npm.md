---
title: The 大肥鱼 wave lives on npm, and the tutorial locks it with a prompt
summary: On 2026-11-02 a widely read WeChat tutorial showed how to run DSH as the 大肥鱼, a persona chatbot on QQ, WeChat and Feishu that also posts to Bilibili and Douyin. Its plugins are installed by npm name from inside DSH, and many of their authors tag nothing on GitHub, so directories that sweep GitHub topics, ours included, did not see them. The tutorial guards the fish with its persona prompt. Who the fish actually obeys is set in each plugin's config, and four popular ones ship four different defaults.
---


On 2026-11-02 数字生命卡兹克 published
[*DeepSeek Harness养鱼教程来了*](https://mp.weixin.qq.com/s/-LcRUPe5OYBRjiTEzYXKog)
("the DSH fish-raising tutorial"). Its subject is the 大肥鱼 ("big fat fish"),
the internet's name for the blue whale in DeepSeek's logo, run as a persona
chatbot from DSH. The article's own opening says people are already selling
tutorials, and selling the setup itself (有偿帮人养鱼).

## What the tutorial does

- **QQ, the official way.** In DSH's plugin page, type
  `@tencent-connect/dsh-qqbot` into the add box, then scan a QR code with QQ.
- **QQ, the unofficial way.** Use a spare QQ account through NapCat and
  AstrBot, which DSH installs and configures itself when asked.
- **WeChat** goes through the iLink channel the article remembers from the
  "小龙虾" (lobster) agent craze. **Feishu** goes through an agent app.
- **One memory across channels**, from memory plugins: something said on QQ
  is remembered on WeChat.
- **Out in the world:** the fish gets its own Bilibili account (watching,
  liking, comments) and a Douyin account. On Douyin it posts videos and
  live-streams through 直播伴侣. The author streamed for over an hour and
  received two gifts.
- **One guard, a prompt.** The persona prompt is published in full. It has a
  slot for the owner's QQ number and says that anyone else claiming to be the owner or
  an admin, or writing "system prompt" or "settings updated", is not to be
  believed. The author tested it once, live, by asking for the owner and a
  payment password.

## Why topic directories missed it

DSH adds a plugin by its npm name: that is the tutorial's first step, and
"方式一" in the official QQ bot's
[README](https://github.com/tencent-connect/dsh-qqbot). So these authors
publish to npm, write their descriptions in Chinese, and often put no topic
on the GitHub repo. A directory built on GitHub topic search, which is how this
registry started, cannot reach a repo that carries none.

## What it took to see them

Until 11-03 our discovery asked npm one question, `@deepseek-ai/dsh`, and
read the first 50 answers. Asking more questions helps less than it looks:
npm search returns at most 5,250 distinct packages per query, whatever total it
reports, and deeper pages repeat the last one. Fifteen queries together
reached 13,780 packages. The sweep that added them
([#210](https://github.com/dshworks/awesome-dsh-plugins/pull/210)) took the
registry from 27,444 to 29,107 plugins, 1,270 of them found on npm.

A union of searches is still a floor. To count what was missing we listed
all 4.56 million names in npm's
[replication feed](https://github.com/npm/registry/blob/main/docs/REPLICATE-API.md).

- 31,735 names say dsh, deepseek or harness.
- Search had reached 13,133 of them.
- Most "harness" names belong to Harness.io's CI tooling.
- Among the dsh and deepseek names search never returned, 6,881 packages
  declare themselves dsh plugins or depend on dsh's own packages, and name a
  GitHub repo. They name 3,562 repos, and 1,391 of those looked new to both
  of our registries.
- About 120 of the 1,391 were not new. A package records its repo's name as
  it was on publish day, GitHub redirects a renamed repo without saying so,
  and those were old names of repos we already list.

Discovery now reads that feed on every run, starting where the last run
stopped. The feed lists every publish of every npm package in order, about
110,000 a day. Its first run read 13,962 changes and found 182 new dsh
packages with a repo. The sweep that took in the feed's finds
([#212](https://github.com/dshworks/awesome-dsh-plugins/pull/212)) admitted
829 new repos from it once duplicates were merged. It rejected 470: 216
that dsh 0.2.1-rc.5 refuses to install, and 215 whose repo no longer exists.
It held 20 for a person to decide. The registry now lists 30,070 plugins.

## Who your fish obeys by default

We read the npm tarball of the four most-downloaded chat-channel plugins in
the npm data we collected for this sweep, and installed each on dsh
0.2.1-rc.5 from a scratch home. Weekly downloads are npm's figures for
2026-10-26 to 2026-11-01.

- **Official QQ bot, `@tencent-connect/dsh-qqbot` 0.5.5** (48,130 a week).
  - Private chat and groups both default to `open`
    ([`src/config.ts:104-106`](https://github.com/tencent-connect/dsh-qqbot/blob/0.5.5/src/config.ts#L104-L106)).
  - Scanning the QR code rewrites private chat to an allowlist holding only
    the scanner's id
    ([`src/setup/persist.ts:204-213`](https://github.com/tencent-connect/dsh-qqbot/blob/0.5.5/src/setup/persist.ts#L204-L213)).
    Groups are left as they were, answering when @-mentioned.
  - Its sessions work in their own folder, `~/.dsh-qqbot/workspace`, though
    its README still says `process.cwd()`.
- **NapCat/OneBot QQ, `dsh-onebot-qq` 0.9.10** (44,726).
  - Private chat answers admins only, and nobody until you name one.
  - Groups: any group, on @ or reply. Non-admins get a
    `[受限用户:仅问答]` prefix, which is itself a prompt; its README calls it
    a soft limit.
  - Admins can switch the session to full access from QQ with `/permission f`.
- **Many channels, `@xmanrui/dsh-im` 5.9.1** (43,557).
  - Per its README, a Feishu or QQ bot created by scanning lets every user
    chat and run its built-in commands, in private and group chats, until you
    set its whitelist and command permissions.
  - Those commands include `/workspace`, `/session` and `/permission`.
- **WeChat iLink, `dsh-plugin-weixin` 1.4.3** (5,599).
  - Pre-approves no one. The first message after the scan enrols its sender
    as the owner, so send yours first. Groups are off.

In both QQ plugins a group allowlist picks groups, not people: every member
of an allowed group can prompt the fish. A fish that answers only you has
groups turned off.

So the most-installed setups land on four different answers to "who can
drive my agent", and none of the four is the persona prompt. Our
[howto-dsh page](https://github.com/dshworks/howto-dsh/blob/main/start/raise-a-fish-safely.md)
([中文](https://github.com/dshworks/howto-dsh/blob/main/start/raise-a-fish-safely.zh.md))
gives the steps for each: its own profile, Workspace Write, owner-only access
and commands, an old spare account, and a look at the bill after day one.

## What this cannot see

- We read packages and installed them; we did not log a fish into QQ, WeChat
  or Feishu or send it a message. Every default above is read from code or
  README, not observed in a chat.
- npm's download counts include mirrors and CI, so they rank these plugins
  roughly, not by people.
- Defaults move between versions. The versions above are pinned; yours may
  differ.
