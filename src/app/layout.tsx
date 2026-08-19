import type { Metadata } from "next";
import { getMeta } from "@/lib/data";
import "./globals.css";

// Derived, not typed in. The count in this description was 6,290 for a week
// after the registry stopped saying 6,290 — a stale number in the one string
// search engines and chat apps quote back, on a site whose argument is that
// directories publish numbers they no longer measure. It reads the same
// meta.json the pages do.
export async function generateMetadata(): Promise<Metadata> {
  const meta = await getMeta();
  const n = meta ? meta.counts.plugins.toLocaleString() : "6,000+";
  return {
    metadataBase: new URL("https://dsh.works"),
    title: { default: "dsh.works — should you install it?", template: "%s — dsh.works" },
    description:
      `Not another list. For each of ${n} DeepSeek Harness plugins: the file that proves it installs, whether anyone still maintains it, and how crowded the shelf is. Community-run, not affiliated with DeepSeek.`,
    openGraph: { type: "website", siteName: "dsh.works" },
    twitter: { card: "summary" },
    // The front page's design promise lives in a source comment, which the
    // bundler strips — so the one line that makes it auditable against the
    // render is emitted as real markup. Anyone can now check the shipped page
    // against the staging it claims to be built on.
    other: {
      "design-form": "staging: first-viewport-is-the-product-running · roll 3778195c · see src/app/page.tsx",
    },
  };
}

// The theme toggle is three states (auto / light / dark), so it is a word and
// not an icon — two icons cannot express three states. It only ever upgrades
// something already on the page: with no JS the page follows the OS.
const THEME_SCRIPT = `try{var t=localStorage.getItem('dsh-theme');if(t&&t!=='auto')document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <nav className="sitebar" aria-label="dsh.works">
          <a className="sitebar-brand" href="https://dsh.works/">
            <span className="caret">&gt;</span> dsh<i>.works</i>
          </a>
          <span className="sitebar-links">
            <a href="/" aria-current="page">plugins</a>
            <a href="/awesome-dsh-themes/">themes</a>
            <a href="https://github.com/dshworks/howto-dsh">notes</a>
            <a href="#ours">ours</a>
            <a href="/api/plugins">api</a>
            <a href="https://github.com/dshworks">github</a>
          </span>
        </nav>
        {children}
      </body>
    </html>
  );
}
