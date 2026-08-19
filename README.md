# dsh.works

**The install decision for DeepSeek Harness plugins.** Not another list.

There are more than twenty directories of dsh plugins. Every one of them
answers *what exists*, by scraping the same GitHub topic and printing a count.
The counts range from **20 to 6,685 for the same universe** — which tells you
the number is a filter policy, not a fact.

This site answers the next question. For each of ~6,190 plugins:

| Row | What it says | Where it comes from |
| --- | --- | --- |
| **Proof** | the file that proves it installs, as `path#key`, as a link you open | `evidence` in the registry |
| **Install** | the command, and whether it runs code on your machine at install time | `npm` / `repo` / `path` |
| **Pulse** | days since last push, and how many on the same shelf pushed sooner | GitHub `pushedAt` |
| **Also** | how crowded the shelf is, freshest first | the registry's 17 tags |
| **Not** | what this page is not evidence of | stated, every time |

Nothing here is scored, graded, ranked, or estimated. Every number is a fact
in the registry or arithmetic on one. A directory that invents a number is
asking to be believed, and being believed is not what this is for.

## A tag is a shelf, not a verdict

`memory` holds 451 plugins: a context-insight panel, a shell bridge, and a
session-deleter all land there. The site says **"451 plugins carry the memory
tag"** and never "451 plugins do this job", because the tag is what the data
supports and the stronger sentence would be a lie wearing a fact's clothes.

The shelf is still worth showing. Seeing the crowd before you pick from it is
more than a card in a grid of six thousand will ever tell you.

## Where the data comes from

[`dshworks/awesome-dsh-plugins`](https://github.com/dshworks/awesome-dsh-plugins)
— open data, MIT, 98.8% of the `dsh-plugin` topic decided, and the only
registry in this ecosystem where every `verified` row names the file it was
verified from. This site is a reader of that registry, not a second source of
truth: `npm run data` fetches it and derives, it never edits.

## Architecture, and why

- **Next 16 App Router on Vite (`vinext`), deployed to Cloudflare Workers.**
  Every HTML route is server-rendered, so all 6,290 plugin URLs are real,
  crawlable pages — the single-page galleries have exactly one.
- **The Worker owns paths, not the hostname.** `dsh.works/`, `/p/*`, `/tag/*`,
  `/api/*`, `/assets/*`, `/_data/*`, `/llms.txt`, `/sitemap.xml`. Everything
  else falls through to GitHub Pages exactly as before, so
  `/awesome-dsh-plugins/`, `/awesome-dsh-themes/`, `/dsh-meter/` and
  `/dsh-crew/` are untouched. It is not timidity: `dshworks.github.io/*`
  301-redirects to `dsh.works/*`, so a Worker holding every path could not
  proxy those project sites without looping into itself.
- **The registry ships as static assets, not in the bundle.** It is ~4 MB
  against a 3 MB script limit. The Worker reads it through the `ASSETS`
  binding: an internal lookup, no egress, and no second store that can
  disagree with the code that rendered the page. Measured before designing.
- **No database, no auth, no KV.** There is no state. Adding one would be
  adding something to keep in sync with git for data that is already static.
- **The search index loads on touch, not on paint.** 907 KB is real; most
  visitors never search, and everything above the box is server-rendered and
  readable with JavaScript off.

## For agents

- `/llms.txt` — the map, in one fetch
- `/api/plugins` — counts, tags, endpoints
- `/api/plugins/{slug}` — one plugin, including its proof and install command
- `/api/tags/{tag}` — a whole shelf, freshest first
- `/sitemap.xml` — every page

MIT, no key, CORS open. The audience for a plugin directory is people running
agents; making them parse HTML would be a strange way to serve them.

## Develop

```sh
npm install
npm run data              # fetch the registries and derive
DATA_SOURCE=local npm run data   # ...or read the sibling checkouts
npx vinext build
npx wrangler dev          # workerd, with the real ASSETS binding
```

`wrangler dev` is the honest local test — it runs the same runtime as
production, with the same binding. `vinext dev` runs on Node and stubs the
binding out.

## What this is not

Not official — dsh is DeepSeek's, at
[deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness).
Not a security review: an install path was checked, not a codebase, and git
installs run code on your machine at install time outside any sandbox. Not a
quality ranking. Nothing here is sold, sponsored, or promoted.

MIT.
