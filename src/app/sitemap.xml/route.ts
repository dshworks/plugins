import { getMeta } from "@/lib/data";

// A crawlable URL per plugin is the thing this site has and the single-page
// galleries do not. The sitemap is how a crawler learns those 6,290 URLs exist
// without walking that many links off the home page.
//
// Written as a route handler rather than Next's `sitemap.ts` convention: that
// convention is not wired in vinext yet, and a sitemap that silently does not
// deploy is worse than none.
export async function GET(req: Request) {
  const base = new URL(req.url).origin;
  const meta = await getMeta();
  if (!meta) return new Response("data not built", { status: 503 });

  const index = await fetch(`${base}/_data/index.json`).catch(() => null);
  const rows: [string][] = index?.ok ? ((await index.json()) as { plugins: [string][] }).plugins : [];

  const urls = [
    { loc: base, priority: "1.0" },
    ...meta.tags.map((t) => ({ loc: `${base}/tag/${t.tag}`, priority: "0.8" })),
    ...rows.map((r) => ({ loc: `${base}/p/${encodeURIComponent(r[0])}`, priority: "0.5" })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => `  <url><loc>${u.loc}</loc><lastmod>${meta.built}</lastmod><priority>${u.priority}</priority></url>`)
  .join("\n")}
</urlset>
`;
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
