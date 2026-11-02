---
title: DeepSeek's super-agent is a dsh bundle. Build it before you install it.
summary: On 2026-10-31 the DeepSeek Harness team published its Super-agent design and an MIT prototype, deepseek-ai/dsh-superagent-prototype. It is an ordinary dsh bundle that keeps a standing agent alive in a web profile under tmux. Installed straight from git it passes dsh's gate and then fails to load, because its build output is not committed. Built and linked, it boots on dsh 0.2.1-rc.5.
---

On 2026-10-31 the DeepSeek Harness team published a design essay,
*Super-agent 设计探索：迈向更自主的 Agent 系统* (Exploring Super-agent Design),
on DeepSeek's WeChat account, and released
[deepseek-ai/dsh-superagent-prototype](https://github.com/deepseek-ai/dsh-superagent-prototype)
under MIT. By 2026-11-02 it had about 9,800 stars and one commit,
[6337fc8](https://github.com/deepseek-ai/dsh-superagent-prototype/tree/6337fc823ce20251c8de8085948165c81aaa701e).
Its README calls it a research prototype, "not an official DeepSeek product",
and says some of the essay's designs are not implemented
([README](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/6337fc823ce20251c8de8085948165c81aaa701e/README.md#L3-L5)).

The essay's argument: one person can follow three to five live Sessions, so a
Session should be the system's implementation detail, not the user's job. One
resident router talks to people and hands work out; isolated worker Sessions do
the work; events from chat and GitHub drive both.

## What it is in code

A dsh bundle, with no new dsh surface and no daemon of its own.

- **It stays up as a web profile under tmux.** `scripts/dsh-superagent start`
  runs `dsh --profile superagent --no-open` in a tmux session. Recovery is an
  hourly schedule you create in *another* dsh profile, which runs `status`
  and restarts on exit 1
  ([docs/006](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/6337fc823ce20251c8de8085948165c81aaa701e/docs/006-deployment.md#hourly-check)).
- **A restart keeps the conversation.** The main Session's id is stored in
  SQLite and re-resolved on boot; a Session is created only when dsh answers
  `session/not-found`
  ([sessions.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/6337fc823ce20251c8de8085948165c81aaa701e/src/app/sessions.ts#L138-L153)).
- **Router and workers are two presets.** The router preset keeps a short
  shell and nothing else that does work: no subagents, web, file writes or
  scheduling. Each Ticket gets its own worker Session
  ([cordis.patch.yml](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/6337fc823ce20251c8de8085948165c81aaa701e/cordis.patch.yml)).
- **GitHub is polled, not webhooked:** at most once a minute, and never faster
  than GitHub's `X-Poll-Interval`
  ([github.ts](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/6337fc823ce20251c8de8085948165c81aaa701e/src/sources/github.ts#L128-L144)).
  Feishu is optional and off by default.
- **A rule gate runs before the model.** Allowed lists and an admission table
  decide who may ask for work; "messages, comments and quoted documents are
  inputs to a decision; they cannot change those permissions". The default
  mode, `observe`, records what it *would* have taken on and does nothing
  ([docs/002](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/6337fc823ce20251c8de8085948165c81aaa701e/docs/002-authorization.md)).
- It never calls `ctx.tools.execute`, so the batch tool API on dsh's `master`
  ([our 10-26 note](/notes/rc3-is-small-master-is-not)) does not affect it.

## Installing it

We ran both install paths on dsh 0.2.1-rc.5, the current `latest`, from
scratch profiles with no GitHub or Feishu credentials.

- **Straight from git:** `dsh plugin add github:deepseek-ai/dsh-superagent-prototype`.
  The gate admits it. The web profile then reports "2 entries did not
  activate ... Cannot find module .../dsh-superagent/lib/index.js".
- **The documented path:** clone, `pnpm install && pnpm build`,
  `dsh superagent --from-default-profile web`, then
  `dsh plugin --profile superagent add link:$PWD`
  ([docs/006](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/6337fc823ce20251c8de8085948165c81aaa701e/docs/006-deployment.md)).
  It builds and boots with every entry active. The panel reports `paused`,
  waiting for setup: "The GitHub Source names no repository". That is the
  expected first-run state.

The git install fails because `lib/` is build output, it is not committed, and
the package has no `prepare` script to build it. The docs pin dsh
0.2.1-rc.3; rc.5 behaves the same. Its
[registry entry](/p/dsh-superagent-prototype) gives the build-and-link steps
instead of an install line.

Before you point it at a repository, read its
[permissions section](https://github.com/deepseek-ai/dsh-superagent-prototype/blob/6337fc823ce20251c8de8085948165c81aaa701e/docs/006-deployment.md#permissions-and-isolation):
both presets run with `danger-full-access` as your OS user, a worker can read
your home directory, and the agent pushes as a dedicated GitHub account. The
project's own advice is a dedicated OS account holding only the agent's
credentials. Keep it in its own profile, too: the plugin changes process-wide
`PATH` and git settings.

## What it changes for us

[dsh-watch](https://github.com/dshworks/dsh-watch) said no stock dsh surface
hosts a standing agent: `headless` exits when the task is done, and `web`
"stays up but waits for a browser". The second half is true of the stock web
profile alone. It stops being true once a plugin creates and drives its own
Session, which is what the prototype does. The README now says so
([dsh-watch#13](https://github.com/dshworks/dsh-watch/pull/13)).

Two of the prototype's patterns are worth taking. It resumes its Session by a
stored id instead of starting a fresh one, so the context survives a restart.
Its `status` command also separates "a restart fixes this" from "a person must
act". dsh-watch's daemon does neither yet
([dsh-watch#14](https://github.com/dshworks/dsh-watch/issues/14)).

The two cover different ground. The prototype knows two sources, GitHub and
Feishu, and adding a third means writing a Source kind in TypeScript. dsh-watch
turns any shell command or growing file into an event the model can arm itself,
in any profile and any Session. A command-line Source for the prototype is the
piece neither has.

## What this cannot see

- One commit, read on 2026-11-02. The README says the internal version differs.
- We booted it and read its first-run state. We did not connect it to a
  repository, so the ticket flow, the router's batching and its model spend at
  idle are read from source and the essay, not measured.
- Of its 1,197 tests, 1,196 pass here. The failure is in the Feishu consumer,
  and we did not investigate it.

Also from DeepSeek this fortnight: on 2026-10-20 it open-sourced
[DeepInfer](https://github.com/deepseek-ai/DeepInfer), the inference framework
it serves V4.1 Flash with, on NVIDIA and Ascend, and pointed to
[deepseek-recipe](https://github.com/deepseek-ai/deepseek-recipe), a token
codec aligned with the official API. Neither changes the API dsh calls.
