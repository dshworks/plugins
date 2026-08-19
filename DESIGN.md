# DESIGN.md — dsh.works

What the surface is made of, written from the built thing rather than from the
intention. If the code and this file disagree, the code is right and this file
is stale — fix it.

The material is not ours alone: it is the house contract shared by dsh.works,
dshthemes.com, freeseek, dsh-meter and dsh-crew. Changing a token here changes
the org. Extending is cheap; replacing is a decision about six surfaces.

## Tokens

Every colour is declared twice in `src/app/globals.css` — the dark value alone,
then the `light-dark()` pair — so a browser without `light-dark()` keeps the
dark value and the page still works. **No colour literal exists outside that
`:root` block.**

| Token | Dark | Light | Means |
| --- | --- | --- | --- |
| `--bg` | `#000000` | `#fbfaf7` | the ground |
| `--surface` / `--surface-2` | `#0d0d0d` / `#141414` | `#f2f1ec` / `#e8e7e0` | raised panels, inline code |
| `--line` | `#262626` | `#d4d1c7` | every hairline; 1px, always |
| `--text` / `--muted` / `--strong` | `#e8e8e8` / `#9a9a9a` / `#fff` | `#17171a` / `#5a5a60` / `#000` | body, secondary, emphasis |
| `--cyan` | `#00c2e9` | `#0a6e85` | links, the one chart accent |
| `--pink` | `#e41478` | `#bd0e60` | section labels, the prompt caret, our own bar in a chart |
| `--yellow` | `#ffd53d` | `#7a5200` | **state only** — the `warn` pill |
| `--gold` | `#f0c14b` | `#8a6206` | **the four sponsor seats, and nothing else** |

Type is JetBrains Mono at 300 for everything; 700 for headings. One radius:
3px. One measure: `--measure: 68ch`. Motion is a ladder — `--t1`/`--t2` for
anything the pointer causes, `--t3`+ for anything the scroll causes, all on
`--ease-out` (quintic), all off under `prefers-reduced-motion`.

## The gold rule

`--gold` marks the only thing on this site that money can move. It appears in
exactly one component (`src/app/seats.tsx`) and nowhere else, which is how the
disclosure is made in paint instead of in a footnote:

- it is **not** `--yellow` — yellow is the `warn` state, and an advertisement
  wearing a warning colour reads as a fault;
- do not reach for it for a highlight, a callout, a "featured" badge, or a
  fourth accent. The moment gold means two things it means nothing, and the
  page loses the one signal that tells a stranger which box was bought.

## The seats

Four, `$490/yr`, inventory in `data/sponsors.json` (committed on purpose — see
`.gitignore`, and note dshthemes.com fetches it from this repo's raw URL).

Structural rules, in order of how expensive they are to get wrong:

1. **Nothing joins the seat data to the registry.** `build-data.mjs` copies
   `sponsors.json` through untouched and never reads it into a plugin record.
   A seat buys the box: no row, rank, tag, receipt, or listing decision.
2. **The band sits under the console, never above it.** The staging this page
   is built on gives the first viewport to the running product. A directory
   that puts advertising over its own working surface has told you what it is.
3. **Empty seats render empty** (`[ + ]`, "open"). Drawing imaginary logos
   would be the same trick as printing a number nobody measured.
4. Paid links carry `rel="sponsored nofollow noopener"`. The markup is what
   makes the sentence in the copy true.
5. The specimen slot — the one plugin decided on the front page — is picked by
   a printed rule in `build-data.mjs` and is **not for sale**. The four seats
   exist so it never has to be.

## Composition

The front page is built on the staging *First Viewport Is the Product Running*
(roll `3778195c`, recorded in the page's promise comment and emitted as a
`design-form` meta tag so the shipped HTML can be audited against it).

```
sitebar
h1 + one line of counts        <- orientation, small on purpose
.console                       <- live field over 6,290 rows
  └ .verdict                      one real plugin, already decided
.chips                         <- tag filters (a scrolling strip under 34rem)
.seats                         <- the gold band, above the fold at 390/768/1440
.strip                         <- four measured facts
three .figure charts           <- the argument, each with its provenance foot
.panel                         <- proof / rejections / dated / paid
...registries, ours, api, what this is not
```

## Verified

Rendered at 390 / 768 / 1440 in both schemes (cloakbrowser, container-local
`wrangler dev`). No horizontal overflow at any width; the seat band's top rule
is above the fold at all three. `bans.sh` is clean apart from `★` (the site's
unit mark for stars, not decoration) and `#000000`, which is the house ground.

Contrast, measured (WCAG 2.1 relative luminance), dark / light:

| Pair | Ratio | Floor |
| --- | --- | --- |
| `--gold` on `--bg` | 12.43 / 5.25 | AA text (4.5) ✓ |
| `--gold-line` on `--bg` | 3.65 / 3.07 | UI boundary (3.0) ✓ |
| `--muted` on `--bg` | 7.46 / 6.56 | AA text ✓ |

`--gold-line` started at `#6b5420` / `#e0cfa0` and measured 2.91 / **1.48** —
under the floor, and in light mode the `[ ]` brackets read as a rendering
fault. It was moved rather than argued with.

## Not checked

Real-device rendering, the JetBrains Mono fallback on a cold cache, and
`prefers-contrast`.
