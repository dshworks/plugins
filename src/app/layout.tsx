import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://plugins.dsh.works"),
  title: { default: "dsh plugins — the install decision", template: "%s — dsh plugins" },
  description:
    "Not another list. For any DeepSeek Harness plugin: the file that proves it installs, whether anyone still maintains it, and what else does the same job. Not affiliated with DeepSeek.",
  openGraph: { type: "website", siteName: "dsh.works" },
  twitter: { card: "summary" },
};

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
            <a href="https://dsh.works/awesome-dsh-themes/">themes</a>
            <a href="https://github.com/dshworks/howto-dsh">notes</a>
            <a href="/api/plugins">api</a>
            <a href="https://github.com/dshworks">github</a>
          </span>
        </nav>
        {children}
      </body>
    </html>
  );
}
