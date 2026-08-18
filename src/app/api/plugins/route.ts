import { getMeta } from "@/lib/data";

// The API is the same JSON the pages render from, not a second product. It
// exists because the audience for a plugin directory is people running agents,
// and an agent should not have to parse HTML to read a registry.
export async function GET() {
  const meta = await getMeta();
  if (!meta) return json({ error: "data not built" }, 503);
  return json({
    ...meta,
    endpoints: {
      plugin: "/api/plugins/{slug}",
      job: "/api/jobs/{job}",
      index: "/_data/index.json",
      registry: "https://dsh.works/awesome-dsh-plugins/plugins.json",
    },
    license: "MIT",
    affiliation: "community-run, not affiliated with DeepSeek",
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Rebuilt daily at most; a stale-while-revalidate window means a crawler
      // storm costs one origin render, not thousands.
      "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      "access-control-allow-origin": "*",
    },
  });
}
