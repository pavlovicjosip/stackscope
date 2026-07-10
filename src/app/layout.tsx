import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteUrl } from "@/lib/site";
import "@xyflow/react/dist/style.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "StackScope — See how software systems work",
    template: "%s · StackScope",
  },
  description: "Interactive, visual lessons that explain how frontend, backend, data, deployment, and architecture fit together.",
  openGraph: {
    title: "StackScope",
    description: "Follow real requests through modern software systems.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: `(function(){try{var stored=localStorage.getItem('stackscope-theme');var theme=stored==='light'||stored==='dark'?stored:(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;}catch(e){document.documentElement.dataset.theme='light';}})();` }} /></head>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header">
          <div className="site-header__inner">
            <Link className="brand" href="/" aria-label="StackScope home">
              <span className="brand__mark" aria-hidden="true"><span />SS</span>
              <span>StackScope</span>
            </Link>
            <nav className="site-nav" aria-label="Primary navigation">
              <Link href="/architect/">Architect lab</Link>
              <Link href="/learn/">Explore lessons</Link>
              <Link href="/concepts/dns/">Concepts</Link>
              <Link href="/about/methodology/">How it works</Link>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div>
            <Link className="brand brand--footer" href="/">
              <span className="brand__mark" aria-hidden="true"><span />SS</span>
              <span>StackScope</span>
            </Link>
            <p>Clear mental models for complex software.</p>
          </div>
          <div className="site-footer__links">
            <Link href="/architect/">Architect lab</Link>
            <Link href="/learn/">All lessons</Link>
            <Link href="/about/methodology/">Methodology</Link>
            <span>Content reviewed 2026</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
