import { getPlugin, installCommand } from "@/lib/data";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPlugin(slug);
  if (!p) return respond({ error: "not found", slug }, 404);
  return respond({ ...p, install: installCommand(p), page: `https://dsh.works/p/${p.slug}` });
}

function respond(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
      "access-control-allow-origin": "*",
    },
  });
}
