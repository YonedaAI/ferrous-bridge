import fs from 'fs';
import path from 'path';
import { renderMath } from './render-math';

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

  // Pre-render math server-side
  raw = renderMath(raw);

  // Extract headings for TOC
  const headings: Heading[] = [];
  const headingRegex = /<h([23])[^>]*\s+id="([^"]*)"[^>]*>(.*?)<\/h\1>/gi;
  let match;
  while ((match = headingRegex.exec(raw)) !== null) {
    const level = parseInt(match[1], 10);
    const id = match[2];
    // Strip inner HTML tags for plain text
    const text = match[3]
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    headings.push({ id, text, level });
  }

  return { html: raw, headings };
}
