"use client";

import { usePathname } from "next/navigation";

// The layout renders on every route and cannot tell which one, so it marked
// "plugins" current on /notes too, and its bare `#ours` pointed at an anchor
// only the front page has — a dead link on every other page. The path decides
// here, and "ours" names the page its anchor lives on.
const LINKS: { href: string; label: string; current?: (path: string) => boolean }[] = [
  { href: "/", label: "plugins", current: (p) => p === "/" || p.startsWith("/p/") || p.startsWith("/tag/") },
  { href: "/awesome-dsh-themes/", label: "themes" },
  { href: "/notes", label: "notes", current: (p) => p === "/notes" || p.startsWith("/notes/") },
  { href: "/#ours", label: "ours" },
  { href: "/api/plugins", label: "api" },
  { href: "https://github.com/dshworks", label: "github" },
];

export default function SiteLinks() {
  const path = usePathname() ?? "";
  return (
    <span className="sitebar-links">
      {LINKS.map(({ href, label, current }) => (
        <a key={label} href={href} aria-current={current?.(path) ? "page" : undefined}>
          {label}
        </a>
      ))}
    </span>
  );
}
