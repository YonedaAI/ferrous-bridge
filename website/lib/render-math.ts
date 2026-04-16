import katex from 'katex';
import path from 'path';
import fs from 'fs';

// Load macros from katex-macros.json
function loadMacros(): Record<string, string> {
  const base: Record<string, string> = {
    // Standard math shortcuts not already in the macros file
    '\\slashed': '\\not{#1}',
    // \ensuremath is a LaTeX text/math toggle; in KaTeX everything is math
    // so it is a passthrough. Without this, every macro defined via
    // \newcommand{\X}{\ensuremath{...}} renders as red error text.
    '\\ensuremath': '#1',
    // \xspace exists in xspace.sty — passthrough.
    '\\xspace': '',
  };

  try {
    const macroPath = path.join(process.cwd(), 'katex-macros.json');
    const raw = fs.readFileSync(macroPath, 'utf-8');
    const loaded = JSON.parse(raw) as Record<string, string>;
    return { ...base, ...loaded };
  } catch {
    return base;
  }
}

const MACROS = loadMacros();

function decodeEntities(s: string): string {
  // Pandoc HTML-escapes characters inside math (e.g. \sigma' becomes
  // \sigma&#39;). KaTeX rejects entities, so reverse them before parsing.
  // Order matters: &amp; first so &amp;#39; collapses to '.
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ');
}

function renderTeX(tex: string, displayMode: boolean): string {
  const cleaned = decodeEntities(tex.trim());
  try {
    return katex.renderToString(cleaned, {
      displayMode,
      throwOnError: false,
      trust: true,
      macros: { ...MACROS },
      strict: false,
    });
  } catch {
    // Return the original LaTeX wrapped in a span on failure
    return `<span class="math-error">${cleaned}</span>`;
  }
}

export function renderMath(html: string): string {
  let result = html;

  // Replace display math: \[...\]
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_, tex) => renderTeX(tex, true));

  // Replace display math: $$...$$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => renderTeX(tex, true));

  // Replace inline math: \(...\)
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_, tex) => renderTeX(tex, false));

  // Replace inline math: $...$ (single dollar, non-greedy, no newlines)
  result = result.replace(/(?<![\\$])\$([^$\n]+?)\$(?!\$)/g, (_, tex) => renderTeX(tex, false));

  return result;
}
