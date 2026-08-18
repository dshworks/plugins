import { getTag } from "@/lib/data";

export async function GET(_req: Request, { params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const file = await getTag(tag);
  if (!file) return respond({ error: "not found", tag }, 404);
  return respond(file);
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
