# Ferrous Bridge — Agent Execution Plan
## C(libyaml) → Safe Rust(libyaml): The First Real Translation

---

## Why libyaml Is the Perfect First Target

The libyaml translation has a unique property: **every layer of the translation pipeline already exists in isolation, but nobody has connected them with AI.**

```
WHAT EXISTS TODAY:
─────────────────
C source          → github.com/yaml/libyaml          (~8K LOC, 10 files)
Unsafe Rust port  → dtolnay/unsafe-libyaml           (C2Rust transpilation)
Manual safe port  → simonask/libyaml-safer            (1-week manual effort)
Ecosystem need    → serde_yaml_ng, serde_yaml_bw      (90M+ downloads, still on unsafe-libyaml)
Test suite        → yaml/yaml-test-suite              (400+ reference cases)

WHAT DOESN'T EXIST:
───────────────────
An AI system that takes C libyaml → produces safe Rust → verifies equivalence → is repeatable on other libraries
```

We have ground truth at every stage. We can measure our output against both `unsafe-libyaml` (semantic equivalence) and `libyaml-safer` (idiom quality). The YAML test suite gives us 400+ reference cases for differential testing. No other target has this much infrastructure already in place.

---

## libyaml Source Architecture

```
libyaml/src/
├── yaml_private.h      # Internal types, macros, buffer management
├── yaml.h              # Public API (parser_t, emitter_t, event_t, etc.)
├── api.c               # Public API implementations, memory management
├── scanner.c           # YAML scanner/lexer (tokenization) — LARGEST FILE
├── parser.c            # Event-based YAML parser
├── emitter.c           # YAML emitter (events → bytes)
├── reader.c            # Input stream reader (encoding detection, UTF-8/16/32)
├── writer.c            # Output stream writer
├── loader.c            # Document loader (events → document tree)
├── dumper.c            # Document dumper (document tree → events)
└── tests/              # Test programs

Translation Unit Dependency Graph:
──────────────────────────────────
                  yaml.h / yaml_private.h
                 /    |    |    |    \
               /      |    |    |      \
    reader.c  scanner.c  parser.c  loader.c
    writer.c  emitter.c            dumper.c
              \       |       /
               \      |      /
                  api.c
```

### File-by-File Complexity Assessment

| File | LOC | Complexity | Key Challenges |
|---|---|---|---|
| `reader.c` | ~400 | Low | UTF-8/16/32 encoding, buffer management |
| `writer.c` | ~300 | Low | Output buffer, encoding conversion |
| `api.c` | ~1,200 | Medium | Memory allocation wrappers, struct init/destroy, string copying |
| `parser.c` | ~1,200 | Medium | State machine, event construction, recursive descent |
| `loader.c` | ~500 | Medium | Document tree construction, anchor/alias resolution |
| `dumper.c` | ~400 | Medium | Document tree → event stream |
| `emitter.c` | ~2,300 | High | Style analysis, formatting decisions, state machine |
| `scanner.c` | ~3,000 | Very High | YAML tokenizer, complex state machine, lookahead, Unicode |

**Total: ~9,300 LOC of C** (excluding headers and tests)

### Critical C Patterns in libyaml

1. **Custom string type.** `yaml_string_t` with manual `{start, end, pointer}` triple — maps to `Vec<u8>` or `String`
2. **Buffer management macros.** `STRING_EXTEND`, `STRING_INIT`, `STRING_DEL` — manual grow/shrink → `Vec` with push
3. **Stack macros.** `STACK_INIT`, `STACK_PUSH`, `STACK_POP` — manual stack → `Vec<T>` with push/pop
4. **Queue macros.** `QUEUE_INIT`, `QUEUE_PUSH`, `QUEUE_POP` — manual ring buffer → `VecDeque<T>`
5. **Error handling.** Return 0/1 with error stored in parser struct → `Result<T, Error>`
6. **Output parameters.** `int yaml_parser_parse(parser, &event)` → `fn parse(&mut self) -> Result<Event, Error>`
7. **Nullable pointers.** Optional fields stored as NULL pointers → `Option<T>`
8. **Tagged unions.** `yaml_event_t` with type tag + union data → Rust `enum Event { ... }`
9. **Aliasing.** Scanner reads ahead into parser's buffer → needs careful borrow management

---

## Agent Architecture: Three-Phase Execution

The translation is executed by a coordinated team of Claude Code agents operating in three phases. Each phase has clear inputs, outputs, and success criteria.

