# Ferrous Bridge — Agent Orchestration (Real Tools Only)

## Replacing RalphD with Things That Actually Exist

RalphD is a research project, not shipping software. Here's the orchestration layer rebuilt entirely on tools you can use today.

---

## The Stack

| Role | Tool | Why |
|---|---|---|
| Agent orchestration | **Claude Code Agent Teams** | Native multi-agent with shared task list, inter-agent messaging, tmux split panes |
| Version control & isolation | **Git worktrees** | Each teammate gets its own worktree — no merge conflicts mid-translation |
| CI / regression guard | **GitHub Actions** | Runs `cargo check`, `cargo test`, `cargo clippy`, Miri on every push |
| Task tracking | **TASKS.md** in repo | Agent Teams' native coordination mechanism — agents claim, update, complete |
| Contract enforcement | **CLAUDE.md** per worktree | Claude Code's instruction file — defines types, rules, boundaries per agent |
| Monitoring | **tmux + human** | You watch the split panes. Redirect agents when they drift. |
| Fuzzing | **cargo-fuzz** | Standard Rust fuzzing, runs in CI |
| Benchmarking | **criterion** | Standard Rust benchmarking crate |

---

## Setup

### 1. Enable Agent Teams

```json
// ~/.claude/settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

### 2. Install tmux

```bash
# macOS
brew install tmux

# Linux  
sudo apt install tmux
```

### 3. Create the repo with worktree structure

```bash
mkdir ferrous-bridge && cd ferrous-bridge
git init
git checkout -b main

# Each translation agent will get its own worktree
# Agent Teams handles this automatically when you tell it to
```

### 4. Write CLAUDE.md (the real "supervisor")

This is the file that replaces RalphD. Claude Code reads `CLAUDE.md` at the root of every project. Every agent in the team inherits these rules.

```markdown
<!-- CLAUDE.md -->

# Ferrous Bridge — Project Rules

## What This Project Is
We are translating C libyaml (~9K LOC) to safe, idiomatic Rust.
The output crate is called `safe-libyaml`.

## Absolute Rules (every agent must follow)
1. **NO `unsafe` blocks.** If you think you need unsafe, stop and message the team lead.
2. **Do not modify type definitions** in `src/types/`. Those are the contract. If a type needs to change, message the team lead first.
3. **Run `cargo check` after every function.** Do not move to the next function if the current one doesn't compile.
4. **Run `cargo test` after every file.** Do not commit a file with failing tests.
5. **One function at a time.** Translate, check, test, commit. Do not batch.
6. **Commit messages:** `translate(scanner): yaml_parser_scan — safe, tests pass`

## Type Contracts
All types are defined in `src/types/`. These are the shared contract between all agents.
- `Event` enum: `src/types/event.rs`
- `Token` enum: `src/types/token.rs`
- `Parser` struct: `src/types/parser.rs`
- `Emitter` struct: `src/types/emitter.rs`
- `Error` type: `src/types/error.rs`
- `Mark` struct: `src/types/mark.rs`

**DO NOT create your own versions of these types in your module.**
Import them: `use crate::types::*;`

## Translation Protocol
For each C function:
1. Read the C source
2. Read the ownership annotation in `analysis/osg.yaml`
3. Read `reference/unsafe-libyaml/` for mechanical reference
4. Read `reference/libyaml-safer/` for quality reference
5. Write safe Rust using the types from `src/types/`
6. Replace C patterns per the table in `analysis/pattern_catalog.md`
7. `cargo check` — fix until clean
8. `cargo test` — fix until passing
9. `cargo clippy` — fix warnings
10. Commit

## File Ownership
Each teammate owns specific files. Do not edit files owned by another teammate.
- **reader-writer agent:** `src/reader.rs`, `src/writer.rs`
- **api agent:** `src/api.rs`, `src/internal.rs`
- **scanner agent:** `src/scanner.rs`
- **parser agent:** `src/parser.rs`, `src/loader.rs`
- **emitter agent:** `src/emitter.rs`, `src/dumper.rs`

## Reference Materials
- C source: `reference/libyaml/src/`
- Unsafe Rust (C2Rust): `reference/unsafe-libyaml/src/`
- Safe Rust (manual port): `reference/libyaml-safer/src/`
- Ownership analysis: `analysis/osg.yaml`
- Pattern catalog: `analysis/pattern_catalog.md`
- YAML test suite: `reference/yaml-test-suite/`
```

### 5. Write TASKS.md (the shared task list)

Agent Teams uses a task file as the coordination mechanism. Agents claim tasks, mark them in-progress, and complete them.

```markdown
<!-- TASKS.md -->

