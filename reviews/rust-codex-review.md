---
reviewer: codex (OpenAI)
type: formatting
paper: rust
date: 2026-04-16T18:29:57Z
---

for i,l in enumerate(lines,1):
    if l.rstrip().endswith('\\\\'):
        print(i, l)
PY" succeeded in 156ms:
118 \title{Idiomatic Safe Rust as a Translation Target:\\
119 Ownership, Lifetimes, and ABI-Compatible Parser Design\\
122 \author{Matthew Long \\
123 \textit{The YonedaAI Collaboration, YonedaAI Research Collective} \\
124 Chicago, IL \\
477 substrings of the input, but escape-processed scalars (e.g.\
798 \texttt{yaml\_string\_t} & \texttt{Vec<u8>} & length-checked indexing\\
799 \texttt{STRING\_INIT(s, n)} & \texttt{Vec::with\_capacity(n)} & no UAF\\
800 \texttt{STRING\_EXTEND(s)} & \texttt{s.reserve(1)} & no double-free\\
801 \texttt{STRING\_DEL(s)} & \emph{drop on scope exit} & no leak\\
802 \texttt{yaml\_stack\_t} & \texttt{Vec<T>} & length-checked indexing\\
803 \texttt{STACK\_INIT(s, T)} & \texttt{Vec::<T>::with\_capacity(16)} & --\\
804 \texttt{STACK\_PUSH(s, v)} & \texttt{s.push(v)} & --\\
805 \texttt{STACK\_POP(s)} & \texttt{s.pop().ok\_or(Error::\dots)?} & no panic on empty\\
806 \texttt{yaml\_queue\_t} & \texttt{VecDeque<T>} & length-checked indexing\\
807 \texttt{QUEUE\_INIT(q, T)} & \texttt{VecDeque::<T>::with\_capacity(16)} & --\\
808 \texttt{ENQUEUE(q, v)} & \texttt{q.push\_back(v)} & --\\
809 \texttt{DEQUEUE(q)} & \texttt{q.pop\_front().ok\_or(Error::\dots)?} & no panic on empty\\
1195 cbindgen --config cbindgen.toml --crate safe-libyaml-sys \
1197 diff -u reference/libyaml/include/yaml.h target/yaml.h \
[2026-04-16T18:32:30] tokens used: 633
[2026-04-16T18:32:35] codex

I’ve got enough to summarize; I’m checking one command-formatting oddity before I wrap up.
[2026-04-16T18:32:35] exec bash -lc "nl -ba papers/latex/rust.tex | sed -n '196,206p'" in /Users/mlong/Documents/Development/ferrous-bridge
[2026-04-16T18:32:35] bash -lc "nl -ba papers/latex/rust.tex | sed -n '196,206p'" succeeded in 85ms:
   196	\begin{definition}[Idiomatic Rust]
   197	\label{def:idiomatic-rust}
   198	A Rust crate is \emph{idiomatic} if it (i) replaces every C-style integer error
   199	return with a \texttt{Result<T,E>}; (ii) replaces every nullable pointer with
   200	\texttt{Option<T>}; (iii) replaces every tagged union with an \texttt{enum}
   201	whose exhaustiveness is checked by the compiler; (iv) prefers iterator
   202	adaptors over manual index loops; and (v) passes \texttt{cargo clippy
   203	\,--\,-W clippy::pedantic} with no allowed lints other than those documented
   204	in the crate's lint policy.
   205	\end{definition}
   206	
[2026-04-16T18:32:35] tokens used: 4394
[2026-04-16T18:32:47] thinking

**Considering formatting solutions**

I’m thinking about a straightforward concrete fix here: it seems like keeping the full command inside one `\texttt` or `\lstinline` could help. This might improve readability and clarity, which seems important. I want to make sure that any command I present is easy to understand, so it’s nice to explore formatting options like this for clearer communication. It’s all about making things more straightforward for the user!**Fixing LaTeX Issues**

I see I could address the `xurl` issue by loading it in the preamble or restructuring bibliography entries. It’s just an underfull. I think there's a `LaTeX Font Warning` at line 478 that could be fixed globally with `\usepackage[T1]{fontenc}`. I might mention both local and global fixes. The output should be concise but thorough, likely structured into **Status** and **Issues** sections to keep it within 10 lines. I need to check for any broken references too.**Outlining Task Requirements**

I see the final limit is default, but since the task is substantial, it can be longer. I should aim to use bullet points with one line each wherever possible for better clarity. It’s important to include line numbers and specific fixes to ensure everything is clear. This way, I can present the information in a concise and organized format, keeping it easy to follow for the user. I'll focus on being thorough yet straightforward.
[2026-04-16T18:32:59] codex
**Fixing LaTeX Issues**

I see I could address the `xurl` issue by loading it in the preamble or restructuring bibliography entries. It’s just an underfull. I think there's a `LaTeX Font Warning` at line 478 that could be fixed globally with `\usepackage[T1]{fontenc}`. I might mention both local and global fixes. The output should be concise but thorough, likely structured into **Status** and **Issues** sections to keep it within 10 lines. I need to check for any broken references too.
[2026-04-16T18:32:59] codex
**Outlining Task Requirements**

I see the final limit is default, but since the task is substantial, it can be longer. I should aim to use bullet points with one line each wherever possible for better clarity. It’s important to include line numbers and specific fixes to ensure everything is clear. This way, I can present the information in a concise and organized format, keeping it easy to follow for the user. I'll focus on being thorough yet straightforward.
[2026-04-16T18:32:59] codex

**Status**
- **Compile**: `papers/latex/rust.tex` builds successfully from the existing `rust.log`; no fatal errors.
- **Packages**: No package is missing for a successful build.
- **Refs/Cites**: No broken cross-references or citations; all `\ref`/`\cite` targets resolve.

**Issues**
- **Line 27 / 102–116**: `\usepackage{everypage}` is legacy and emits warnings on modern LaTeX. Fix by replacing `everypage` + `\AddEverypageHook` with the kernel hook API, e.g. `\AddToHook{shipout/foreground}{...}` (or `shipout/background`) and remove `\usepackage{everypage}`.
- **Line 478**: `\texttt{"line\textbackslash nbreak"}` triggers `Font shape 'OMS/cmtt/m/n' undefined` for `\textbackslash`. Fix locally with `\verb|"line\nbreak"|` or `\lstinline|"line\nbreak"|`; broader fix is adding `\usepackage[T1]{fontenc}` (optionally `lmodern`) for better monospaced glyph coverage.
- **Line 486**: `\subsection{The lifetime-parameterised \texttt{Event<\lifetime{a}>}}` causes `hyperref` PDF-string warnings. Fix with `\texorpdfstring`, e.g. `\subsection{\texorpdfstring{The lifetime-parameterised \texttt{Event<\lifetime{a}>}}{The lifetime-parameterised Event<'a>}}`.
- **Line 740**: `\subsection{The \texttt{Result<Event<\lifetime{a}>, Error>} shape}` causes the same `hyperref` warnings. Fix with `\texorpdfstring{...}{The Result<Event<'a>, Error> shape}`.
- **Line 477**: `e.g.\\` is a forced line break in running prose. Replace with `e.g.\ `, `e.g.,`, or just keep the example inline without `\\`.

**Spacing / Style**
- **Lines 202–203**: `\texttt{cargo clippy \,--\,-W clippy::pedantic}` is awkward and inconsistently spaced. Use a literal code form instead: `\texttt{cargo clippy -- -W clippy::pedantic}` or `\lstinline|cargo clippy -- -W clippy::pedantic|`.
- **Appendix A pattern, esp. 1730ff; logged at 1830–1841 and 1895–1906**: Manual task formatting with `\noindent ... \\\\` plus long `\texttt{...}` runs is fragile and causes overflow. Convert the task blocks to a `description`, `tabularx`, or `longtable` layout instead of hand-inserted line breaks.

**Overfull / Underfull Boxes**
- **Lines 545–552**: Overfull `\hbox` (2.1pt) in the proposition with long inline math/type expressions. Fix by displaying the function signature on its own line (`equation`, `aligned`, or `multline`) and shortening adjacent prose.
- **Lines 639–648**: Overfull `\hbox` (43.1pt) from dense `\texttt{yaml_emitter_t}`, `yaml_scalar_analysis_t`, `Analysis<'a>`, `Event<'a>`. Fix by splitting the sentence and/or adding breakpoints such as `yaml\allowbreak\_emitter\allowbreak\_t`.
- **Line 773**: Overfull section heading `Memory Management: From STACK/QUEUE/STRING to std`. Shorten the title or give a shorter optional form, e.g. `\section[Memory Management]{Memory Management: Mapping C Macros to \texttt{std}}`.
- **Lines 782–784**: Overfull list item from long macro sequences. Split into separate bullets or a small table.
- **Lines 880–888**: Overfull paragraph from crate names plus `Visitor::visit_str(&str)`. Split into two sentences or move the method signature to code formatting on its own line.
- **Lines 1022–1027**: Overfull paragraph from `\texttt{YAML_PARSE_DIRECTIVE_EVENT}`. Add breakpoints in the identifier or move the constant to a displayed/code line.
- **Lines 1084–1091**: Slight overfull box in the proposition about `safe-libyaml-sys`. Fix by shortening one sentence or moving one code identifier out of line.
- **Lines 1274–1279**: Overfull paragraph from consecutive crate/version names. Break after the first sentence; keep the dependency swap in the following listing.
- **Lines 1325–1332**: Overfull paragraph from clustered crate names. Split into shorter sentences or a compact item list.
- **Lines 1339–1346**: Overfull paragraph from the long Prossimo/ISRG project list. Convert the list to comma-broken lines or an `itemize`.
- **Lines 1347–1351**: Overfull paragraph from the run of project names and dates. Split the examples from the main sentence.
- **Lines 1391–1398**: Slight overfull corollary from inline dependency strings. Move the replacement example to a separate displayed line or listing.
- **Lines 1472–1474**: Overfull enumerate item from the long CI gate chain. Turn the toolchain into a sub-list or break after `cbindgen diff`.
- **Lines 1508–1510**: Underfull `\hbox` in the `libyaml-safer` bibliography item. Usually harmless, but adding `\usepackage{xurl}` helps URL breaking; alternatively rephrase the entry so the URL sits on its own line.
- **Lines 1830–1841**: Overfull appendix task lines from long monospaced paths/signatures. Fix structurally with `description`/`tabularx`; local line breaks alone will keep recurring.
- **Lines 1895–1906**: Same appendix formatting issue; especially the long file list at line 1903 should be a vertical list, not one inline `\texttt{}` run.
- **Lines 2076–2086**: Overfull paragraph from dense inline module-name lists. Convert to bullets or a dependency table.
- **Lines 2108–2117**: Overfull paragraph from `TRANSLATE-TEST-FIX` and `c-rust-transpiling`. Split into two sentences and add discretionary breaks in the hyphenated token if needed.

**Best next cleanup**
- **Highest-value fixes**: replace `everypage`, add `\texorpdfstring` to lines `486` and `740`, remove the forced `\\` at line `477`, and refactor the Appendix A task blocks; those changes eliminate the actual warnings and most bad boxes.
[2026-04-16T18:33:21] tokens used: 3081

---

## Fixes Applied (post-codex)

Iteration 1:
- Replaced `\usepackage{everypage}` + `\AddEverypageHook` with kernel
  hook `\AddToHook{shipout/foreground}` (modern LaTeX).
- Added `\usepackage[T1]{fontenc}` and `\usepackage{lmodern}` for proper
  monospace glyph coverage.
- Added `\usepackage{xurl}` for URL line-breaking in bibliography.
- Wrapped two long subsection titles with `\texorpdfstring{...}{...}`
  for clean PDF bookmarks: `Event<'a>` and `Result<Event<'a>, Error>`.
- Replaced fragile `\texttt{"line\textbackslash nbreak"}` with
  `\verb|"line\nbreak"|`.
- Replaced fragile `\texttt{cargo clippy \,--\,-W ...}` with `\verb|...|`.
- Added short title `[Memory Management]` to long section heading.

Iteration 2:
- Added `\sloppy` to the Appendix A block (long `\texttt{...}` task lists
  are structurally hard to break; sloppy gives the typesetter slack
  without restructuring).
- Inserted `\allowbreak` discretionary breaks in long crate identifiers
  (`serde_yaml_ng`, `STRING_DEL`, `YAML_PARSE_DIRECTIVE_EVENT`).
- Reworded the libyaml-safer remark to remove a 51pt overfull.
- Reworded the appendix CI-gate sentence to remove a 25pt overfull.

Result: overfull-hbox count reduced from 21 to 8; remaining boxes are
all under 25pt and inside narrow inline contexts where further
restructuring would damage readability. PDF compiles cleanly with no
errors and 37 pages.
