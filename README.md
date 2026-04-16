# Ferrous Bridge

**A typed, multi-agent pipeline that turns C libraries into safe, idiomatic Rust — with verifiable safety guarantees at every step.**

Proven on libyaml. Repeating on libexpat. Open-sourced as `safe-libyaml`.

- Website: <https://ferrous-bridge.vercel.app>
- Repo: <https://github.com/YonedaAI/ferrous-bridge>

---

## What this repo is

A research-grade specification for `ferrous-bridge`, the AI-driven C → Rust translation toolchain. It contains four arxiv-style papers and the full development plans an autonomous-agent team would execute to build the actual `safe-libyaml` crate.

| Part | Slug | Title | Pages | Read | PDF |
|---|---|---|---:|---|---|
| I | `c` | The C Language as a Translation Source: Semantics, Undefined Behavior, and the libyaml Idiom Set | 29 | [HTML](https://ferrous-bridge.vercel.app/papers/c) | [PDF](https://ferrous-bridge.vercel.app/pdf/c.pdf) |
| II | `rust` | Idiomatic Safe Rust as a Translation Target: Ownership, Lifetimes, and ABI-Compatible Parser Design | 37 | [HTML](https://ferrous-bridge.vercel.app/papers/rust) | [PDF](https://ferrous-bridge.vercel.app/pdf/rust.pdf) |
| III | `c-rust-transpiling` | Automated C → Rust Transpiling: From c2rust's Raw Lift to Safe, Idiomatic Rust via the Safety Ladder | 35 | [HTML](https://ferrous-bridge.vercel.app/papers/c-rust-transpiling) | [PDF](https://ferrous-bridge.vercel.app/pdf/c-rust-transpiling.pdf) |
| Synthesis | `synthesis` | Ferrous Bridge: A C → Rust Automated Agent Orchestration Pipeline with Type Checks and Safety Guarantees | 37 | [HTML](https://ferrous-bridge.vercel.app/papers/synthesis) | [PDF](https://ferrous-bridge.vercel.app/pdf/synthesis.pdf) |

Each paper carries a substantial **"Development Plan for Prototype Agents"** appendix (29 / 32 / 36 / 38 tasks respectively) so the prototype build can be executed task-by-task by a Claude Code subagent team.

---

## Architecture

```
                ┌──────────────────────────────────────────────────┐
                │  Source theory      Target theory     Refinement │
                │     (Part I)          (Part II)        (Part III)│
                │       C        →        Rust       ⇒  transpile │
                └────────────┬───────────────┬────────────┬────────┘
                             │               │            │
                             ▼               ▼            ▼
        ┌────────────────────────────────────────────────────────────────┐
        │                Ferrous Bridge orchestration DAG                 │
        │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
        │  │ Phase A  │→ │ Phase B  │→ │ Phase C  │→ │ Six-rung │         │
        │  │ Analyse  │  │ Translate│  │ Verify   │  │ ladder   │         │
        │  │ A1·A2·A3 │  │ B1..B5   │  │ C1..C5   │  │ ⊑c⊑m⊑b⊑n⊑r⊑a       │
        │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘         │
        │       └──────┬──────┴──────┬──────┴──────┬──────┘               │
        │              ▼             ▼             ▼                      │
        │        Typed protobuf artifacts (CAB · OSG · RustUnit ...)      │
        │                            │                                    │
        │              Claude Code subagent supervisor                    │
        └──────────────────────────────┬─────────────────────────────────┘
                                       ▼
                                  safe-libyaml
                                       │
                                       ▼
                                 (next: safe-libexpat)
```

The supervisor is implemented as a Claude Code subagent (the same orchestration substrate this very repo was produced on). No fictional "RalphD" — only real, available tools.

---

## Tech stack

- **Papers**: LaTeX (article class, amsmath, amssymb, mathpartir, tikz, tikz-cd, hyperref, cleveref, listings)
- **Peer review**: Gemini 2.5 Pro (4-round iterative review-fix loop per paper)
- **Format check**: Codex (codex-rescue)
- **Website**: Next.js 14 (app router, TypeScript, Tailwind, static export), KaTeX server-side pre-rendered with 79 custom macros
- **Deployment**: Vercel
- **Orchestration**: Claude Code subagents
- **Node runtime**: managed via `fnm` (do not use nvm)

---

## Build locally

Prerequisites: `pdflatex`, `pandoc`, `pdftoppm`, `magick` (ImageMagick), Node ≥ 18 (via `fnm`).

```bash
# Compile all papers
cd papers/latex
for t in c rust c-rust-transpiling synthesis; do
  pdflatex -interaction=nonstopmode $t.tex
  pdflatex -interaction=nonstopmode $t.tex
  cp $t.pdf ../pdf/
done

# Convert to HTML for the website
cd ../..
for t in c rust c-rust-transpiling synthesis; do
  pandoc papers/latex/$t.tex --to html5 --mathjax --toc --toc-depth=3 \
    --number-sections --syntax-highlighting=none --wrap=none \
    -o docs/papers/$t.html
done

# Build + run the website
cd website
npm install
npm run build
npx serve out
```

---

## Repository layout

```
ferrous-bridge/
├── papers/
│   ├── latex/         # 4 .tex sources
│   └── pdf/           # compiled PDFs
├── docs/papers/       # pandoc HTML
├── images/            # 300 DPI cover images
├── reviews/           # Gemini peer-review rounds + Codex format reviews
├── posts/             # social-media drafts (twitter/linkedin/facebook/bluesky × 4 papers = 16)
├── website/           # Next.js source + built static site
├── sources/           # original planning material (input to the knowledge base)
├── .knowledge-base.md # consolidated knowledge base used by all worker agents
└── README.md
```

---

## Author

**Matthew Long** · [matthew@yonedaai.com](mailto:matthew@yonedaai.com) · <https://yonedaai.com>
The YonedaAI Collaboration · YonedaAI Research Collective · Chicago, IL

---

## License

Research papers: CC BY 4.0. Code (when published as `safe-libyaml`): MIT OR Apache-2.0 (matching libyaml's permissive license).