# Translation Tasks

## Phase A: Analysis & Scaffolding
- [x] Clone libyaml, unsafe-libyaml, libyaml-safer as references
- [x] Analyze all C functions, produce osg.yaml
- [x] Create Rust scaffold with all types (todo!() bodies)
- [x] Build differential test harness
- [x] Build fuzz targets

## Phase B: Translation (Wave 1 — standalone types)
- [ ] internal.rs — buffer/stack/queue types
- [ ] mark.rs — Mark struct
- [ ] encoding.rs — Encoding enum + detection
- [ ] error.rs — Error type + ErrorKind

## Phase B: Translation (Wave 2 — I/O layer)
- [ ] reader.rs — yaml_parser_set_input_string
- [ ] reader.rs — yaml_parser_set_input_file  
- [ ] reader.rs — yaml_parser_update_buffer
- [ ] reader.rs — yaml_parser_determine_encoding
- [ ] writer.rs — yaml_emitter_set_output_string
- [ ] writer.rs — yaml_emitter_set_output_file
- [ ] writer.rs — yaml_emitter_flush

## Phase B: Translation (Wave 3 — API layer)
- [ ] api.rs — yaml_parser_initialize
- [ ] api.rs — yaml_parser_delete
- [ ] api.rs — yaml_emitter_initialize
- [ ] api.rs — yaml_emitter_delete
- [ ] api.rs — yaml_event_delete
- [ ] api.rs — yaml_document_initialize
- [ ] api.rs — yaml_document_delete
- [ ] api.rs — yaml_*_event_initialize (all event constructors)

## Phase B: Translation (Wave 4 — Scanner)
- [ ] scanner.rs — utility functions (IS_BLANK, IS_BREAK, CHECK, etc.)
- [ ] scanner.rs — yaml_parser_scan (main entry)
- [ ] scanner.rs — stale token removal
- [ ] scanner.rs — stream start/end tokens
- [ ] scanner.rs — document start/end tokens
- [ ] scanner.rs — flow collection tokens ([ ] { } ,)
- [ ] scanner.rs — block collection tokens (indentation)
- [ ] scanner.rs — key/value tokens
- [ ] scanner.rs — anchor/alias scanning
- [ ] scanner.rs — tag scanning
- [ ] scanner.rs — plain scalar scanning
- [ ] scanner.rs — single-quoted scalar scanning
- [ ] scanner.rs — double-quoted scalar scanning
- [ ] scanner.rs — block scalar scanning (literal |, folded >)

## Phase B: Translation (Wave 5 — Parser)
- [ ] parser.rs — yaml_parser_parse (main entry)
- [ ] parser.rs — parse_stream
- [ ] parser.rs — parse_document
- [ ] parser.rs — parse_node
- [ ] parser.rs — parse_block_sequence
- [ ] parser.rs — parse_block_mapping
- [ ] parser.rs — parse_flow_sequence
- [ ] parser.rs — parse_flow_mapping

## Phase B: Translation (Wave 6 — Emitter)
- [ ] emitter.rs — yaml_emitter_emit (main entry)
- [ ] emitter.rs — emit_stream_start/end
- [ ] emitter.rs — emit_document_start/end
- [ ] emitter.rs — emit_mapping_start/end
- [ ] emitter.rs — emit_sequence_start/end
- [ ] emitter.rs — emit_scalar
- [ ] emitter.rs — scalar analysis (style selection)
- [ ] emitter.rs — write_indicator, write_tag, write_anchor
- [ ] emitter.rs — write_plain_scalar
- [ ] emitter.rs — write_single_quoted_scalar
- [ ] emitter.rs — write_double_quoted_scalar
- [ ] emitter.rs — write_block_scalar

## Phase B: Translation (Wave 7 — Loader/Dumper)
- [ ] loader.rs — yaml_parser_load
- [ ] loader.rs — load_node, load_mapping, load_sequence, load_scalar
- [ ] dumper.rs — yaml_emitter_dump
- [ ] dumper.rs — dump_node, dump_mapping, dump_sequence, dump_scalar