```
PHASE A: ANALYSIS & SCAFFOLDING (Days 1-3)
  Agent A1: Source Analyst        — Analyze libyaml C, produce annotation map
  Agent A2: Scaffold Builder      — Create Rust project skeleton, types, API surface
  Agent A3: Test Harness Builder  — Build differential test infrastructure

PHASE B: TRANSLATION (Days 4-14)
  Agent B1: Reader/Writer         — Translate reader.c + writer.c
  Agent B2: API Layer             — Translate api.c (memory, init, destroy)
  Agent B3: Parser                — Translate parser.c + loader.c
  Agent B4: Scanner               — Translate scanner.c (hardest file)
  Agent B5: Emitter               — Translate emitter.c + dumper.c

PHASE C: VERIFICATION & POLISH (Days 15-21)
  Agent C1: Compiler Fixer        — Fix all rustc errors iteratively
  Agent C2: Safety Auditor        — Eliminate unsafe blocks, run Miri
  Agent C3: Equivalence Tester    — Differential fuzz against C libyaml
  Agent C4: Idiom Polisher        — Clippy, refactor to idiomatic Rust
  Agent C5: Benchmarker           — Performance comparison vs C and libyaml-safer

SUPERVISOR: RalphD
  — Monitors all agents for drift
  — Enforces type contracts between translation units
  — Detects when agents are stuck in fix loops
  — Escalates to human when confidence drops below threshold
```

---

## Phase A: Analysis & Scaffolding (Days 1–3)

### Agent A1: Source Analyst

**Mission:** Produce a complete annotation map of the libyaml C source that will guide all translation agents.

**Execution steps:**

```
STEP 1: Clone and inventory
─────────────────────────────
$ git clone https://github.com/yaml/libyaml.git
$ cloc src/       # Verify LOC counts
$ ls -la src/*.c src/*.h

STEP 2: For each C file, produce an annotation document containing:
─────────────────────────────────────────────────────────────────────
For every function:
  - Function signature
  - Purpose (1 sentence)
  - Pointer parameters: classify as Owning / BorrowShared / BorrowMut / Shared
  - Return semantics: success/failure int → Result, output param → return value
  - Allocations: list all malloc/realloc/free calls
  - Error handling: how errors are reported
  - State dependencies: what parser/emitter fields are read/written
  - Cross-references: what other functions call this / are called by this

For every struct:
  - Field-by-field type mapping to Rust
  - Ownership of each pointer field
  - Lifetime relationships between fields

For every macro:
  - What it expands to
  - Rust equivalent (Vec::push, VecDeque::push_back, etc.)
  - Whether it can be replaced by a method call

STEP 3: Produce the Ownership Semantic Graph as a YAML file (naturally)
───────────────────────────────────────────────────────────────────────
Output: analysis/osg.yaml

STEP 4: Cross-reference against unsafe-libyaml and libyaml-safer
────────────────────────────────────────────────────────────────
$ git clone https://github.com/dtolnay/unsafe-libyaml.git
$ git clone https://github.com/simonask/libyaml-safer.git

For each C function, note:
  - How unsafe-libyaml translated it (mechanical, unsafe)
  - How libyaml-safer translated it (manual, safe, idiomatic)
  - What the key differences are
  - Which approach is better and why
```

**Output artifacts:**
```
analysis/
├── osg.yaml                    # Ownership Semantic Graph
├── function_map.md             # Every function: C sig → Rust sig → ownership
├── type_map.md                 # Every C type → Rust type
├── macro_map.md                # Every C macro → Rust equivalent
├── pattern_catalog.md          # Recurring C patterns and their Rust idioms
├── unsafe_libyaml_review.md   # What C2Rust got wrong
├── libyaml_safer_review.md    # What the manual port got right
└── translation_plan.md        # Ordered list of functions to translate
```

### Agent A2: Scaffold Builder

**Mission:** Create the complete Rust project skeleton with all type definitions, trait implementations, and public API surface — before any function bodies are translated.

**Why scaffold first:** Every translation agent needs to agree on the types. If Agent B3 (parser) and Agent B4 (scanner) use different types for `yaml_token_t`, integration fails. The scaffold enforces the contract.

