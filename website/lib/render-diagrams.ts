// tikz-cd → HTML fallback.
//
// KaTeX has no tikz / tikz-cd support, so a `\begin{tikzcd}...\end{tikzcd}`
// block wrapped in `\[ ... \]` reaches the page as raw LaTeX text. Rather
// than ship a heavy MathJax + tikz extension, we substitute a hand-built
// HTML diagram for each known tikz-cd. The PDF still carries the real
// vector-rendered tikz-cd; this is the readable on-page substitute.
//
// To add another diagram, append to DIAGRAMS with a discriminator regex
// matched against the inner tikzcd body.

interface DiagramEntry {
  match: RegExp;
  html: string;
}

const DAG_DIAGRAM_HTML = `<figure class="cd-diagram" aria-label="Ferrous Bridge orchestration DAG, schematic form">
<pre class="cd-ascii">┌─────────┐  A₁   ┌─────┐  A₂   ┌──────────────┐  B★   ┌──────────┐  C₁   ┌───────────────┐  C₂₋₅, K, F   ┌────────────┐
│ CSource │ ────▸ │ CAB │ ────▸ │ RustScaffold │ ────▸ │ RustUnit │ ────▸ │ BuildArtifact │ ────────────▸ │ MiriReport │
└────┬────┘       └──┬──┘       └──────────────┘       └──────────┘       └───────────────┘               └────────────┘
     │ A₃            │ osg
     ▼               ▼
┌──────────────────┐  ┌─────┐
│ BuildArtifact₀   │  │ OSG │
└──────────────────┘  └─────┘</pre>
<figcaption>Schematic of the orchestration DAG. The PDF carries the exact tikz-cd vector rendering; this HTML rendering is the readable substitute.</figcaption>
</figure>`;

const DIAGRAMS: DiagramEntry[] = [
  {
    // The DAG diagram (Section 3.3 of the synthesis paper) — discriminated
    // by the presence of CSource → CAB → RustScaffold path.
    match: /CSource[\s\S]*?CAB[\s\S]*?RustScaffold[\s\S]*?MiriReport/,
    html: DAG_DIAGRAM_HTML,
  },
];

// Match a `<p><span class="math display">\[ ... \\begin{tikzcd} ... \\end{tikzcd} ... \]</span></p>` block.
// The outer `<p>` is matched too because <figure> inside <p> is invalid HTML.
const TIKZCD_BLOCK_RE =
  /<p>\s*<span class="math display">\\\[([\s\S]*?\\begin\{tikzcd\}[\s\S]*?\\end\{tikzcd\}[\s\S]*?)\\\]<\/span>\s*<\/p>/g;

export function replaceTikzcd(html: string): string {
  return html.replace(TIKZCD_BLOCK_RE, (_full, body: string) => {
    for (const entry of DIAGRAMS) {
      if (entry.match.test(body)) return entry.html;
    }
    // Unknown tikz-cd: render a placeholder rather than leak raw LaTeX.
    return `<figure class="cd-diagram"><pre class="cd-ascii">[tikz-cd diagram — see PDF]</pre></figure>`;
  });
}
