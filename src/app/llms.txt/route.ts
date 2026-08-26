import { getMeta } from "@/lib/data";
import { oursCount, oursHosted } from "@/lib/ours";

// The audience for a plugin directory is people running agents, so the site
// publishes a map an agent can read in one fetch. One of the twenty-four
// competing directories offers a machine surface at all; none publish this.
export async function GET() {
  const meta = await getMeta();
  const c = meta?.counts;
  const n = (v?: number) => (v === undefined ? "?" : v.toLocaleString());
  const body = `# dsh.works

> The install decision for DeepSeek Harness (dsh) plugins. Not a list of what
> exists — there are more than twenty of those and they all scrape the same
> GitHub topic. For each of ${n(c?.plugins)} plugins this site answers three things:
> which file proves it installs, whether anyone still maintains it, and how
> crowded the shelf is that it sits on. Also the front door for the dshworks
> registries (plugins, themes), the field notes, and the ${oursCount().toLowerCase()} plugins this org
> publishes. Community-run, MIT, not affiliated with DeepSeek.

Built ${meta?.built ?? "?"} from the open registry at
https://github.com/dshworks/awesome-dsh-plugins, checked against dsh
${meta?.verifiedAgainst ?? "?"}. ${n(c?.withProof)} of ${n(c?.plugins)} entries carry an \`evidence\`
receipt: the \`path#key\` of a file on the repo's default branch that a reader
can open. Entries without one say so on their page rather than being quietly
dropped or quietly badged.

## Fetch these, not the HTML

- /api/plugins — counts, tag list, endpoints, build date
- /api/plugins/{slug} — one plugin: proof, install command, pulse, tag, repo facts
- /api/tags/{tag} — every plugin carrying a tag, ordered by last push
- /_data/index.json — every entry as a compact tuple, for search
- /_data/seams.json — which harness extension seams the ecosystem uses, with the counting regex and the harness source path for each
- /sitemap.xml — every page on this site
- /awesome-dsh-plugins/plugins.json — the upstream registry, unprojected
- /awesome-dsh-themes/themes.json — every theme, with preview and CSS pointers
- /awesome-dsh-plugins/stats.json — counts only, ~150 bytes, for a badge

## Human surfaces

- / — this page: search, the crowded shelves, what nobody has built, what we ship
- /#unbuilt — the seam map: 11k plugins measured against the harness's extension points
- /p/{slug} — the decision page for one plugin
- /tag/{tag} — everything on one shelf, freshest first
- /awesome-dsh-plugins/ — the same registry as a filterable gallery
- /awesome-dsh-themes/ — the theme gallery, with live in-browser previews
- ${oursHosted().map((p) => p.href).join(" , ")} — plugins this org publishes
- https://github.com/dshworks/howto-dsh — verified field notes on the harness itself

## Fields that are not obvious

- \`proof\` — {path, key, url}. The file that was read to prove the install
  path. Absent means nothing proved on the last read, not "unsafe".
- \`pulse\` — {band, days} from the repo's last push. A fact, not a score. There
  is deliberately no health grade, quality score, or ranking anywhere here.
- \`tag\` — the rarest of an entry's tags, used as its shelf. A tag is a shelf,
  not a job: \`memory\` holds a context panel, a shell bridge and a
  session-deleter. Do not read a shared tag as "these do the same thing".

## What this is not

Not official. Not a security review — an install path was checked, not a
codebase; git installs run code at install time, outside any sandbox. Not a
quality ranking — stars are a dated snapshot carried so you can sort. Nothing
here is sold, sponsored, or promoted.
`;
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=3600",
      "access-control-allow-origin": "*",
    },
  });
}