```
STEP 1: Create Cargo project
─────────────────────────────
$ cargo init safe-libyaml --lib
$ cd safe-libyaml

STEP 2: Define all public types
────────────────────────────────
Translate every C struct/enum/typedef to Rust.

Key type mappings (from Agent A1's type_map.md):

  yaml_parser_t        → pub struct Parser { ... }
  yaml_emitter_t       → pub struct Emitter { ... }
  yaml_event_t         → pub enum Event { ... }    // tagged union → enum
  yaml_token_t         → pub enum Token { ... }    // tagged union → enum
  yaml_document_t      → pub struct Document { ... }
  yaml_node_t          → pub enum Node { ... }     // tagged union → enum
  yaml_mark_t          → pub struct Mark { line: u64, column: u64, index: u64 }
  yaml_encoding_t      → pub enum Encoding { Utf8, Utf16Le, Utf16Be }
  yaml_error_type_e    → pub enum ErrorKind { ... }
  yaml_string_t        → Vec<u8> (internal) / &str or String (public API)
  yaml_buffer_t        → Vec<u8>
  yaml_stack_t         → Vec<T>
  yaml_queue_t         → VecDeque<T>

STEP 3: Define the public API surface (function signatures only)
────────────────────────────────────────────────────────────────
// lib.rs — public API

pub struct Parser { /* fields from A1 analysis */ }
pub struct Emitter { /* fields from A1 analysis */ }

impl Parser {
    pub fn new() -> Self { todo!() }
    pub fn set_input_string(&mut self, input: &[u8]) { todo!() }
    pub fn set_input<R: Read>(&mut self, reader: R) { todo!() }
    pub fn parse(&mut self) -> Result<Event, Error> { todo!() }
    pub fn load(&mut self) -> Result<Document, Error> { todo!() }
}

impl Emitter {
    pub fn new() -> Self { todo!() }
    pub fn set_output<W: Write>(&mut self, writer: W) { todo!() }
    pub fn emit(&mut self, event: &Event) -> Result<(), Error> { todo!() }
    pub fn dump(&mut self, document: &Document) -> Result<(), Error> { todo!() }
}

impl Drop for Parser { fn drop(&mut self) { /* no manual free needed */ } }
impl Drop for Emitter { fn drop(&mut self) { /* no manual free needed */ } }

STEP 4: Create module structure
────────────────────────────────
src/
├── lib.rs          # Public API re-exports
├── error.rs        # Error type, ErrorKind enum
├── event.rs        # Event enum (Stream/Document/Mapping/Sequence/Scalar/Alias)
├── token.rs        # Token enum (all 22 token types)
├── document.rs     # Document, Node types
├── mark.rs         # Mark (source location)
├── encoding.rs     # Encoding enum, detection
├── parser.rs       # Parser struct and impl
├── scanner.rs      # Scanner (internal to parser)
├── emitter.rs      # Emitter struct and impl
├── reader.rs       # Input reading, UTF decoding
├── writer.rs       # Output writing, UTF encoding
├── loader.rs       # Document loader
├── dumper.rs       # Document dumper
└── internal.rs     # Internal buffer/stack/queue types (replacing C macros)

STEP 5: Implement internal buffer types
────────────────────────────────────────
// internal.rs — replacements for C macros

/// Replaces yaml_string_t {start, end, pointer}
/// In C: manual malloc/realloc/free with pointer arithmetic
/// In Rust: just Vec<u8>
pub(crate) type YamlString = Vec<u8>;

/// Replaces STACK_INIT / STACK_PUSH / STACK_POP macros
/// In C: manual realloc with capacity tracking
/// In Rust: Vec<T> does this automatically
// No special type needed — just use Vec<T>

/// Replaces QUEUE_INIT / QUEUE_PUSH / QUEUE_POP macros
/// In C: manual ring buffer with start/end/head/tail
/// In Rust: VecDeque<T>
// No special type needed — just use VecDeque<T>
```

**Output artifacts:**
```
safe-libyaml/
├── Cargo.toml
├── src/
│   ├── lib.rs           # All types defined, all function signatures with todo!()
│   ├── error.rs         # Complete Error/ErrorKind implementation
│   ├── event.rs         # Complete Event enum
│   ├── token.rs         # Complete Token enum
│   ├── ... (all modules with type definitions and todo!() bodies)
│
├── tests/
│   └── api_surface.rs   # Tests that all public types exist and are constructable
│
$ cargo check            # MUST PASS — types compile, functions have todo!() bodies
```

### Agent A3: Test Harness Builder

**Mission:** Build the differential testing infrastructure BEFORE any translation happens. Tests drive the development loop.

