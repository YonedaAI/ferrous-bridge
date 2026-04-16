# Ferrous Bridge — Development Plan & Architecture

## AI-Assisted C→Rust Migration Toolchain

**Magneton Labs LLC / YonedaAI Research Collective**
**April 2026**

---

## Table of Contents

1. [Mission](#mission)
2. [Architecture Overview](#architecture-overview)
3. [Repository Structure](#repository-structure)
4. [Stage 1: C Frontend Analysis](#stage-1-c-frontend-analysis)
5. [Stage 2: Ownership Semantic Graph](#stage-2-ownership-semantic-graph)
6. [Stage 3: Translation Engine](#stage-3-translation-engine)
7. [Stage 4: Verification Pipeline](#stage-4-verification-pipeline)
8. [Stage 5: Human Review Platform](#stage-5-human-review-platform)
9. [Training Data Pipeline](#training-data-pipeline)
10. [Development Phases](#development-phases)
11. [Technology Stack](#technology-stack)
12. [Agent Team Assignments](#agent-team-assignments)
13. [Open Source vs Proprietary Map](#open-source-vs-proprietary-map)
14. [Testing Strategy](#testing-strategy)
15. [Infrastructure & Deployment](#infrastructure--deployment)

---

## Mission

Build a production-grade system that translates C code to safe, idiomatic Rust. Not a toy. Not a research prototype. A tool that defense contractors, embedded systems companies, and enterprise engineering teams can run against million-line codebases and get auditable, verified, memory-safe Rust output.

General-purpose LLMs can translate simple C functions to Rust. They fail on the hard cases — cross-function lifetime inference, pointer aliasing resolution, custom allocator migration, undefined behavior correction. Ferrous Bridge solves this by combining static analysis, LLM reasoning (Claude), a specialized fine-tuned model, formal verification, and human review into a single pipeline.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        FERROUS BRIDGE                           │
│                                                                 │
│  ┌───────────┐    ┌───────────┐    ┌───────────────────────┐    │
│  │  Stage 1   │    │  Stage 2   │    │      Stage 3          │    │
│  │  C Frontend│───▶│  Ownership │───▶│  Translation Engine   │    │
│  │  Analysis  │    │  Semantic  │    │                       │    │
│  │            │    │  Graph     │    │  ┌─────────────────┐  │    │
│  │  Clang AST │    │            │    │  │  Router         │  │    │
│  │  LLVM IR   │    │  Ownership │    │  │                 │  │    │
│  │  Points-to │    │  Classifier│    │  │  Simple ──▶ FTM │  │    │
│  │  Call Graph│    │  Lifetime  │    │  │  Complex ──▶    │  │    │
│  │  Use-Def   │    │  Regions   │    │  │    Claude API   │  │    │
│  │  Dynamic   │    │  Idiom     │    │  └─────────────────┘  │    │
│  │  Traces    │    │  Detection │    │                       │    │
│  └───────────┘    └───────────┘    └───────────┬───────────┘    │
│                                                 │                │
│                                                 ▼                │
│  ┌───────────────────────┐    ┌─────────────────────────────┐   │
│  │      Stage 5           │    │        Stage 4               │   │
│  │  Human Review Platform │◀───│  Verification Pipeline       │   │
│  │                        │    │                              │   │
│  │  Side-by-side diff     │    │  rustc compilation          │   │
│  │  Confidence scores     │    │  Miri UB detection          │   │
│  │  Approve/reject/edit   │    │  Kani model checking        │   │
│  │  Annotation feedback   │    │  Differential fuzzing       │   │
│  │  Audit trail           │    │  Clippy idiom check         │   │
│  └────────┬───────────────┘    └──────────┬───────────────────┘   │
│           │                                │                     │
│           │    ┌──────────────────────┐     │                     │
│           └───▶│  Training Data       │◀────┘                     │
│                │  Pipeline            │                           │
│                │                      │                           │
│                │  Verified pairs ──▶  │                           │
│                │  Fine-tune FTM       │                           │
│                └──────────────────────┘                           │
│                                                                  │
│  FTM = Fine-Tuned Model (DeepSeek-Coder / Qwen2.5-Coder)        │
└──────────────────────────────────────────────────────────────────┘

Feedback Loops:
  Stage 4 rejection ──▶ Stage 3 (re-translate with error context)
  Stage 5 annotation ──▶ Stage 2 (retrain ownership classifier)
  Stage 5 approval   ──▶ Training Data Pipeline (new verified pair)
```

---

## Repository Structure

```
ferrous-bridge/
├── README.md
├── LICENSE                          # Apache 2.0 for open components
├── ARCHITECTURE.md                  # This document
├── Cargo.toml                       # Workspace root
│
├── crates/
│   ├── fb-frontend/                 # Stage 1: C Frontend Analysis [OPEN]
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── ast_extract.rs       # Clang AST extraction via libclang
│   │   │   ├── llvm_ir.rs           # LLVM IR emission and analysis
│   │   │   ├── points_to.rs         # Andersen-style points-to analysis
│   │   │   ├── call_graph.rs        # Call graph with indirect resolution
│   │   │   ├── use_def.rs           # Use-def chain extraction
│   │   │   ├── dynamic_trace.rs     # ASan/MSan/TSan trace ingestion
│   │   │   └── cab.rs               # C-Analysis Bundle serialization
│   │   └── tests/
│   │
│   ├── fb-cab/                      # CAB format library [OPEN]
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── schema.rs            # Protobuf/JSON schema definitions
│   │   │   ├── serialize.rs         # CAB read/write
│   │   │   └── validate.rs          # Schema validation
│   │   └── proto/
│   │       └── cab.proto            # Protobuf schema
│   │
│   ├── fb-osg/                      # Stage 2: Ownership Semantic Graph [OPEN CORE]
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── graph.rs             # OSG data structures [OPEN]
│   │   │   ├── ownership.rs         # Ownership classification [OPEN: heuristics, CLOSED: ML]
│   │   │   ├── lifetimes.rs         # Lifetime region analysis
│   │   │   ├── allocators.rs        # Allocator pattern recognition
│   │   │   ├── idioms.rs            # C→Rust idiom detection
│   │   │   └── annotate.rs          # Annotate C source with OSG metadata
│   │   └── tests/
│   │
│   ├── fb-translate/                # Stage 3: Translation Engine [CLOSED]
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── router.rs            # Route to FTM vs Claude
│   │   │   ├── claude.rs            # Claude API integration
│   │   │   ├── ftm.rs               # Fine-tuned model inference client
│   │   │   ├── prompts/             # Prompt templates
│   │   │   │   ├── function.md      # Single function translation
│   │   │   │   ├── module.md        # Module-level translation
│   │   │   │   ├── allocator.md     # Custom allocator migration
│   │   │   │   ├── concurrent.md    # Concurrent code translation
│   │   │   │   └── explain.md       # Explanation generation
│   │   │   ├── context.rs           # Build translation context from OSG
│   │   │   └── postprocess.rs       # Clean up generated Rust
│   │   └── tests/
│   │
│   ├── fb-verify/                   # Stage 4: Verification [OPEN CORE]
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── compile.rs           # rustc compilation check
│   │   │   ├── miri.rs              # Miri UB detection
│   │   │   ├── kani.rs              # Kani model checking integration
│   │   │   ├── fuzz.rs              # Differential fuzzing harness [OPEN]
│   │   │   ├── clippy.rs            # Clippy idiom check
│   │   │   ├── spec_extract.rs      # Specification extraction from C [CLOSED]
│   │   │   └── verdict.rs           # Aggregate pass/fail verdict
│   │   └── tests/
│   │
│   ├── fb-training/                 # Training Data Pipeline [CLOSED]
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── corpus.rs            # Training corpus management
│   │   │   ├── synthetic.rs         # Synthetic pair generation via Claude
│   │   │   ├── c2rust_safe.rs       # C2Rust → safe-ification pipeline
│   │   │   ├── adversarial.rs       # Adversarial pair generation (CVE-based)
│   │   │   ├── natural.rs           # Mine natural C↔Rust rewrites from GitHub
│   │   │   ├── verify_pair.rs       # 6-gate verification for training pairs
│   │   │   └── export.rs            # Export to fine-tuning format
│   │   └── tests/
│   │
│   └── fb-review/                   # Stage 5: Human Review Platform [CLOSED]
│       ├── Cargo.toml
│       ├── src/
│       │   ├── lib.rs
│       │   ├── server.rs            # HTTP API (Axum)
│       │   ├── diff.rs              # Side-by-side C/Rust diff generation
│       │   ├── confidence.rs        # Confidence scoring
│       │   ├── audit.rs             # Audit trail
│       │   └── feedback.rs          # Route annotations back to training
│       ├── frontend/                # React frontend
│       │   ├── src/
│       │   │   ├── App.tsx
│       │   │   ├── DiffView.tsx
│       │   │   ├── AnnotationPanel.tsx
│       │   │   └── Dashboard.tsx
│       │   └── package.json
│       └── tests/
│
├── cli/                             # CLI tool
│   ├── Cargo.toml
│   └── src/
│       └── main.rs                  # `fb translate <file.c> -o <file.rs>`
│
├── tests/
│   ├── fixtures/                    # Test C files with known translations
│   │   ├── simple/                  # Single-function, no pointers
│   │   ├── ownership/               # Ownership inference tests
│   │   ├── lifetimes/               # Cross-function lifetime tests
│   │   ├── allocators/              # Custom allocator patterns
│   │   ├── concurrent/              # Threading and synchronization
│   │   ├── idioms/                  # C→Rust idiom mapping
│   │   └── adversarial/             # CVE-based bug correction tests
│   ├── integration/                 # End-to-end pipeline tests
│   └── benchmarks/                  # Performance benchmarks
│
├── docs/
│   ├── cab-spec.md                  # CAB format specification
│   ├── osg-spec.md                  # OSG format specification
│   ├── prompt-engineering.md        # Translation prompt documentation
│   └── verification-gates.md        # Verification pipeline documentation
│
├── scripts/
│   ├── setup.sh                     # Dev environment setup
│   ├── generate-training-data.sh    # Bulk training data generation
│   ├── benchmark.sh                 # Run benchmark suite
│   └── release.sh                   # Release automation
│
└── infra/
    ├── docker/
    │   ├── Dockerfile.frontend      # Clang/LLVM analysis container
    │   ├── Dockerfile.translate     # Translation engine container
    │   ├── Dockerfile.verify        # Verification pipeline container
    │   └── docker-compose.yml
    └── k8s/                         # Kubernetes manifests (later)
```

---

## Stage 1: C Frontend Analysis

### Purpose

Parse C source code into a rich intermediate representation (C-Analysis Bundle) that captures everything downstream stages need to reason about ownership, lifetimes, and semantics.

### Implementation Plan

#### 1.1 — Clang AST Extraction

```rust
// fb-frontend/src/ast_extract.rs

use clang::*;

pub struct AstExtractor {
    index: Index,
}

pub struct ExtractedAst {
    pub functions: Vec<FunctionInfo>,
    pub globals: Vec<GlobalInfo>,
    pub typedefs: Vec<TypedefInfo>,
    pub structs: Vec<StructInfo>,
    pub macros: Vec<MacroInfo>,
}

pub struct FunctionInfo {
    pub name: String,
    pub signature: FunctionSignature,
    pub body: Option<AstNode>,           // None for declarations
    pub source_location: SourceLocation,
    pub comments: Vec<String>,           // Associated comments (intent hints)
    pub pointer_params: Vec<PointerParam>,
    pub allocations: Vec<AllocationSite>,
    pub frees: Vec<FreeSite>,
}

pub struct PointerParam {
    pub name: String,
    pub c_type: CType,
    pub is_nullable: bool,               // Heuristic: checked against NULL?
    pub is_output: bool,                  // Heuristic: written to but not read?
    pub is_array: bool,                   // Heuristic: indexed or iterated?
    pub aliasing_set: Vec<String>,        // Other params that may alias this
}
```

**Build steps:**
1. Bind to libclang via the `clang` crate (or `clang-sys` for lower-level access)
2. Walk the AST, extracting every function, struct, typedef, global, and macro
3. For each function, extract all pointer parameters and classify them using heuristics
4. Capture associated comments — these are critical intent signals for the LLM
5. Resolve all macros and preprocessor conditionals to get the actual compiled code

#### 1.2 — Points-to Analysis

```rust
// fb-frontend/src/points_to.rs

pub enum PointsToTarget {
    StackLocal(String),          // Points to a stack variable
    HeapAllocation(AllocationSite),  // Points to malloc/calloc result
    Global(String),              // Points to a global variable
    StructField(String, String), // Points to a field of a struct
    ArrayElement(String),        // Points to element of an array
    Unknown,                     // Cannot determine statically
}

pub struct PointsToGraph {
    pub edges: HashMap<PointerId, HashSet<PointsToTarget>>,
}

/// Andersen-style inclusion-based points-to analysis
pub fn analyze_points_to(ast: &ExtractedAst) -> PointsToGraph {
    // 1. Initialize: each pointer points to its direct assignment targets
    // 2. Propagate: if p = q, then points-to(p) ⊇ points-to(q)
    // 3. Handle: *p = q means any target of p may point to targets of q
    // 4. Fixed point: iterate until no changes
    todo!()
}
```

**Build steps:**
1. Implement Andersen's algorithm over the extracted AST
2. Handle common C idioms: `void*` casting, function pointer tables, flexible array members
3. Track pointer arithmetic (p + offset) as array element references
4. Output the points-to graph as part of the CAB

#### 1.3 — Use-Def Chain Extraction

```rust
// fb-frontend/src/use_def.rs

pub struct UseDefChain {
    pub pointer: PointerId,
    pub definitions: Vec<DefSite>,   // Where this pointer is assigned
    pub uses: Vec<UseSite>,          // Where this pointer is dereferenced/read
    pub frees: Vec<FreeSite>,        // Where this pointer's memory is freed
    pub escapes: Vec<EscapeSite>,    // Where this pointer leaves the function
}

pub enum UseSite {
    Read { location: SourceLocation },
    Write { location: SourceLocation },
    PassToFunction { callee: String, param_index: usize },
    ReturnFromFunction,
    StoreToGlobal { global: String },
    StoreToStruct { struct_name: String, field: String },
}
```

#### 1.4 — Dynamic Analysis Trace Ingestion

```rust
// fb-frontend/src/dynamic_trace.rs

pub struct DynamicTrace {
    pub allocations: Vec<DynAllocation>,
    pub frees: Vec<DynFree>,
    pub accesses: Vec<DynAccess>,
    pub data_races: Vec<DynRace>,       // From TSan
    pub ub_events: Vec<DynUBEvent>,     // From UBSan
}

/// Parse ASan/MSan/TSan output from test runs
pub fn ingest_sanitizer_output(log_path: &Path) -> DynamicTrace {
    todo!()
}

/// Run the C code under fuzzing and collect traces
pub fn fuzz_and_trace(c_binary: &Path, seeds: &[Vec<u8>], duration: Duration) -> Vec<DynamicTrace> {
    todo!()
}
```

**Build steps:**
1. Compile the C project with `-fsanitize=address,memory,thread,undefined`
2. Run the project's existing test suite and capture sanitizer output
3. Run libFuzzer/AFL++ if the project has fuzz targets (or generate simple ones)
4. Parse sanitizer logs into structured `DynamicTrace` objects
5. Merge static and dynamic analysis: use dynamic traces to resolve `Unknown` points-to targets

#### 1.5 — CAB Serialization

```protobuf
// fb-cab/proto/cab.proto

syntax = "proto3";

message CAnalysisBundle {
  string project_name = 1;
  string commit_hash = 2;
  repeated FunctionInfo functions = 3;
  repeated StructInfo structs = 4;
  repeated GlobalInfo globals = 5;
  PointsToGraph points_to = 6;
  repeated UseDefChain use_def_chains = 7;
  CallGraph call_graph = 8;
  repeated DynamicTrace dynamic_traces = 9;
  map<string, string> source_files = 10;  // filename → content
}
```

---

## Stage 2: Ownership Semantic Graph

### Purpose

Transform the raw CAB into a typed intermediate representation that makes implicit C ownership patterns explicit, so the translation engine receives pre-classified pointers rather than raw analysis data.

### Core Data Structures

```rust
// fb-osg/src/graph.rs

/// The four ownership classes — every C pointer maps to exactly one
pub enum OwnershipClass {
    Owning,           // This scope allocates and frees → Box<T>
    BorrowShared,     // Read-only reference to data owned elsewhere → &T
    BorrowMut,        // Exclusive mutable reference → &mut T
    SharedOwnership,  // Multiple owners, runtime refcount → Rc<T> or Arc<T>
    RawUnsafe,        // Cannot determine — will require unsafe or manual review
}

/// Lifetime region — a scope during which a borrow is valid
pub struct LifetimeRegion {
    pub name: String,              // e.g., 'a, 'b
    pub start: SourceLocation,
    pub end: SourceLocation,
    pub borrows: Vec<PointerId>,   // Pointers active during this lifetime
    pub outlives: Vec<String>,     // Other lifetime regions this outlives
}

/// Rust idiom that a C pattern maps to
pub enum RustIdiom {
    VecFromMallocArray,            // malloc + size → Vec<T>
    StringFromCharStar,            // char* → String or &str
    OptionFromNullablePtr,         // ptr that's checked against NULL → Option<&T>
    ResultFromErrorCode,           // int return + error codes → Result<T, E>
    ClosureFromCallback,           // function_ptr + void* context → closure
    IteratorFromLoop,              // for loop over array → iterator
    EnumFromTaggedUnion,           // struct { tag; union { ... } } → enum
    SliceFromPtrLen,               // (ptr, len) pair → &[T]
    BoxFromSingleHeapAlloc,        // malloc(sizeof(T)) → Box<T>
    ArcFromSharedMutableState,     // pthread_mutex + shared ptr → Arc<Mutex<T>>
    ArenaFromCustomAllocator,      // Custom pool → bumpalo/typed-arena
}

/// Complete ownership semantic graph for one translation unit
pub struct OwnershipSemanticGraph {
    pub functions: Vec<AnnotatedFunction>,
    pub structs: Vec<AnnotatedStruct>,
    pub globals: Vec<AnnotatedGlobal>,
    pub lifetime_regions: Vec<LifetimeRegion>,
    pub idioms_detected: Vec<(SourceSpan, RustIdiom)>,
    pub confidence: f64,           // Overall confidence in the analysis
    pub unresolved: Vec<UnresolvedPointer>,  // Pointers that need human review
}

pub struct AnnotatedFunction {
    pub original: FunctionInfo,
    pub params: Vec<AnnotatedParam>,
    pub return_ownership: Option<OwnershipClass>,
    pub lifetime_params: Vec<String>,    // Inferred lifetime parameters
    pub rust_signature: String,          // Predicted Rust function signature
    pub complexity_score: f64,           // 0.0 = trivial, 1.0 = extremely complex
}

pub struct AnnotatedParam {
    pub original: PointerParam,
    pub ownership: OwnershipClass,
    pub idiom: Option<RustIdiom>,
    pub confidence: f64,
}
```

### Ownership Classification Algorithm

```rust
// fb-osg/src/ownership.rs

/// Heuristic ownership classifier (Phase 1 — no ML)
pub fn classify_ownership_heuristic(
    pointer: &PointerParam,
    use_def: &UseDefChain,
    points_to: &PointsToGraph,
    call_graph: &CallGraph,
) -> (OwnershipClass, f64) {
    // Rule 1: If malloc/calloc in same function as free → Owning
    // Confidence: 0.95
    
    // Rule 2: If pointer is never written through → BorrowShared
    // Confidence: 0.90
    
    // Rule 3: If pointer is written through but not freed → BorrowMut
    // Confidence: 0.85
    
    // Rule 4: If pointer is stored in multiple structs → SharedOwnership
    // Confidence: 0.70
    
    // Rule 5: If pointer escapes to another thread → SharedOwnership (Arc)
    // Confidence: 0.75
    
    // Rule 6: If pointer comes from parameter and is not freed → BorrowShared or BorrowMut
    // Check if any use is a write to determine shared vs mut
    // Confidence: 0.80
    
    // Rule 7: If none of the above match → RawUnsafe
    // Confidence: 0.30
    
    todo!()
}

/// ML ownership classifier (Phase 2+)
/// Trained on human-annotated ownership decisions from Stage 5
pub fn classify_ownership_ml(
    pointer: &PointerParam,
    use_def: &UseDefChain,
    context: &FunctionContext,
    model: &OwnershipModel,
) -> (OwnershipClass, f64) {
    // Feature extraction:
    // - Use-def chain length
    // - Number of aliases
    // - Whether freed in same scope
    // - Whether passed to other functions
    // - Whether stored in structs
    // - Whether accessed from multiple threads
    // - Function name / variable name embeddings (semantic hints)
    // - Comment embeddings (intent hints)
    todo!()
}
```

### Idiom Detection

```rust
// fb-osg/src/idioms.rs

pub fn detect_idioms(func: &FunctionInfo, use_def: &[UseDefChain]) -> Vec<(SourceSpan, RustIdiom)> {
    let mut idioms = vec![];
    
    // Pattern: ptr = malloc(n * sizeof(T)); ... free(ptr);
    // with indexed access ptr[i]
    // → VecFromMallocArray
    
    // Pattern: char *s = ...; strlen(s); strcmp(s, ...);
    // → StringFromCharStar
    
    // Pattern: if (ptr == NULL) return ERROR;
    // → OptionFromNullablePtr
    
    // Pattern: int err = some_func(...); if (err != 0) { ... }
    // → ResultFromErrorCode
    
    // Pattern: typedef void (*callback_t)(void *ctx, ...);
    //          struct { callback_t cb; void *ctx; };
    // → ClosureFromCallback
    
    // Pattern: for (int i = 0; i < len; i++) { arr[i]... }
    // → IteratorFromLoop
    
    // Pattern: struct { int tag; union { TypeA a; TypeB b; } data; };
    //          switch (x.tag) { case 0: x.data.a...; }
    // → EnumFromTaggedUnion
    
    // Pattern: void func(const T *data, size_t len)
    // → SliceFromPtrLen
    
    idioms
}
```

---

## Stage 3: Translation Engine

### Purpose

Given annotated C source (with OSG metadata), generate safe idiomatic Rust code.

### Router

```rust
// fb-translate/src/router.rs

pub enum TranslationTarget {
    FineTunedModel,  // Fast, cheap, handles routine patterns
    ClaudeAPI,       // Slow, expensive, handles complex cases
}

pub fn route_function(func: &AnnotatedFunction) -> TranslationTarget {
    // Route to fine-tuned model if ALL of:
    // - complexity_score < 0.5
    // - All params have confidence > 0.8
    // - No unresolved pointers
    // - No custom allocator patterns
    // - No concurrent code patterns
    // - Function body < 100 lines
    
    // Route to Claude if ANY of:
    // - complexity_score >= 0.5
    // - Any param has confidence < 0.8
    // - Contains custom allocator pattern
    // - Contains concurrent code (pthread, atomic)
    // - Contains complex macro usage
    // - Cross-module lifetime dependencies
    
    if func.complexity_score < 0.5
        && func.params.iter().all(|p| p.confidence > 0.8)
        && func.unresolved_count() == 0
        && func.original.body_lines() < 100
    {
        TranslationTarget::FineTunedModel
    } else {
        TranslationTarget::ClaudeAPI
    }
}
```

### Claude Integration

```rust
// fb-translate/src/claude.rs

use anthropic_sdk::*;

pub struct ClaudeTranslator {
    client: AnthropicClient,
    model: String,  // "claude-sonnet-4-20250514" for batch, opus for complex
}

impl ClaudeTranslator {
    pub async fn translate_function(
        &self,
        func: &AnnotatedFunction,
        osg: &OwnershipSemanticGraph,
        project_context: &ProjectContext,
    ) -> TranslationResult {
        let prompt = self.build_prompt(func, osg, project_context);
        
        let response = self.client.messages()
            .model(&self.model)
            .max_tokens(4096)
            .system(SYSTEM_PROMPT)
            .user(prompt)
            .send()
            .await?;
        
        let rust_code = extract_rust_code(&response);
        let explanation = extract_explanation(&response);
        
        TranslationResult {
            rust_code,
            explanation,
            confidence: self.estimate_confidence(&response),
        }
    }
    
    fn build_prompt(
        &self,
        func: &AnnotatedFunction,
        osg: &OwnershipSemanticGraph,
        ctx: &ProjectContext,
    ) -> String {
        format!(r#"
Translate the following C function to safe, idiomatic Rust.

## Ownership Analysis (pre-computed)
{ownership_annotations}

## Lifetime Regions (pre-computed)  
{lifetime_annotations}

## Detected Idioms
{idiom_annotations}

## C Source Code
```c
{c_source}
```

## Related Type Definitions
```c
{related_types}
```

## Instructions
1. Use the ownership annotations to determine Rust types for each pointer parameter
2. Apply the detected idioms (e.g., malloc+free→Vec, char*→String)
3. Infer lifetime parameters from the lifetime regions
4. Do NOT use `unsafe` unless absolutely necessary — explain why if you must
5. Produce idiomatic Rust: use iterators, pattern matching, Result/Option
6. Preserve the function's semantic behavior
7. Include a brief explanation of key translation decisions

## Output Format
```rust
// Your Rust translation here
```

### Explanation
[Your explanation of translation decisions]
"#,
            ownership_annotations = format_ownership(func, osg),
            lifetime_annotations = format_lifetimes(func, osg),
            idiom_annotations = format_idioms(func, osg),
            c_source = func.original.source(),
            related_types = ctx.related_type_definitions(func),
        )
    }
}

const SYSTEM_PROMPT: &str = r#"
You are an expert C-to-Rust translator. You receive C source code annotated 
with pre-computed ownership analysis, lifetime regions, and detected idioms.

Your job is to produce safe, idiomatic Rust code that:
1. Preserves the semantic behavior of the C original
2. Uses NO unsafe blocks unless absolutely required (and explains why)
3. Leverages Rust idioms (iterators, pattern matching, Result, Option)
4. Has correct lifetime annotations
5. Would pass review by an experienced Rust developer
6. Compiles with rustc with no warnings

You are NOT doing blind translation. The ownership analysis tells you which 
pointers are owning (Box), borrowing (&/&mut), or shared (Arc/Rc). Trust 
the analysis unless you see clear evidence it's wrong, in which case explain 
your override.
"#;
```

### Prompt Templates

```markdown
<!-- fb-translate/src/prompts/allocator.md -->

# Custom Allocator Migration Prompt

You are translating C code that uses a custom memory allocator.

## Allocator Pattern Detected: {pattern_name}

### Original C Allocator
```c
{allocator_source}
```

### Pattern Analysis
- Type: {arena|pool|slab|freelist}
- Allocation size: {fixed|variable}
- Thread safety: {single_threaded|multi_threaded}
- Lifetime: {function_scoped|module_scoped|global}

### Recommended Rust Equivalent
- Arena → `bumpalo::Bump` or `typed_arena::Arena<T>`
- Pool → Custom pool with `Vec<T>` backing store
- Slab → `slab::Slab<T>`
- Freelist → `Vec<T>` with index recycling

### Instructions
1. Replace the C allocator with the recommended Rust equivalent
2. Update all allocation sites to use the new allocator API
3. Remove all manual free() calls — the Rust allocator handles this
4. Ensure the allocator lifetime is correctly scoped
5. If the allocator is shared across threads, use Arc<Mutex<Allocator>>
```

---

## Stage 4: Verification Pipeline

### Purpose

Prove that generated Rust code is correct and safe through multiple verification layers.

### Implementation

```rust
// fb-verify/src/lib.rs

pub struct VerificationPipeline {
    pub gates: Vec<Box<dyn VerificationGate>>,
}

pub struct VerificationResult {
    pub passed: bool,
    pub gate_results: Vec<GateResult>,
    pub overall_confidence: f64,
}

pub struct GateResult {
    pub gate_name: String,
    pub passed: bool,
    pub details: String,
    pub errors: Vec<VerificationError>,
}

impl VerificationPipeline {
    pub fn standard() -> Self {
        Self {
            gates: vec![
                Box::new(RustcCompilationGate),
                Box::new(MiriGate),
                Box::new(DifferentialFuzzGate::new(10_000)),  // 10K inputs
                Box::new(ClippyGate),
                Box::new(ComplexityGate { max_ratio: 2.0 }),
            ],
        }
    }
    
    pub fn high_assurance() -> Self {
        let mut pipeline = Self::standard();
        pipeline.gates.push(Box::new(KaniGate));
        pipeline.gates.push(Box::new(CreusotGate));
        pipeline
    }
    
    pub async fn verify(
        &self,
        c_source: &str,
        rust_source: &str,
        test_inputs: &[Vec<u8>],
    ) -> VerificationResult {
        let mut results = vec![];
        
        for gate in &self.gates {
            let result = gate.check(c_source, rust_source, test_inputs).await;
            let passed = result.passed;
            results.push(result);
            
            // Short-circuit on compilation failure
            if !passed && gate.is_blocking() {
                break;
            }
        }
        
        let passed = results.iter().all(|r| r.passed);
        let confidence = results.iter()
            .map(|r| r.confidence())
            .product::<f64>();
        
        VerificationResult {
            passed,
            gate_results: results,
            overall_confidence: confidence,
        }
    }
}
```

### Differential Fuzzing

```rust
// fb-verify/src/fuzz.rs

use std::process::Command;

pub struct DifferentialFuzzGate {
    num_inputs: usize,
}

impl VerificationGate for DifferentialFuzzGate {
    async fn check(
        &self,
        c_source: &str,
        rust_source: &str,
        seed_inputs: &[Vec<u8>],
    ) -> GateResult {
        // 1. Compile C source to binary
        let c_binary = compile_c(c_source)?;
        
        // 2. Compile Rust source to binary
        let rust_binary = compile_rust(rust_source)?;
        
        // 3. Generate random inputs (or use seeds + mutations)
        let inputs = generate_inputs(seed_inputs, self.num_inputs);
        
        // 4. Run both binaries with each input, compare outputs
        let mut mismatches = vec![];
        for input in &inputs {
            let c_output = run_binary(&c_binary, input);
            let rust_output = run_binary(&rust_binary, input);
            
            if c_output != rust_output {
                mismatches.push(FuzzMismatch {
                    input: input.clone(),
                    c_output,
                    rust_output,
                });
            }
        }
        
        GateResult {
            gate_name: "differential_fuzz".into(),
            passed: mismatches.is_empty(),
            details: format!("{}/{} inputs matched", 
                self.num_inputs - mismatches.len(), 
                self.num_inputs),
            errors: mismatches.into_iter()
                .map(|m| m.into())
                .collect(),
        }
    }
    
    fn is_blocking(&self) -> bool { true }
}
```

---

## Stage 5: Human Review Platform

### Purpose

Web-based IDE where Rust experts review translations, approve/reject, annotate corrections, and feed improvements back into the training pipeline.

### Core Features

```
┌─────────────────────────────────────────────────────────────────┐
│  Ferrous Bridge Review Dashboard                     [user ▼]  │
├────────────────────────────────────┬────────────────────────────┤
│  Project: openssl-core             │  Progress: 847/1203 (70%) │
│  Confidence: 🟢 High: 612         │  🟡 Medium: 189           │
│  🔴 Low: 49  │  ⬜ Unresolved: 353 │                           │
├────────────────────────────────────┴────────────────────────────┤
│                                                                 │
│  ┌─── C Source ────────────────┐ ┌─── Rust Output ───────────┐ │
│  │ void process_buffer(        │ │ fn process_buffer(         │ │
│  │   char *buf,     // &mut [u8]│ │   buf: &mut [u8],         │ │
│  │   size_t len,               │ │ ) -> Result<usize, Error>  │ │
│  │   int *err_code  // Result  │ │ {                          │ │
│  │ ) {                         │ │   // ...                   │ │
│  │   // ...                    │ │ }                          │ │
│  └─────────────────────────────┘ └────────────────────────────┘ │
│                                                                 │
│  ┌─── Ownership Analysis ──────────────────────────────────────┐│
│  │ buf:      BorrowMut (0.92)  — written, not freed            ││
│  │ err_code: ResultFromErrorCode (0.88) — int* output param    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─── Verification ───────────────────────────────────────────┐ │
│  │ ✅ rustc compilation    ✅ Miri     ✅ Clippy              │ │
│  │ ✅ Diff fuzz (10K)      ⬜ Kani     ⬜ Creusot             │ │
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [✅ Approve] [❌ Reject] [✏️ Edit Rust] [🏷️ Annotate Ownership]│
│                                                                 │
│  ┌─── Explanation ─────────────────────────────────────────────┐│
│  │ Translated buf (char*) to &mut [u8] because the function   ││
│  │ writes to the buffer (detected 3 write sites) and the      ││
│  │ caller always passes a stack-allocated array with known     ││
│  │ length. Converted error code output parameter to Result     ││
│  │ return type — the original function used 0 for success      ││
│  │ and negative values for different error conditions.         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Feedback Loop

Every human action generates training signal:

| Action | Training Signal |
|---|---|
| Approve translation | Verified (C, Rust) pair added to corpus |
| Reject translation | Negative example — (C, bad_Rust) added as contrastive pair |
| Edit Rust output | (C, human_corrected_Rust) pair — highest quality signal |
| Annotate ownership | Ownership classification correction → retrain Stage 2 classifier |
| Override confidence | Recalibrate confidence model |

---

## Training Data Pipeline

### Synthetic Pair Generation

```rust
// fb-training/src/synthetic.rs

pub struct SyntheticGenerator {
    claude: ClaudeTranslator,
    verifier: VerificationPipeline,
}

impl SyntheticGenerator {
    /// Generate training pairs from a C source file
    pub async fn generate_pairs(
        &self,
        c_source: &str,
    ) -> Vec<VerifiedPair> {
        let mut pairs = vec![];
        
        // 1. Extract individual functions
        let functions = extract_functions(c_source);
        
        for func in &functions {
            // 2. Generate N candidate translations via Claude
            let candidates = self.generate_candidates(func, 3).await;
            
            // 3. Verify each candidate through the pipeline
            for candidate in candidates {
                let result = self.verifier.verify(
                    &func.source, 
                    &candidate.rust_code, 
                    &[]
                ).await;
                
                if result.passed {
                    pairs.push(VerifiedPair {
                        c_source: func.source.clone(),
                        rust_source: candidate.rust_code,
                        ownership_annotations: candidate.ownership,
                        verification_result: result,
                        source: PairSource::Synthetic,
                    });
                }
            }
        }
        
        pairs
    }
}
```

### Six-Gate Verification for Training Pairs

```
Gate 1: rustc compilation (no errors)
  │ FAIL → discard
  ▼
Gate 2: Zero unsafe blocks (or minimally scoped + justified)
  │ FAIL → flag for review, do not auto-include
  ▼
Gate 3: Miri clean (no UB detected)
  │ FAIL → discard
  ▼
Gate 4: Differential fuzzing (10K inputs match)
  │ FAIL → discard (semantic inequivalence)
  ▼
Gate 5: Clippy clean (no warnings)
  │ FAIL → flag for idiom review, may include with annotation
  ▼
Gate 6: Complexity ratio < 2x human equivalent
  │ FAIL → flag for readability review
  ▼
  ✅ VERIFIED PAIR → add to training corpus
```

---

## Development Phases

### Phase 1: Foundation (Months 1–3)

**Goal:** End-to-end pipeline working on simple C programs (< 500 LOC, single file, no custom allocators, no threading).

| Week | Milestone | Owner |
|---|---|---|
| 1–2 | Project scaffolding, CI/CD, Docker setup | Agent Team 1 |
| 2–4 | Clang AST extraction working on 10 test files | Agent Team 1 |
| 3–5 | Points-to analysis (Andersen's) implemented | Agent Team 1 |
| 4–6 | Use-def chain extraction complete | Agent Team 1 |
| 5–7 | CAB format defined and serialization working | Agent Team 1 |
| 4–6 | OSG data structures, heuristic ownership classifier | Agent Team 2 |
| 6–8 | Basic idiom detection (top 5 patterns) | Agent Team 2 |
| 6–8 | Claude integration with prompt templates | Agent Team 3 |
| 8–10 | Verification pipeline (rustc + Miri + diff fuzz) | Agent Team 4 |
| 10–12 | End-to-end test on 50 small C projects | All teams |

**Success metric:** 60% of functions compile as safe Rust. < 20% require unsafe blocks.

### Phase 2: Training Flywheel (Months 4–8)

**Goal:** Fine-tuned model handling 70% of functions. 80% compilation success rate.

| Week | Milestone | Owner |
|---|---|---|
| 13–16 | Synthetic training data generation (10K pairs) | Agent Team 3 |
| 14–18 | C2Rust safe-ification pipeline (20K pairs) | Agent Team 3 |
| 16–20 | Fine-tune DeepSeek-Coder or Qwen2.5-Coder on corpus | Agent Team 3 |
| 17–20 | Router logic: FTM vs Claude classification | Agent Team 3 |
| 18–22 | ML ownership classifier trained on Phase 1 annotations | Agent Team 2 |
| 20–24 | Allocator pattern detection (arena, pool, slab) | Agent Team 2 |
| 22–26 | Scale to 500 C projects, measure metrics | All teams |
| 24–28 | Natural rewrite mining (rustls↔OpenSSL, etc.) | Agent Team 3 |

**Success metric:** Fine-tuned model handles 70% of translation volume. 80% compilation success. Cost per function < $0.05 (blended FTM + Claude).

### Phase 3: Verification & Product (Months 9–14)

**Goal:** Production-quality verification. Human review platform. Beta customers.

| Week | Milestone | Owner |
|---|---|---|
| 29–32 | Kani model checking integration | Agent Team 4 |
| 30–34 | Specification extraction from C test suites | Agent Team 4 |
| 32–36 | Human review platform (React + Axum backend) | Agent Team 5 |
| 34–38 | Feedback loop: approvals → training pipeline | Agent Team 3+5 |
| 36–40 | Open-source release: fb-frontend, fb-cab, fb-verify/fuzz | All |
| 38–42 | Beta launch with 3 design partners | Founder |
| 40–44 | DARPA TRACTOR performer/sub application | Founder |

**Success metric:** 90% compilation success. < 5% unsafe blocks. 3 paying beta customers. Open-source repo has 500+ GitHub stars.

### Phase 4: Scale (Months 15–24)

**Goal:** Enterprise product. C++ support begins. Defense certifications.

| Quarter | Milestone |
|---|---|
| Q1 | Continuous fine-tuning from human review feedback |
| Q1 | Domain modules: automotive (MISRA C), medical (IEC 62304) |
| Q2 | C++ support (templates, RAII, virtual dispatch) |
| Q2 | Air-gapped deployment for defense customers |
| Q3 | SBIR/STTR applications for defense-specific funding |
| Q4 | Target: 95% success on C, 3+ enterprise customers |

---

## Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| Core language | Rust | Dogfooding. Also performance, safety, and the ecosystem we're targeting |
| C analysis | libclang (via clang crate) | Standard Clang API, well-maintained Rust bindings |
| LLVM IR | inkwell or llvm-sys | Low-level LLVM access for optimization-level analysis |
| Serialization | protobuf (prost) + serde/JSON | Protobuf for performance, JSON for debugging and interop |
| LLM (complex) | Claude API (anthropic-sdk) | Best reasoning for complex translation decisions |
| LLM (batch) | Fine-tuned DeepSeek/Qwen on vLLM | Fast inference, low cost per translation |
| Verification | rustc, Miri, Kani, cargo-fuzz | Standard Rust verification ecosystem |
| Web backend | Axum | Fast, async, Rust-native |
| Web frontend | React + TypeScript + Tailwind | Standard frontend stack, fast to iterate |
| Database | PostgreSQL (sqlx) | Training corpus, audit trail, user management |
| Queue | Redis or NATS | Job queue for async translation and verification |
| Container | Docker + docker-compose | Development and deployment |
| CI/CD | GitHub Actions | Standard, integrates with open-source workflow |
| GPU infra | Modal or RunPod (Phase 2+) | Fine-tuning and FTM inference hosting |

---

## Agent Team Assignments

For development using Claude Code agent teams:

### Team 1: Frontend (fb-frontend, fb-cab)

**Focus:** C analysis infrastructure
**Skills needed:** Clang/LLVM, compiler engineering, static analysis
**Key files:** `ast_extract.rs`, `points_to.rs`, `use_def.rs`, `call_graph.rs`, `cab.rs`
**Dependencies:** None (this is the foundation)
**Tests:** Each analysis module has property-based tests using known C programs with expected analysis results

### Team 2: OSG Engine (fb-osg)

**Focus:** Ownership inference and idiom detection
**Skills needed:** Type systems, program analysis, ML classification
**Key files:** `ownership.rs`, `lifetimes.rs`, `idioms.rs`, `allocators.rs`
**Dependencies:** Team 1 (CAB format)
**Tests:** Ownership classification accuracy on manually annotated C programs

### Team 3: Translation (fb-translate, fb-training)

**Focus:** LLM integration, prompt engineering, fine-tuning pipeline
**Skills needed:** LLM APIs, prompt engineering, ML training pipelines
**Key files:** `claude.rs`, `router.rs`, `prompts/*.md`, `synthetic.rs`, `verify_pair.rs`
**Dependencies:** Team 2 (OSG), Team 4 (verification for training data)
**Tests:** Translation quality metrics on benchmark C programs

### Team 4: Verification (fb-verify)

**Focus:** Correctness and safety verification
**Skills needed:** Formal methods, fuzzing, Rust compiler internals
**Key files:** `compile.rs`, `miri.rs`, `kani.rs`, `fuzz.rs`
**Dependencies:** Team 3 (needs Rust output to verify)
**Tests:** Known-correct and known-incorrect translations (must accept/reject correctly)

### Team 5: Platform (fb-review)

**Focus:** Human review web application
**Skills needed:** Full-stack web development (Axum + React)
**Key files:** `server.rs`, `diff.rs`, `App.tsx`, `DiffView.tsx`
**Dependencies:** All other teams (consumes their outputs)
**Tests:** E2E browser tests for review workflow

### RalphD: Meta-Supervisor

**Role:** Monitor all agent teams for architectural drift
**Enforces:**
- CAB schema contract between Team 1 and Team 2
- OSG schema contract between Team 2 and Team 3
- Verification interface contract between Team 3 and Team 4
- No team introduces dependencies that violate the open/closed boundary
- Code style consistency across all crates
- Test coverage thresholds (> 80% for open-source crates)

---

## Open Source vs Proprietary Map

```
OPEN SOURCE (Apache 2.0)                PROPRIETARY
─────────────────────────               ─────────────────────────
fb-frontend/                            fb-translate/
  ├── ast_extract.rs                      ├── router.rs
  ├── llvm_ir.rs                          ├── claude.rs
  ├── points_to.rs                        ├── ftm.rs
  ├── call_graph.rs                       ├── prompts/
  ├── use_def.rs                          ├── context.rs
  ├── dynamic_trace.rs                    └── postprocess.rs
  └── cab.rs
                                        fb-training/
fb-cab/                                   ├── corpus.rs
  ├── schema.rs                           ├── synthetic.rs
  ├── serialize.rs                        ├── c2rust_safe.rs
  ├── validate.rs                         ├── adversarial.rs
  └── proto/cab.proto                     ├── natural.rs
                                          ├── verify_pair.rs
fb-osg/ (partial)                         └── export.rs
  ├── graph.rs          ← OPEN
  ├── ownership.rs      ← OPEN (heuristic)  fb-review/
  │                        CLOSED (ML model)   ├── server.rs
  ├── lifetimes.rs      ← OPEN               ├── diff.rs
  ├── allocators.rs     ← CLOSED             ├── confidence.rs
  └── idioms.rs         ← CLOSED             ├── audit.rs
                                              ├── feedback.rs
fb-verify/ (partial)                          └── frontend/
  ├── compile.rs        ← OPEN
  ├── miri.rs           ← OPEN            Trained Models:
  ├── fuzz.rs           ← OPEN              ├── ownership_classifier.bin
  ├── clippy.rs         ← OPEN              ├── idiom_detector.bin
  ├── kani.rs           ← OPEN              └── ftm_weights/
  ├── spec_extract.rs   ← CLOSED
  └── verdict.rs        ← OPEN
```

**Licensing strategy:**
- Open components: Apache 2.0 (maximum adoption, DARPA-friendly)
- Proprietary components: Commercial license, available via SaaS API or enterprise on-prem
- Trained models: Never distributed — inference via API only (or on-prem appliance for defense)

---

## Testing Strategy

### Unit Tests

Every module has unit tests covering:
- Happy path (known C input → expected output)
- Edge cases (empty functions, void pointers, variadic functions)
- Error handling (malformed input, unsupported constructs)

### Integration Tests

End-to-end pipeline tests using the `tests/fixtures/` directory:

```
tests/fixtures/
├── simple/
│   ├── hello.c              # printf, no pointers
│   ├── hello.expected.rs    # Expected Rust output
│   ├── fibonacci.c          # Pure computation
│   ├── string_reverse.c     # Stack buffer manipulation
│   └── linked_list.c        # Single-file linked list
├── ownership/
│   ├── malloc_free_same.c   # Owning pointer
│   ├── borrow_readonly.c    # Shared borrow
│   ├── borrow_write.c       # Mutable borrow
│   ├── shared_refcount.c    # Reference counting
│   └── escape_to_global.c   # Pointer escapes scope
├── lifetimes/
│   ├── return_ref.c         # Return pointer to param
│   ├── cross_function.c     # Pointer passed through 3 functions
│   ├── struct_lifetime.c    # Struct containing borrowed pointer
│   └── nested_borrow.c      # Borrow of borrow
├── allocators/
│   ├── arena.c              # Arena allocator pattern
│   ├── pool.c               # Fixed-size pool
│   └── slab.c               # Slab allocator
├── concurrent/
│   ├── mutex.c              # pthread_mutex
│   ├── atomic.c             # atomic operations
│   └── thread_spawn.c       # pthread_create
├── idioms/
│   ├── error_codes.c        # int return → Result
│   ├── nullable_ptr.c       # NULL check → Option
│   ├── callback_ctx.c       # Function pointer + void* → closure
│   ├── tagged_union.c       # tag + union → enum
│   └── ptr_len_pair.c       # (ptr, len) → slice
└── adversarial/
    ├── buffer_overflow.c    # Known CVE pattern
    ├── use_after_free.c     # Known CVE pattern
    ├── double_free.c        # Known CVE pattern
    └── format_string.c      # Known CVE pattern
```

### Benchmark Suite

```bash
# scripts/benchmark.sh

# Benchmark projects (real-world C code, increasing complexity):
PROJECTS=(
    "jsmn"              # ~500 LOC, JSON parser
    "sds"               # ~1K LOC, dynamic strings  
    "http-parser"       # ~2.5K LOC, HTTP parsing
    "cJSON"             # ~3K LOC, JSON library
    "miniz"             # ~5K LOC, compression
    "sqlite"            # ~150K LOC, database (stretch goal)
)

for project in "${PROJECTS[@]}"; do
    echo "=== Benchmarking: $project ==="
    
    # Metrics:
    # 1. Compilation success rate (% of functions that compile)
    # 2. Unsafe block rate (% of output containing unsafe)
    # 3. Differential fuzz pass rate (% of inputs that match)
    # 4. Translation time (seconds per function)
    # 5. Claude API cost ($ per function)
    # 6. Fine-tuned model vs Claude routing ratio
    
    fb translate "$project/" --benchmark --output "results/$project/"
done
```

---

## Infrastructure & Deployment

### Development Environment

```yaml
# docker-compose.yml

services:
  frontend-analysis:
    build: ./infra/docker/Dockerfile.frontend
    # Clang 18, LLVM 18, ASan/MSan/TSan, libFuzzer
    volumes:
      - ./crates/fb-frontend:/app
      - ./tests/fixtures:/fixtures
  
  translation-engine:
    build: ./infra/docker/Dockerfile.translate
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - FTM_ENDPOINT=${FTM_ENDPOINT}
    volumes:
      - ./crates/fb-translate:/app
  
  verification:
    build: ./infra/docker/Dockerfile.verify
    # Rust nightly (for Miri), Kani, cargo-fuzz
    volumes:
      - ./crates/fb-verify:/app
  
  postgres:
    image: postgres:16
    environment:
      - POSTGRES_DB=ferrous_bridge
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
  
  redis:
    image: redis:7
    # Job queue for async translation/verification

volumes:
  pgdata:
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml

name: CI

on: [push, pull_request]

jobs:
  test-open-source:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - run: cargo test -p fb-frontend -p fb-cab -p fb-osg -p fb-verify
      
  test-fixtures:
    runs-on: ubuntu-latest
    needs: test-open-source
    steps:
      - uses: actions/checkout@v4
      - name: Install Clang 18
        run: apt-get install -y clang-18 llvm-18
      - name: Run fixture tests
        run: cargo test --test integration_tests
      
  benchmark-nightly:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Run benchmark suite
        run: ./scripts/benchmark.sh
      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: benchmark-results
          path: results/
```

---

## Quick Start for Claude Code

```bash
# Clone and setup
git clone https://github.com/MagnetonIO/ferrous-bridge.git
cd ferrous-bridge
./scripts/setup.sh

# Run the pipeline on a C file
cargo run --bin fb -- translate tests/fixtures/simple/linked_list.c \
    --output output/linked_list.rs \
    --verbose

# Run verification on existing translation
cargo run --bin fb -- verify \
    --c-source tests/fixtures/simple/linked_list.c \
    --rust-source output/linked_list.rs

# Generate training data from a C project
cargo run --bin fb -- generate-training-data \
    --project-dir /path/to/c-project/ \
    --output-dir training_data/ \
    --num-candidates 3

# Run benchmarks
./scripts/benchmark.sh
```

---

## Key Design Decisions

1. **Rust for Rust.** The entire toolchain is written in Rust. This is both dogfooding and practical — we need tight integration with rustc, Miri, Kani, and the Rust ecosystem.

2. **CAB as interchange format.** The C-Analysis Bundle is the contract between frontend analysis and ownership inference. This decouples the stages and allows third parties to build alternative frontends (e.g., for C++, or for proprietary C dialects).

3. **Claude for hard cases, FTM for volume.** Claude's reasoning ability is unmatched for complex translation decisions, but it's too slow and expensive for every function. The distillation flywheel progressively moves volume to the fine-tuned model.

4. **Verification as oracle, not gatekeeper.** The verification pipeline doesn't just accept/reject — failed verifications generate structured error feedback that the translation engine uses to retry with additional context.

5. **Human review as training signal.** Every human decision improves the system. Approved translations become training data. Rejected translations become contrastive examples. Ownership corrections retrain the classifier. This creates a compounding advantage over time.

6. **Open-source the infrastructure, close the intelligence.** The frontend analysis and verification harness are open-source to build trust and ecosystem. The trained models, prompt engineering, and routing logic are proprietary to create defensibility.
