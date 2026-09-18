/// <reference types="vite/client" />
// The notes: dated posts about what changed under the ecosystem this site
// measures -- a dsh release, a DeepSeek price, a census that moved.
//
// One file per note under content/notes/, named YYYY-MM-DD-slug.md, with a
// small frontmatter block (title, summary). Same shape as dshthemes.com's
// /notes/, so a note can move between the two sites without a rewrite.
//
// Bundled at build time through Vite's import.meta.glob, not fetched: the
// Worker has no filesystem, and a note is code-reviewed text that ships with
// the build that renders it. A note is dated and stays true of its date; it is
// the one place on this site a number may be written down rather than read,
// and scripts/check-claims.mjs requires every note to link its sources.
//
// The markdown subset is deliberately small: headings, paragraphs, lists,
// fenced code, blockquotes, tables, links, `code`, **bold**, _italic_. If a
// note needs more than that, the note is the problem.

export type Note = {
  slug: string;
  date: string;
  title: string;
  summary: string;
  html: string;
  text: string;
};

const files = import.meta.glob("/content/notes/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export function parseNote(text: string, file: string): Note & { draft: boolean } {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?/);
  const meta: Record<string, string> = {};
  let body = text;
  if (m) {
    body = text.slice(m[0].length);
    for (const line of m[1].split("\n")) {
      const kv = line.match(/^([a-zA-Z][\w-]*):\s*(.*)$/);
      if (kv) meta[kv[1]] = kv[2].trim().replace(/^["'](.*)["']$/, "$1");
    }
  }
  const fromName = file.match(/(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  const src = body.trim();
  return {
    slug: meta.slug || fromName?.[2] || file,
    date: meta.date || fromName?.[1] || "1970-01-01",
    title: meta.title || "Untitled",
    summary: meta.summary || "",
    draft: meta.draft === "true",
    html: markdown(src),
    text: plain(src),
  };
}

const NOTES: Note[] = Object.entries(files)
  .map(([path, text]) => parseNote(text, path.split("/").pop()!))
  .filter((n) => !n.draft)
  .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));

export const getNotes = (): Note[] => NOTES;
export const getNote = (slug: string): Note | null => NOTES.find((n) => n.slug === slug) ?? null;

// --- markdown ----------------------------------------------------------------

export function markdown(src: string): string {
  const out: string[] = [];
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) buf.push(lines[i++]);
      i++;
      out.push(`<pre${lang ? ` data-lang="${esc(lang)}"` : ""}><code>${esc(buf.join("\n"))}</code></pre>`);
      continue;
    }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      // The note's own title is the h1, so a `#` in the body is an h2.
      const level = Math.min(h[1].length + 1, 4);
      out.push(`<h${level} id="${slugId(h[2])}">${inline(h[2])}</h${level}>`);
      i++;
      continue;
    }

    if (line.startsWith("> ")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) buf.push(lines[i++].replace(/^>\s?/, ""));
      out.push(`<blockquote>${markdown(buf.join("\n"))}</blockquote>`);
      continue;
    }

    if (line.trim().startsWith("|") && lines[i + 1]?.trim().startsWith("|")) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) buf.push(lines[i++].trim());
      out.push(table(buf));
      continue;
    }

    const bullet = /^\s*[-*]\s+/.test(line);
    const number = /^\s*\d+\.\s+/.test(line);
    if (bullet || number) {
      const re = bullet ? /^\s*[-*]\s+/ : /^\s*\d+\.\s+/;
      const items: string[] = [];
      while (i < lines.length && re.test(lines[i])) {
        let item = lines[i++].replace(re, "");
        while (i < lines.length && /^\s{2,}\S/.test(lines[i]) && !re.test(lines[i])) item += ` ${lines[i++].trim()}`;
        items.push(`<li>${inline(item)}</li>`);
      }
      const tag = bullet ? "ul" : "ol";
      out.push(`<${tag}>${items.join("")}</${tag}>`);
      continue;
    }

    const buf: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,4}\s|```|>\s|\s*[-*]\s|\s*\d+\.\s|\|)/.test(lines[i])) {
      buf.push(lines[i++]);
    }
    out.push(`<p>${inline(buf.join(" "))}</p>`);
  }
  return out.join("\n");
}

function table(rows: string[]): string {
  const cells = (r: string) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
  const head = cells(rows[0]);
  const body = rows.slice(/^[\s|:-]+$/.test(rows[1] ?? "") ? 2 : 1);
  return `<div class="note-table"><table><thead><tr>${head.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead><tbody>${body
    .map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

// Code spans are lifted out first so nothing inside them is re-read as markup.
function inline(src: string): string {
  const spans: string[] = [];
  let s = src.replace(/`([^`]+)`/g, (_, code: string) => `\uE000${spans.push(`<code>${esc(code)}</code>`) - 1}\uE000`);
  s = esc(s);
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, href: string) =>
    `<a href="${href}"${/^https?:/.test(href) ? ' rel="noopener"' : ""}>${label}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
  s = s.replace(/(^|[\s(])_([^_]+)_(?=[\s.,;:)!?]|$)/g, "$1<i>$2</i>");
  return s.replace(/\uE000(\d+)\uE000/g, (_, n: string) => spans[Number(n)]);
}

function plain(src: string): string {
  return src
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_`|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function slugId(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
