import { getMeta, getSlugs } from "@/lib/data";

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

  // Read through the binding, not by fetching our own origin. /_data/* is a
  // Worker route at the apex, so the origin fetch resolved to this same Worker
  // and quietly returned nothing — the sitemap shipped 18 URLs instead of
  // 6,308 and looked like it had worked.
  const index = await getSlugs();
  const slugs = index?.slugs ?? [];

  const urls = [
    { loc: base, priority: "1.0" },
    ...meta.tags.map((t) => ({ loc: `${base}/tag/${t.tag}`, priority: "0.8" })),
    ...slugs.map((slug) => ({ loc: `${base}/p/${encodeURIComponent(slug)}`, priority: "0.5" })),
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
