import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Crimson_Pro } from 'next/font/google';
import 'katex/dist/katex.min.css';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const crimsonPro = Crimson_Pro({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.NEXT_PUBLIC_SITE_URL || 'https://ferrous-bridge.vercel.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Ferrous Bridge',
    template: '%s | Ferrous Bridge',
  },
  description:
    'A typed, multi-agent pipeline that turns C libraries into safe, idiomatic Rust \u2014 with verifiable safety guarantees at every step. Proven on libyaml.',
  openGraph: {
    type: 'website',
    siteName: 'Ferrous Bridge',
    images: [{ url: '/og/synthesis.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og/synthesis.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${crimsonPro.variable}`}
    >
      <body className="antialiased">
        <header className="site-header">
          <div className="header-inner">
            <a href="/" className="site-logo">
              <span className="logo-icon">&#x2B21;</span>
              <span className="logo-text">Ferrous Bridge</span>
            </a>
            <nav className="header-nav" aria-label="Site navigation">
              <a href="/#papers" className="nav-link">
                Papers
              </a>
              <a
                href="https://github.com/YonedaAI/ferrous-bridge"
                className="nav-link"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </nav>
          </div>
        </header>

        <main className="site-main">{children}</main>

        <footer className="site-footer">
          <div className="footer-inner">
            <div className="footer-brand">
              <span className="footer-logo">Ferrous Bridge</span>
              <span className="footer-tag">C &#x2192; Rust Translation Pipeline</span>
            </div>
            <div className="footer-links">
              <a
                href="https://github.com/YonedaAI/ferrous-bridge"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                GitHub / YonedaAI
              </a>
            </div>
            <div className="footer-meta">
              Research papers on automated C to safe Rust translation. Target: libyaml (~9K LOC)
              &#x2192; safe-libyaml.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