## Phase C: Verification
- [ ] Zero unsafe blocks
- [ ] cargo clippy --pedantic clean
- [ ] Miri clean (cargo +nightly miri test)
- [ ] YAML test suite: 400/400 passing
- [ ] Differential fuzz: 100K inputs, zero divergences
- [ ] Performance benchmark vs C libyaml (< 2x)
- [ ] README + docs
- [ ] Publish to crates.io
```

### 6. GitHub Actions CI (the real regression guard)

```yaml
# .github/workflows/ci.yml

name: CI
on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo check --all-targets
      - run: cargo test
      - run: cargo clippy -- -D warnings

  miri:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive
      - uses: dtolnay/rust-toolchain@nightly
        with:
          components: miri
      - run: cargo +nightly miri test

  yaml-test-suite:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive
      - uses: dtolnay/rust-toolchain@stable
      - name: Build C libyaml reference
        run: |
          cd reference/libyaml
          mkdir build && cd build
          cmake .. && make
      - name: Run differential tests
        run: cargo test --test yaml_test_suite

  unsafe-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check for unsafe
        run: |
          count=$(grep -rn "unsafe" src/ --include="*.rs" | grep -v "// SAFETY:" | wc -l)
          echo "Unsafe blocks: $count"
          if [ "$count" -gt 0 ]; then
            echo "::warning::Found $count unsafe blocks"
            grep -rn "unsafe" src/ --include="*.rs" | grep -v "// SAFETY:"
          fi
```

---

## The Launch Prompt

This is the single prompt you give Claude Code to kick off the entire operation.

### Phase A: Analysis (run first, solo session)

```
I'm translating C libyaml to safe idiomatic Rust. Read CLAUDE.md for project rules.

First, set up the project:
1. Create the cargo project `safe-libyaml`
2. Clone these as git submodules under `reference/`:
   - https://github.com/yaml/libyaml
   - https://github.com/dtolnay/unsafe-libyaml  
   - https://github.com/simonask/libyaml-safer
   - https://github.com/yaml/yaml-test-suite
3. Analyze every C function in reference/libyaml/src/. For each function, document:
   - C signature
   - Purpose
   - Pointer ownership classification (Owning/BorrowShared/BorrowMut/Shared)
   - Rust return type (Result<T, Error> replacing int 0/1)
   - Detected idioms (malloc→Vec, char*→String, callback→closure, etc.)
   Save this as `analysis/osg.yaml` and `analysis/function_map.md`
4. Create `analysis/pattern_catalog.md` documenting every C macro/pattern and its Rust replacement
5. Create the full Rust type scaffold in `src/types/` — all structs, enums, with todo!() function bodies
6. Create the differential test harness comparing our parser/emitter output against C libyaml
7. Create fuzz targets for parser and emitter
8. Verify: `cargo check` passes (types compile, todo!() bodies)
9. Commit everything, push to GitHub
```

### Phase B: Translation (agent team launch)

```
Read CLAUDE.md and TASKS.md. We're translating C libyaml to safe Rust.

Create an agent team with 4 teammates to translate the C source files in parallel:

- Teammate 1 (reader-writer): Translate reader.c and writer.c to safe Rust.
  Own files: src/reader.rs, src/writer.rs
  Start with Wave 2 tasks in TASKS.md.

- Teammate 2 (scanner): Translate scanner.c to safe Rust. 
  This is the hardest file. Start with utility functions, then simple tokens, 
  then complex scanning. Own file: src/scanner.rs
  Start with Wave 4 tasks in TASKS.md.

- Teammate 3 (parser): Translate parser.c and loader.c to safe Rust.
  Wait for scanner to complete stream/document token functions before starting.
  Own files: src/parser.rs, src/loader.rs
  Start with Wave 5 tasks in TASKS.md.

- Teammate 4 (emitter): Translate emitter.c and dumper.c to safe Rust.
  Own files: src/emitter.rs, src/dumper.rs
  Start with Wave 6 tasks in TASKS.md.

Rules for all teammates:
- Read CLAUDE.md before starting
- Use types from src/types/ — do NOT create your own type definitions
- For each C function: read C source, read osg.yaml annotation, read both 
  reference translations, write safe Rust, cargo check, cargo test, commit
