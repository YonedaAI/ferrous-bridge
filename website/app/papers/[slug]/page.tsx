import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { papers, getPaper, getPaperIndex } from '../../../lib/papers';
import { getPaperHtml } from '../../../lib/paper-content';
import { PaperContent } from '../../../components/PaperContent';
import { TableOfContents } from '../../../components/TableOfContents';

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return papers.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const paper = getPaper(params.slug);
  if (!paper) return {};

  return {
    title: paper.title,
    description: paper.abstract.slice(0, 300),
    openGraph: {
      title: paper.title,
      description: paper.abstract.slice(0, 300),
      type: 'article',
      url: `/papers/${paper.slug}`,
      images: [{ url: `/og/${paper.slug}.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: paper.title,
      description: paper.abstract.slice(0, 200),
      images: [`/og/${paper.slug}.png`],
    },
  };
}

export default function PaperPage({ params }: PageProps) {
  const paper = getPaper(params.slug);
  if (!paper) notFound();

  const { html, headings } = getPaperHtml(params.slug);

  const idx = getPaperIndex(params.slug);
  const prev = idx > 0 ? papers[idx - 1] : null;
  const next = idx < papers.length - 1 ? papers[idx + 1] : null;

  return (
    <>
      {/* TOC hamburger for mobile (outside grid so it spans full width) */}
      <div className="paper-page-wrapper">
        <div className="paper-page">
          {/* Sidebar TOC (desktop) */}
          <aside className="paper-sidebar" aria-label="Table of contents">
            <TableOfContents headings={headings} />
          </aside>

          {/* Main content */}
          <div className="paper-content-area">
            {/* Mobile TOC */}
            <div className="paper-mobile-toc">
              <TableOfContents headings={headings} />
            </div>

            {/* Paper header */}
            <header className="paper-header">
              <div className="paper-part-label">{paper.part}</div>
              <h1 className="paper-title">{paper.title}</h1>
              <div className="paper-meta-row">
                <span className="paper-meta-item">{paper.pages} pages</span>
                <span className="paper-meta-item">{paper.category}</span>
                <span className="paper-meta-item">DOI: {paper.doi}</span>
              </div>
            </header>

            {/* Paper prose content */}
            <PaperContent html={html} />

            {/* Previous / Next navigation */}
            <nav className="paper-nav" aria-label="Paper navigation">
              {prev ? (
                <a href={`/papers/${prev.slug}`} className="paper-nav-link prev">
                  <span className="paper-nav-label">&#x2190; Previous</span>
                  <span className="paper-nav-title">{prev.title}</span>
                </a>
              ) : (
                <span />
              )}
              {next ? (
                <a href={`/papers/${next.slug}`} className="paper-nav-link next">
                  <span className="paper-nav-label">Next &#x2192;</span>
                  <span className="paper-nav-title">{next.title}</span>
                </a>
              ) : null}
            </nav>
          </div>
        </div>
      </div>

      {/* Fixed PDF download button */}
      <a
        href={`/pdf/${paper.slug}.pdf`}
        download
        className="pdf-fab"
        aria-label={`Download PDF for ${paper.title}`}
      >
        &#x2913; PDF
      </a>
    </>
  );
}