```
STEP 1: Download YAML test suite
──────────────────────────────────
$ git clone https://github.com/yaml/yaml-test-suite.git
# 400+ reference test cases with input YAML and expected events

STEP 2: Compile C libyaml as a reference binary
─────────────────────────────────────────────────
$ cd libyaml && mkdir build && cd build
$ cmake .. && make
# Produces libyaml.so and test binaries

STEP 3: Build the differential test harness
────────────────────────────────────────────
// tests/differential.rs

use std::process::Command;

/// Run C libyaml parser on input, capture events
fn c_parse(input: &[u8]) -> Vec<String> {
    // Write input to temp file
    // Run C libyaml's run-parser-test-suite binary
    // Capture stdout (event list)
    // Parse into Vec<String>
    todo!()
}

/// Run our Rust parser on same input, capture events
fn rust_parse(input: &[u8]) -> Vec<String> {
    // Call safe_libyaml::Parser directly
    // Collect events into Vec<String> with same format
    todo!()
}

/// Run C libyaml emitter on events, capture output
fn c_emit(events: &[String]) -> Vec<u8> { todo!() }

/// Run our Rust emitter on same events, capture output
fn rust_emit(events: &[String]) -> Vec<u8> { todo!() }

#[test]
fn test_parser_equivalence() {
    for test_case in load_yaml_test_suite() {
        let c_events = c_parse(&test_case.input);
        let rust_events = rust_parse(&test_case.input);
        assert_eq!(c_events, rust_events,
            "Parser divergence on test case: {}", test_case.name);
    }
}

#[test]
fn test_emitter_equivalence() {
    for test_case in load_yaml_test_suite() {
        let c_output = c_emit(&test_case.events);
        let rust_output = rust_emit(&test_case.events);
        // Re-parse both outputs and compare events (not byte-exact)
        let c_reparsed = c_parse(&c_output);
        let rust_reparsed = c_parse(&rust_output);
        assert_eq!(c_reparsed, rust_reparsed,
            "Emitter divergence on test case: {}", test_case.name);
    }
}

STEP 4: Build fuzzing harness
──────────────────────────────
// fuzz/fuzz_targets/fuzz_parser.rs

#![no_main]
use libfuzzer_sys::fuzz_target;

fuzz_target!(|data: &[u8]| {
    // Parse with our Rust parser — should never panic or UB
    let mut parser = safe_libyaml::Parser::new();
    parser.set_input_string(data);
    while let Ok(event) = parser.parse() {
        if matches!(event, safe_libyaml::Event::StreamEnd) {
            break;
        }
    }
});

STEP 5: Build benchmark harness
─────────────────────────────────
// benches/parse_benchmark.rs
// Compare: C libyaml vs our Rust vs unsafe-libyaml vs libyaml-safer
```

**Output artifacts:**
```
safe-libyaml/
├── tests/
│   ├── differential.rs          # Parser + emitter equivalence tests
│   ├── yaml_test_suite.rs       # All 400+ reference test cases
│   └── fixtures/                # Test YAML files
├── fuzz/
│   └── fuzz_targets/
│       ├── fuzz_parser.rs
│       └── fuzz_emitter.rs
├── benches/
│   └── parse_benchmark.rs
├── reference/
│   ├── libyaml/                 # C source (git submodule)
│   ├── unsafe-libyaml/          # dtolnay's C2Rust output
│   └── libyaml-safer/           # simonask's manual port
│
$ cargo test                     # All tests FAIL (todo!() panics) — this is correct
```

---

## Phase B: Translation (Days 4–14)

### Translation Order

The files must be translated in dependency order. A function can only be translated when all functions it calls have already been translated.

```
Wave 1 (Day 4-5):    internal.rs, mark.rs, encoding.rs, error.rs
                      (standalone types, no cross-file dependencies)

Wave 2 (Day 5-7):    reader.rs, writer.rs
                      (I/O layer, depends only on internal types)

Wave 3 (Day 6-8):    api.rs (memory management, struct init/destroy)
                      (depends on internal types)

Wave 4 (Day 7-10):   scanner.rs
                      (hardest file, depends on reader + internal types)

Wave 5 (Day 9-12):   parser.rs
                      (depends on scanner)

Wave 6 (Day 10-13):  emitter.rs
                      (depends on writer + internal types)

Wave 7 (Day 12-14):  loader.rs, dumper.rs
                      (depend on parser + emitter)
```

### Agent B1: Reader/Writer Translation

**Input:** `reader.c`, `writer.c`, Agent A1's annotations, Agent A2's scaffold
**Output:** Complete `reader.rs`, `writer.rs` with all function bodies

**Translation protocol (same for all B agents):**

