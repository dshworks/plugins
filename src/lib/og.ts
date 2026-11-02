// The social card every page shares (public/og.png, rendered from
// scripts/og.html). Next merges metadata one top-level key at a time, so a page
// that sets its own `openGraph` drops the layout's image unless it names it
// again -- hence one constant, spread by the layout and by every page that
// overrides openGraph. The card carries no count, so it cannot go stale.
export const OG_IMAGES = [
  { url: "/og.png", width: 1200, height: 630, alt: "dsh.works: should you install it?" },
];
