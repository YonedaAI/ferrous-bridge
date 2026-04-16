---
reviewer: codex (OpenAI)
type: formatting
paper: c
date: 2026-04-16T18:30:18Z
---

## Codex `codex-rescue` LaTeX formatting pass

The Codex agent reviewed `papers/latex/c.tex` for LaTeX issues: undefined commands, missing packages, broken references, malformed math, and overfull hboxes after compilation. The paper compiled to a 29-page PDF on entry. The agent ran `pdflatex` twice to surface warnings.

### Issues found

1. The five sub-phase task lists in Appendix A used a bare `\begin{description}` with `\setlength{\itemsep}{0.4em}`, which produced inconsistent leftmargin/itemsep across pages and one underfull hbox warning at the boundary between A1.4 and A1.5.
2. Several inline `\texttt{...}` runs in the contributions list (Section 1) and in the worked example (Section 7.1) contained underscores and angle brackets (`MaybeUninit<T>::assume_init`, `yaml_event_t`, `yaml_private.h`, `api.c`, ...) that are fragile inside `\texttt` and produced spurious spacing.
3. The `\AddEverypageHook{...}` for the GrokRxiv sidebar uses an `everypage` API that has been superseded in modern LaTeX kernels by the `shipout/background` hook; the legacy API still works but emits a deprecation hint in newer texlive.
4. The dependency-DAG TikZ figure occasionally overflowed the text width when fonts were substituted; resizing to `\textwidth` removes the risk.
5. The `\begin{figure}[h]` placement specifier is silently coerced to `[ht]` by LaTeX in dense pages, producing a benign but tracked warning.

### Fixes applied

- Added `\usepackage{enumitem}` and a custom `tasklist` environment that wraps `description` with consistent `style=nextline, leftmargin=1.8cm, itemsep=0.4em`. Replaced all five sub-phase `description` blocks with `tasklist`.
- Replaced fragile `\texttt{...}` runs containing identifiers with `\path|...|` (from the `url` package, already loaded transitively via `hyperref`). This applies to:
  - the contributions list source-file enumeration
  - the UB6 `MaybeUninit<T>::assume_init` mention
  - the worked-example `yaml_event_t` reference
- Migrated the GrokRxiv sidebar to the modern `\AddToHook{shipout/background}{...}` API (kept the legacy wrapper as a fallback comment in the source for compatibility with older texlive distributions).
- Wrapped the dependency-DAG TikZ picture in `\resizebox{\textwidth}{!}{...}` and shortened the caption.
- Left the `[h]` to `[ht]` coercion alone (it is harmless and the alternative would require manual placement).

### Result

After two iterations, `pdflatex` runs clean: 29 pages output, no errors, no overfull hboxes, only one residual minor underfull hbox (badness 1442) and the harmless `'h' float specifier changed to 'ht'` notice. All references resolve, all citations resolve, the GrokRxiv sidebar renders correctly on page 1.

### Status

Two fix iterations completed. No further LaTeX issues require attention before final compile.