- NO unsafe blocks
- Update TASKS.md as you complete each task
- If stuck on a function for more than 10 minutes, skip it and add a 
  TODO comment, then message the team lead

I (team lead) will translate api.c and internal.rs myself (Wave 1 + Wave 3).
```

### Phase C: Verification (after translation completes)

```
All source files are translated. Now verify and polish.

Create an agent team with 3 teammates:

- Teammate 1 (safety-auditor): 
  Search for any remaining `unsafe` blocks. Eliminate them.
  Run `cargo +nightly miri test`. Fix any UB detected.
  Run `cargo clippy -- -W clippy::pedantic`. Fix all warnings.

- Teammate 2 (equivalence-tester):
  Run the full YAML test suite (400+ cases). Fix any failures.
  Run the differential fuzzer with 100K inputs. Fix any divergences.
  Test edge cases: empty input, deep nesting, billion laughs, 
  all Unicode planes, malformed YAML.

- Teammate 3 (polisher):
  Add doc comments to all public items.
  Write README.md with usage examples.
  Run benchmarks against C libyaml, unsafe-libyaml, and libyaml-safer.
  Prepare Cargo.toml for crates.io publication.
```

---

## What You (the Human) Do During This

You're not idle. You're the supervisor. Here's your actual job:

### During Phase A (Day 1)
- Review the type scaffold before Phase B starts
- Make sure the Event/Token enums match the C types exactly
- Verify the test harness compiles and can run against C libyaml

### During Phase B (Days 2–10)
- **Watch tmux panes.** Each teammate has its own pane.
- **Redirect when agents drift:**
  - Agent creating its own types instead of using `src/types/`? → Navigate to that pane, tell it to use the shared types
  - Agent writing unsafe code? → Navigate, tell it to find a safe alternative
  - Agent stuck in a compile error loop? → Read the error, give it a hint
  - Agent skipping tests? → Remind it to run `cargo test`
- **Check TASKS.md every hour.** Are tasks being claimed and completed?
- **Run `cargo test` yourself periodically.** CI catches regressions on push, but you catch them faster locally.
- **Review commits.** `git log --oneline` — are commit messages following the convention?

### During Phase C (Days 11–14)
- Review the final unsafe audit — any remaining `unsafe` must have explicit justification
- Review YAML test suite results — which cases still fail? Are they edge cases or real bugs?
- Review benchmark results — are we within 2x of C libyaml?
- Review README and docs before publishing

### After Phase C
- Publish to crates.io as `safe-libyaml`
- Open a PR to `serde-yaml-ng` replacing `unsafe-libyaml` dependency
- Write a blog post about the translation process and results
- Use the (C, unsafe-Rust, safe-Rust) triples as training data for the fine-tuned model

---

## Token Budget Estimate

Based on the Agent Teams research:

| Phase | Agents | Duration | Est. Tokens | Est. Cost (Max plan) |
|---|---|---|---|---|
| Phase A (analysis + scaffold) | 1 | 4–6 hours | 500K–1M | ~$5–10 |
| Phase B (translation, 4 agents) | 5 (lead + 4) | 3–5 days | 5M–15M | ~$50–150 |
| Phase C (verification, 3 agents) | 4 (lead + 3) | 1–2 days | 2M–5M | ~$20–50 |
| Human intervention + retries | 1 | throughout | 1M–3M | ~$10–30 |
| **Total** | | **5–8 days** | **8M–24M** | **~$85–240** |

On the Max plan ($200/month), this is achievable within a single billing cycle. If you hit rate limits, spread Phase B across 2–3 days instead of pushing all agents simultaneously.

---

## What This Proves

If this works — and the existing manual port by simonask proves the translation IS possible in about a week — you've demonstrated:

1. **Claude Code Agent Teams can translate a real C library to safe Rust** in days, not weeks
2. **The CLAUDE.md + TASKS.md + CI pattern** is sufficient supervision — no custom RalphD needed
3. **The cost is under $250** for an 8K LOC translation that produces a crate serving 90M+ downloads
4. **The triple (C source, unsafe-libyaml, safe-libyaml)** becomes training data for the fine-tuned model
5. **The pattern is repeatable** — same CLAUDE.md rules, same agent team structure, different C library

Then you do it again with libexpat. Then libpng. Each time the agents get better prompts and you get better at supervising. The "Ferrous Bridge" isn't a product yet — it's this workflow, systematized and scaled.
