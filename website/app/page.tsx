import type { Metadata } from 'next';
import Image from 'next/image';
import { papers } from '../lib/papers';

export const metadata: Metadata = {
  title: 'Ferrous Bridge — C to Rust Translation Pipeline',
  description:
    'A typed, multi-agent pipeline that turns C libraries into safe, idiomatic Rust — with verifiable safety guarantees at every step. Proven on libyaml.',
  openGraph: {
    title: 'Ferrous Bridge — C to Rust Translation Pipeline',
    description:
      'A typed, multi-agent pipeline that turns C libraries into safe, idiomatic Rust — with verifiable safety guarantees at every step.',
    images: [{ url: '/og/synthesis.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ferrous Bridge',
    description: 'AI-driven C \u2192 Rust translation toolchain.',
    images: ['/og/synthesis.png'],
  },
};

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-eyebrow">Research &amp; Engineering</div>
          <h1 className="hero-title">
            Ferrous <em>Bridge</em>
          </h1>
          <p className="hero-tagline">
            A typed, multi-agent pipeline that turns C libraries into safe, idiomatic
            Rust &mdash; with verifiable safety guarantees at every step.
          </p>
          <p className="hero-subtagline">
            Proven on libyaml. Repeating on libexpat. Open-sourced as <code>safe-libyaml</code>.
          </p>
          <div className="hero-cta">
            <a href="/papers/synthesis" className="btn-primary">
              Read Synthesis Paper
            </a>
            <a
              href="https://github.com/YonedaAI/ferrous-bridge"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              GitHub / YonedaAI
            </a>
          </div>
        </div>
      </section>

      {/* Papers Grid */}
      <section id="papers" className="papers-section">
        <div className="section-header">
          <h2 className="section-title">Research Papers</h2>
          <hr className="section-divider" />
        </div>

        <div className="papers-grid">
          {papers.map((paper) => (
            <article key={paper.slug} className="paper-card">
              <div className="paper-card-cover">
                <Image
                  src={`/images/${paper.slug}.png`}
                  alt={`Cover image for ${paper.title}`}
                  width={600}
                  height={400}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  priority={paper.slug === 'synthesis'}
                />
              </div>
              <div className="paper-card-body">
                <span className="paper-part-badge">{paper.part}</span>
                <h3 className="paper-card-title">{paper.title}</h3>
                <p className="paper-card-abstract">
                  {paper.abstract.slice(0, 220)}
                  {paper.abstract.length > 220 ? '...' : ''}
                </p>
                <div className="paper-card-meta">
                  {paper.pages} pages &middot; {paper.category}
                </div>
                <div className="paper-card-actions">
                  <a href={`/papers/${paper.slug}`} className="card-btn-read">
                    Read
                  </a>
                  <a
                    href={`/pdf/${paper.slug}.pdf`}
                    download
                    className="card-btn-pdf"
                  >
                    PDF
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