```
FOR EACH FUNCTION in the file:

  1. READ the C source
  2. READ Agent A1's annotation for this function
  3. READ unsafe-libyaml's translation (mechanical reference)
  4. READ libyaml-safer's translation (quality reference)
  5. GENERATE safe Rust translation using Claude, with this prompt structure:

     ┌─────────────────────────────────────────────────────┐
     │ SYSTEM: You are translating C to safe idiomatic     │
     │ Rust. You have pre-computed ownership analysis.     │
     │                                                     │
     │ USER:                                               │
     │ ## C Source                                         │
     │ ```c                                                │
     │ {c_function_source}                                 │
     │ ```                                                 │
     │                                                     │
     │ ## Ownership Analysis                               │
     │ {from Agent A1's osg.yaml}                          │
     │                                                     │
     │ ## Rust Type Context                                │
     │ {from Agent A2's scaffold — struct defs, enums}     │
     │                                                     │
     │ ## Reference: Unsafe Rust (C2Rust, mechanical)      │
     │ ```rust                                             │
     │ {unsafe-libyaml's version}                          │
     │ ```                                                 │
     │                                                     │
     │ ## Reference: Safe Rust (manual port, quality ref)  │
     │ ```rust                                             │
     │ {libyaml-safer's version}                           │
     │ ```                                                 │
     │                                                     │
     │ ## Instructions                                     │
     │ 1. Produce safe Rust. NO unsafe blocks.             │
     │ 2. Use the types from the scaffold exactly.         │
     │ 3. Replace C macros with idiomatic Rust.            │
     │ 4. Return Result<T, Error> instead of 0/1 int.      │
     │ 5. Use Vec/VecDeque instead of manual buffers.      │
     │ 6. The safe manual port is the QUALITY target.      │
     │    Match its idiom level, not the C2Rust version.   │
     └─────────────────────────────────────────────────────┘

  6. WRITE the Rust function into the scaffold (replace todo!())
  7. RUN: cargo check — does it compile?
     - YES → move to next function
     - NO  → read error, fix, retry (max 5 iterations)
  8. RUN: cargo test — do differential tests pass for this function?
     - YES → move to next function
     - NO  → read failure, analyze divergence, fix, retry

AFTER ALL FUNCTIONS in the file are translated:
  9. RUN: cargo test (full suite)
  10. RUN: cargo clippy — fix all warnings
  11. COMMIT with message: "translate {file}: all functions safe, tests pass"
```

### Agent B4: Scanner Translation (Hardest File)

**Special handling for scanner.c:**

Scanner.c is the most complex file (~3,000 LOC). It's a hand-written lexer with complex lookahead, Unicode handling, and deeply nested state management. It requires special treatment:

```
DECOMPOSITION STRATEGY:
──────────────────────
scanner.c contains these logical sections:

1. Token queue management         (~200 LOC)  — EASY
   yaml_parser_scan → Translate to: fn scan(&mut self) -> Result<Token>
   Stale token removal, queue push/pop

2. Simple token production        (~300 LOC)  — EASY
   Stream start/end, document start/end indicators
   Produce tokens for ---, ..., etc.

3. Flow token production          (~500 LOC)  — MEDIUM
   Flow sequence/mapping start/end: [ ] { } ,
   Key/value indicators in flow context: : (after ?)

4. Block token production         (~600 LOC)  — HARD
   Block sequence/mapping start/end (indentation-based)
   Block scalars (literal |, folded >)

5. Scalar scanning                (~800 LOC)  — HARD
   Plain scalars (unquoted)
   Single-quoted scalars
   Double-quoted scalars (with escape sequences)

6. Anchor/alias/tag scanning      (~300 LOC)  — MEDIUM
   &anchor, *alias, !tag, %directive

7. Utility functions              (~300 LOC)  — EASY
   Character class checks, lookahead, buffer management

TRANSLATION ORDER for scanner.c:
  7 → 1 → 2 → 6 → 3 → 4 → 5
  (utilities first, then simple tokens, then complex scanning)

AGENT B4 RUNS TESTS AFTER EACH SECTION:
  After section 2: basic YAML should parse (--- key: value ...)
  After section 3: flow collections should parse ({"key": [1,2,3]})
  After section 4: block collections should parse (indented mappings)
  After section 5: all scalar types should parse (quoted, escaped, multiline)
```

### The Development Loop (Every Agent, Every Function)

```
┌──────────────────────────────────────────────────────────┐
│                  TRANSLATE-TEST-FIX LOOP                  │
│                                                          │
│  ┌──────────┐                                            │
│  │ Translate │ Claude generates safe Rust for one function│
│  │ function  │                                            │
│  └────┬─────┘                                            │
│       │                                                  │
│       ▼                                                  │
│  ┌──────────┐     ┌─────────────┐                        │
│  │  cargo    │────▶│ Compilation │                        │
│  │  check    │     │ errors?     │                        │
│  └──────────┘     └──────┬──────┘                        │
│                     YES  │  NO                           │
│                     │    │                                │
│                     ▼    ▼                                │
│              ┌──────────┐  ┌──────────┐                  │
│              │ Fix type  │  │  cargo   │                  │
│              │ errors    │  │  test    │                  │
│              │ (max 5x)  │  └────┬─────┘                  │
│              └──────────┘       │                         │
│                            ┌────┴────┐                    │
│                         PASS │    │ FAIL                  │
│                              │    │                       │
│                              ▼    ▼                       │
│                    ┌──────────┐  ┌──────────────┐         │
│                    │  cargo   │  │ Analyze test │         │
│                    │  clippy  │  │ failure:     │         │
│                    └────┬─────┘  │              │         │
│                         │       │ - Wrong output│         │
│                    CLEAN │       │ - Panic      │         │
│                         │       │ - Off-by-one │         │
│                         ▼       │ - Missing    │         │
│                    ┌──────────┐  │   case       │         │
│                    │ COMMIT   │  └──────┬───────┘         │
│                    │ function │         │                 │
│                    └──────────┘    Fix and retry           │
│                                   (max 10x per function)  │
│                                                          │
│  IF stuck > 10 iterations on one function:               │
│    → Flag for human review                               │
│    → Move to next function                               │
│    → Mark as TODO with error context                     │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Phase C: Verification & Polish (Days 15–21)

### Agent C1: Compiler Fixer

**Mission:** Get the entire crate to compile with zero errors and zero warnings.

```
LOOP until cargo build succeeds with zero warnings:
  1. cargo build 2>&1 | head -50
  2. Read first error
  3. Fix the error
  4. Repeat

Common fixes:
  - Type mismatches between modules (scanner returns Token, parser expects Token)
  - Lifetime issues (borrow of self while calling method that borrows self)
  - Move semantics (value moved in loop, need clone or reference)
  - Missing trait implementations (Display, Debug, Clone for public types)
```

### Agent C2: Safety Auditor

**Mission:** Eliminate ALL `unsafe` blocks. Run Miri on the entire test suite.

```
STEP 1: Search for unsafe
──────────────────────────
$ grep -rn "unsafe" src/ | wc -l
# Target: ZERO

STEP 2: For each remaining unsafe block:
─────────────────────────────────────────
  - WHY is it unsafe?
  - Can it be replaced with safe code?
  - If truly necessary (FFI, raw pointer), document WHY
  - Wrap in minimal scope with safety comment

STEP 3: Run Miri
─────────────────
$ cargo +nightly miri test
# Must pass with zero errors
# Miri detects: UB, data races, memory leaks, out-of-bounds access

STEP 4: Run under address sanitizer
─────────────────────────────────────
$ RUSTFLAGS="-Zsanitizer=address" cargo +nightly test
```

### Agent C3: Equivalence Tester

**Mission:** Prove semantic equivalence between C libyaml and our Rust port.

```
STEP 1: YAML test suite (400+ cases)
──────────────────────────────────────
$ cargo test yaml_test_suite
# Every test case must produce identical events

STEP 2: Differential fuzzing (100K inputs)
───────────────────────────────────────────
$ cargo fuzz run fuzz_parser -- -runs=100000
# Must not crash, panic, or produce UB

$ # Also: compare output with C libyaml on same inputs
$ python3 scripts/differential_fuzz.py --runs 100000
# Every input must produce identical output from C and Rust

STEP 3: Edge case battery
──────────────────────────
Test specifically:
  - Empty input
  - Single scalar
  - Deeply nested (1000 levels)
  - Very long lines (1MB single line)
  - All Unicode planes
  - All escape sequences
  - Billion laughs attack (anchor/alias recursion)
  - Malformed YAML (should return Error, not panic)
  - All 22 token types
  - Mixed flow/block styles
  - Multi-document streams

STEP 4: Round-trip testing
───────────────────────────
For every test case:
  parse(input) → events → emit(events) → output → parse(output) → events2
  Assert: events == events2
```

### Agent C4: Idiom Polisher

**Mission:** Make the code read like a senior Rust developer wrote it.

```
STEP 1: Clippy (pedantic mode)
───────────────────────────────
$ cargo clippy -- -W clippy::pedantic -W clippy::nursery
# Fix all warnings

STEP 2: Refactor checklist
───────────────────────────
  □ No raw pointer arithmetic (use slice indexing)
  □ No manual capacity management (use Vec/VecDeque)
  □ No C-style error codes (use Result everywhere)
  □ No output parameters (return values instead)
  □ No NULL checks (use Option)
  □ No tagged unions (use enum)
  □ Iterator usage where C uses index loops
  □ Pattern matching where C uses switch/if chains
  □ Descriptive variable names (not single letters)
  □ Doc comments on all public items
  □ #[must_use] on functions returning Result

STEP 3: Compare against libyaml-safer
───────────────────────────────────────
For each function, compare our output with libyaml-safer:
  - Is our code as readable?
  - Is our code as idiomatic?
  - Did we miss any Rust idiom they used?
  - Did we use better idioms they missed?
```

### Agent C5: Benchmarker

**Mission:** Measure performance against all reference implementations.

```
BENCHMARK MATRIX:
───────────────────────────────────────────────────
Implementation          | Parse | Emit | Round-trip
───────────────────────────────────────────────────
C libyaml (reference)   |  ___  |  ___ |  ___
unsafe-libyaml (C2Rust) |  ___  |  ___ |  ___
libyaml-safer (manual)  |  ___  |  ___ |  ___
safe-libyaml (ours)     |  ___  |  ___ |  ___
───────────────────────────────────────────────────

ACCEPTANCE CRITERIA:
  - Within 2x of C libyaml performance → PASS
  - Within 1.5x → GOOD
  - Faster → EXCELLENT (possible due to Rust optimizations)

Test files:
  - Small YAML (1KB config file)
  - Medium YAML (100KB Kubernetes manifest)
  - Large YAML (10MB data file)
  - Adversarial YAML (deep nesting, many anchors)
```

---

## RalphD: Supervisor Protocol

RalphD runs continuously during all three phases, monitoring agent work.

```
MONITORING CADENCE: Every 30 minutes
─────────────────────────────────────

CHECK 1: Type contract integrity
  - Does scanner.rs use the same Token enum as parser.rs?
  - Does parser.rs use the same Event enum as loader.rs?
  - Do all modules import from the same type definitions?
  → If mismatch detected: HALT agents, reconcile types

CHECK 2: Test regression
  - Run cargo test after every agent commit
  - If previously passing tests now fail: REVERT last commit, notify agent
  → Zero tolerance for regressions

CHECK 3: Unsafe creep
  - Count unsafe blocks after every commit
  - If count increases: flag commit, require justification
  → Trend must be monotonically decreasing

CHECK 4: Stuck detection
  - If any agent has been in fix loop > 10 iterations on same function
  - Or > 2 hours on same function
  → Escalate: log the function, error, and attempts for human review
  → Agent moves to next function

CHECK 5: Coverage tracking
  - Track which functions are translated, compiling, and tested
  - Maintain a dashboard:
    ┌─────────────────────────────────────────────────┐
    │ TRANSLATION PROGRESS                            │
    │ reader.rs:   ████████████████████ 100% (12/12)  │
    │ writer.rs:   ████████████████████ 100% (8/8)    │
    │ api.rs:      ████████████░░░░░░░░  60% (18/30)  │
    │ scanner.rs:  ████████░░░░░░░░░░░░  40% (16/40)  │
    │ parser.rs:   ██░░░░░░░░░░░░░░░░░░  10% (3/28)   │
    │ emitter.rs:  ░░░░░░░░░░░░░░░░░░░░   0% (0/35)   │
    │ loader.rs:   ░░░░░░░░░░░░░░░░░░░░   0% (0/12)   │
    │ dumper.rs:   ░░░░░░░░░░░░░░░░░░░░   0% (0/10)   │
    │─────────────────────────────────────────────────│
    │ OVERALL:     ████████░░░░░░░░░░░░  33% (57/175) │
    │ unsafe:      3 blocks remaining                 │
    │ tests:       287/400 passing                    │
    └─────────────────────────────────────────────────┘

CHECK 6: Architecture drift
  - Is the module structure still matching the scaffold?
  - Are agents adding files not in the plan?
  - Are agents modifying types in other agents' files?
  → If drift detected: discuss with agent, align or update plan
```

---

## Claude Code Session Structure

### How to Actually Run This

Each agent is a Claude Code session with a specific working directory and instructions file.

```bash
# Terminal 1: Agent A1 (Source Analyst)
cd ~/ferrous-bridge
claude --session analyst \
  --instruction "You are Agent A1. Read AGENT_A1_INSTRUCTIONS.md. 
  Analyze the C libyaml source and produce the annotation artifacts."

# Terminal 2: Agent A2 (Scaffold Builder) — starts after A1 produces type_map.md
cd ~/ferrous-bridge
claude --session scaffold \
  --instruction "You are Agent A2. Read AGENT_A2_INSTRUCTIONS.md.
  Build the Rust scaffold using A1's type map."

# Terminal 3: Agent A3 (Test Harness) — runs in parallel with A2
cd ~/ferrous-bridge
claude --session tests \
  --instruction "You are Agent A3. Read AGENT_A3_INSTRUCTIONS.md.
  Build the differential test harness."

# After Phase A completes (Day 3):
# Launch 5 translation agents in parallel, each on their assigned files

# Terminal 4: Agent B1 (Reader/Writer)
claude --session reader-writer \
  --instruction "You are Agent B1. Translate reader.c and writer.c.
  Follow the TRANSLATE-TEST-FIX loop protocol.
  Your types come from src/. Do not modify type definitions."

# Terminal 5: Agent B4 (Scanner) — longest running
claude --session scanner \
  --instruction "You are Agent B4. Translate scanner.c.
  This is the hardest file. Follow the decomposition strategy.
  Translate utility functions first, then simple tokens, then complex scanning."

# ... etc for B2, B3, B5

# Supervisor (runs continuously)
claude --session ralphd \
  --instruction "You are RalphD. Monitor all agent work.
  Run cargo test every 30 minutes. Check for type mismatches.
  Track progress. Flag stuck agents."
```

### For Codex / Single-Agent Mode

If running with a single agent (Codex or one Claude Code session):

```
EXECUTION ORDER (serial):
─────────────────────────
Day 1:   Phase A (all three A agents' work, sequentially)
Day 2-3: Wave 1-2 translation (internal types, reader, writer)  
Day 4-5: Wave 3-4 translation (api, scanner sections 7,1,2)
Day 6-7: Wave 4 continued (scanner sections 6,3,4,5)
Day 8-9: Wave 5-6 translation (parser, emitter)
Day 10:  Wave 7 translation (loader, dumper)
Day 11:  Phase C: compiler fixer (get everything compiling)
Day 12:  Phase C: safety audit (eliminate unsafe)
Day 13:  Phase C: equivalence testing (differential fuzz)
Day 14:  Phase C: idiom polish + benchmarks

THE CORE LOOP (run this for EVERY function):
─────────────────────────────────────────────
1. Read C function
2. Read annotations (ownership, idioms)
3. Read both reference translations
4. Write safe Rust
5. cargo check → fix errors
6. cargo test → fix failures
7. cargo clippy → fix warnings
8. Commit
9. Next function
```

---

## Success Criteria

### Minimum Viable Translation (Day 14)

- [ ] All 175 functions translated
- [ ] `cargo build` succeeds with zero errors
- [ ] `cargo test` passes 350/400+ YAML test suite cases
- [ ] Zero `unsafe` blocks (or < 5 with justification)
- [ ] `cargo clippy` clean
- [ ] Differential fuzz: 100K inputs, zero divergences

### Production Quality (Day 21)

- [ ] All 400/400 YAML test suite cases pass
- [ ] Miri clean (zero UB)
- [ ] Differential fuzz: 1M inputs, zero divergences
- [ ] Performance within 2x of C libyaml
- [ ] Doc comments on all public items
- [ ] README with usage examples
- [ ] Published to crates.io as `safe-libyaml`
- [ ] PR to serde-yaml-ng replacing `unsafe-libyaml` dependency

### Victory Condition

```
BEFORE:
  serde_yaml_ng depends on unsafe-libyaml (90M downloads, all unsafe)
  
AFTER:
  serde_yaml_ng depends on safe-libyaml (zero unsafe, AI-translated, verified)

This is the proof that Ferrous Bridge works.
The next target is libexpat. Then libpng. Then libxml2.
Each one gets easier because the model has seen more patterns.
```

---

## Appendix: Key Translations Reference

Quick reference for the most common C→Rust patterns in libyaml:

| C Pattern | Rust Replacement |
|---|---|
| `yaml_malloc(size)` | `Vec::with_capacity(size)` or `Box::new(...)` |
| `yaml_free(ptr)` | (drop automatically) |
| `STRING_INIT(string)` | `let string = Vec::new()` |
| `STRING_EXTEND(string)` | `string.reserve(...)` |
| `STRING_DEL(string)` | (drop automatically) |
| `STACK_INIT(stack)` | `let stack = Vec::new()` |
| `STACK_PUSH(stack, value)` | `stack.push(value)` |
| `STACK_POP(stack)` | `stack.pop()` |
| `QUEUE_INIT(queue)` | `let queue = VecDeque::new()` |
| `QUEUE_PUSH(queue, value)` | `queue.push_back(value)` |
| `QUEUE_POP(queue)` | `queue.pop_front()` |
| `if (!value) return 0` | `value.ok_or(Error::...)?` |
| `parser->error = ...` | `return Err(Error::...)` |
| `event->type = YAML_SCALAR_EVENT` | `Event::Scalar { ... }` |
| `memcpy(dst, src, n)` | `dst.copy_from_slice(&src[..n])` or `dst.extend_from_slice(...)` |
| `strcmp(a, b) == 0` | `a == b` |
| `strlen(s)` | `s.len()` |
| `IS_BLANK(parser)` | `parser.peek().map_or(false, \|c\| c == b' ' \|\| c == b'\t')` |
| `FORWARD(parser)` | `parser.advance()` or `self.skip()` |
| `CHECK(parser, ch)` | `self.peek() == Some(ch)` |
