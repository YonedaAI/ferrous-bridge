import fs from 'fs';
import path from 'path';
import { renderMath } from './render-math';
import { replaceTikzcd } from './render-diagrams';

export interface Heading {
  id: string;
  text: string;
  level: number;
}

export interface PaperData {
  html: string;
  headings: Heading[];
}

export function getPaperHtml(slug: string): PaperData {
  // HTML files are in data/papers/ within the website directory
  const htmlPath = path.join(process.cwd(), 'data', 'papers', `${slug}.html`);

  let raw = fs.readFileSync(htmlPath, 'utf-8');

  // Replace tikz-cd diagrams (KaTeX cannot render them) with HTML fallbacks
  // BEFORE math rendering, so the math pass doesn't choke on the LaTeX inside.
  raw = replaceTikzcd(raw);

  // Pre-render math server-side
  raw = renderMath(raw);

  // Extract headings for TOC. Run AFTER renderMath so we get the rendered
  // KaTeX visible text. The MathML twin <span class="katex-mathml"> would
  // otherwise leak its raw LaTeX annotation into the TOC text (you'd see
  // "Rung 1: ⊑compile\ensuremath{\sqsubseteq_{\!...}}⊑compile" — three copies
  // of the same formula). Strip the mathml span entirely before tag-stripping,
  // leaving only the visible katex-html rendering.
  const headings: Heading[] = [];
  const headingRegex = /<h([23])[^>]*\s+id="([^"]*)"[^>]*>(.*?)<\/h\1>/gi;
  let match;
  while ((match = headingRegex.exec(raw)) !== null) {
    const level = parseInt(match[1], 10);
    const id = match[2];
    const text = match[3]
      .replace(/<span class="katex-mathml">[\s\S]*?<\/span>/g, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
    headings.push({ id, text, level });
  }

  return { html: raw, headings };
}
