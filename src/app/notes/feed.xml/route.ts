import { getNotes } from "@/lib/notes";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);

// RSS 2.0, full text. A reader who follows the notes should not need the site.
export async function GET() {
  const base = "https://dsh.works";
  const notes = getNotes();
  const items = notes
    .map((n) => {
      const url = `${base}/notes/${n.slug}`;
      return `  <item>
    <title>${esc(n.title)}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <pubDate>${new Date(`${n.date}T00:00:00Z`).toUTCString()}</pubDate>
    <description>${esc(n.summary)}</description>
    <content:encoded><![CDATA[${n.html.replace(/]]>/g, "]]&gt;")}]]></content:encoded>
  </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>dsh.works notes</title>
  <link>${base}/notes</link>
  <atom:link href="${base}/notes/feed.xml" rel="self" type="application/rss+xml"/>
  <description>Dated notes on what changed under the dsh plugin ecosystem.</description>
  <language>en</language>
${items}
</channel>
</rss>
`;
  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=300, s-maxage=3600",
    },
  });
}
