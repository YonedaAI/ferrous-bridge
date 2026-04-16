# Ferrous Bridge — Target Library Selection

## Prioritized C Libraries for AI-Assisted C→Rust Translation

---

## Selection Criteria

Each target is scored on five dimensions:

| Criterion | Why It Matters |
|---|---|
| **CVE History** | More memory safety CVEs = stronger case for Rust rewrite = better marketing |
| **LOC / Complexity** | Smaller = faster first win. Must be achievable in Phase 1–2 |
| **Existing Rust Alt** | If a Rust rewrite already exists, we benchmark against it — not compete |
| **Ubiquity** | How many systems depend on this? Higher = more impact = more press |
| **API Surface** | Narrow API = easier to verify semantic equivalence via differential fuzzing |

---

## The Landscape: What's Already Been Done

Before choosing targets, know what Prossimo/ISRG and others have already shipped:

| C Original | Rust Replacement | Status |
|---|---|---|
| OpenSSL (TLS) | **Rustls** | Production. Let's Encrypt deploying. |
| sudo/su | **sudo-rs** | Production. Default in Ubuntu. |
| ntpd | **ntpd-rs** | Production. Deployed at Let's Encrypt. |
| BIND (DNS) | **Hickory DNS** | Production. |
| Nginx | **River** (reverse proxy) | In progress. |
| curl (HTTP/TLS backends) | **Hyper + Rustls** backends | In progress. Opt-in. |
| AV1 decoder | **rav1d** | Production. |
| zlib | **zlib-rs** (Trifecta Tech) | Active development, near production. |
| bzip2 | **libbzip2-rs** (Trifecta Tech) | Active development. |
| zstd | **libzstd-rs** (Trifecta Tech) | Active development. |

**These are OFF the target list.** Don't compete with shipped projects. Instead, use their C↔Rust pairs as training data for the fine-tuned model.

---

## Tier 1: First Wins (Phase 1 — Months 1–3)

These are small, well-understood, heavily-used C libraries with narrow APIs. Perfect for proving the pipeline works.

### 1. jsmn — Minimalist JSON Parser
- **LOC:** ~500
- **Why:** Tiny, pure C, zero dependencies, pointer-heavy parsing, widely embedded
- **CVE history:** Minimal (small attack surface), but representative of parsing patterns
- **Rust equivalent:** `serde_json` exists but is a different design. A direct translation demonstrates the pipeline.
- **Translation difficulty:** Low. Stack-based token array, pointer arithmetic over input string.
- **Value:** First end-to-end proof that the pipeline works. Good for demos.

### 2. sds — Simple Dynamic Strings
- **LOC:** ~1,200
- **Why:** Redis's string library. Pointer arithmetic, manual memory management, custom allocator pattern (header before string data). A perfect ownership inference test.
- **CVE history:** Used inside Redis, which has had buffer handling issues
- **Rust equivalent:** `String` / `Vec<u8>` — but the translation demonstrates idiom detection (char* → String)
- **Translation difficulty:** Low-Medium. The header-before-payload trick is a classic C pattern.
- **Value:** Proves idiom detection works (malloc+header → `String`/`Vec`)

### 3. http-parser — Node.js HTTP Parser
- **LOC:** ~2,500
- **Why:** Used in Node.js (llhttp replaced it, but the C version is canonical). State machine, callbacks, zero-copy parsing.
- **CVE history:** Multiple buffer overflow CVEs over the years
- **Rust equivalent:** `httparse` exists, but a direct translation shows callback→closure idiom detection
- **Translation difficulty:** Medium. Callback + void* context pattern → closures. State machine translation.
- **Value:** Proves the callback→closure idiom and state machine patterns work.

### 4. cJSON — Lightweight JSON Parser
- **LOC:** ~3,000
- **Why:** Widely embedded in IoT/embedded systems. Tree-based JSON with manual memory management. Recursive descent parser with malloc/free throughout.
- **CVE history:** Multiple CVEs including buffer overflows, NULL pointer dereferences
- **Rust equivalent:** `serde_json`, but cJSON's tree API style maps well to a direct Rust translation
- **Translation difficulty:** Medium. Recursive data structures, manual refcounting, linked lists.
- **Value:** Proves recursive ownership inference and tree data structure translation.

---

## Tier 2: Credibility Targets (Phase 2 — Months 4–8)

Medium-complexity libraries that make the security community take notice.

### 5. libexpat — XML Parser
- **LOC:** ~15,000
- **Why:** Used by Python, Apache, Firefox, D-Bus, and dozens of critical systems. Processes untrusted XML input from the network.
- **CVE history:** **Massive.** 40+ CVEs including critical remote code execution. CVE-2022-25235 through CVE-2022-25236 were catastrophic. Continuous stream of memory safety bugs.
- **Rust equivalent:** `quick-xml`, `xml-rs` exist but aren't drop-in compatible. No direct C-API-compatible Rust replacement.
- **Translation difficulty:** High. Complex state machine, SAX-style callbacks, encoding handling, DTD processing.
- **Value:** **Highest-impact Tier 2 target.** If Ferrous Bridge can translate libexpat to safe Rust, it proves the system works on real security-critical code.

### 6. libpcre2 — Perl-Compatible Regular Expressions
- **LOC:** ~50,000
- **Why:** Used by grep, nginx, PHP, Apache, Git, and hundreds of tools. Processes untrusted regex patterns from user input.
- **CVE history:** Multiple buffer overflow and heap corruption CVEs. Regex engines are historically vulnerable to ReDoS and memory corruption.
- **Rust equivalent:** `regex` crate exists and is excellent, but isn't API-compatible. A direct translation proves complex algorithmic code can be migrated.
- **Translation difficulty:** High. JIT compiler, backtracking engine, Unicode tables, complex pointer arithmetic.
- **Value:** Demonstrates the pipeline handles algorithmically complex code, not just data structure manipulation.

### 7. libyaml — YAML Parser
- **LOC:** ~8,000
- **Why:** Used by Kubernetes, Ansible, Ruby, Python, and most DevOps tooling. Parses untrusted configuration from the network.
- **CVE history:** Multiple buffer overflow and heap overflow CVEs. YAML parsing is notoriously tricky.
- **Rust equivalent:** `serde_yaml` exists but wraps `unsafe-libyaml` (an unsafe Rust port). A safe translation would directly improve the Rust ecosystem.
- **Translation difficulty:** Medium-High. Scanner/parser/emitter architecture. Custom allocators. Complex Unicode handling.
- **Value:** **Directly improves the Rust ecosystem.** The current `serde_yaml` depends on unsafe code. A safe libyaml translation would be immediately adopted.

### 8. libsodium — Modern Crypto Library
- **LOC:** ~20,000
- **Why:** Widely used for encryption, signing, key exchange. Constant-time code, careful memory handling, explicit memory zeroing.
- **CVE history:** Few CVEs (well-audited), but any crypto library in C is a memory safety risk
- **Rust equivalent:** `sodiumoxide` wraps libsodium via FFI. A native Rust translation eliminates the C dependency.
- **Translation difficulty:** High. Constant-time requirements mean the Rust code must not introduce timing side channels. Assembly optimization.
- **Value:** Crypto translation demonstrates the pipeline handles security-sensitive code where correctness is existential.

---

## Tier 3: Flagship Targets (Phase 3 — Months 9–14)

These are the targets that make Ferrous Bridge famous. Large, critical, CVE-riddled.

### 9. libpng — PNG Image Library
- **LOC:** ~30,000
- **Why:** Used by every browser, every image editor, every operating system. Processes untrusted image data from the internet.
- **CVE history:** **Extensive.** 50+ CVEs over two decades. Buffer overflows, heap overflows, integer overflows. CVE-2015-8126 and others were critical.
- **Rust equivalent:** `png` crate exists but is a clean-room implementation, not a translation. A direct translation proves equivalence.
- **Translation difficulty:** High. Complex decompression pipeline (depends on zlib), interlacing, color space conversion, error handling via longjmp.
- **longjmp problem:** libpng uses `setjmp`/`longjmp` for error handling — this is one of the hardest C→Rust translation problems. Solving it here proves the pipeline handles non-local control flow.
- **Value:** **The longjmp test.** If the pipeline can handle libpng's error model, it can handle anything.

### 10. libxml2 — XML Parser (GNOME)
- **LOC:** ~100,000
- **Why:** Used by virtually every Linux system, LibreOffice, Chrome, PHP, Python's lxml, and hundreds of enterprise applications.
- **CVE history:** **Catastrophic.** 100+ CVEs. Remote code execution, XXE attacks, buffer overflows, use-after-free. One of the most CVE'd libraries in existence.
- **Rust equivalent:** No production-grade drop-in Rust replacement exists.
- **Translation difficulty:** Very High. Massive codebase, XPath engine, XSLT support, schema validation, custom memory allocator, global state, thread safety issues.
- **Value:** **The moon shot.** Successfully translating libxml2 would be the definitive proof that AI-assisted C→Rust works at scale. This is the DARPA TRACTOR demo target.

### 11. libtiff — TIFF Image Library
- **LOC:** ~25,000
- **Why:** Used by medical imaging, GIS, publishing, and scanning software. Processes complex, untrusted binary data.
- **CVE history:** **Severe.** 100+ CVEs. Heap buffer overflows, integer overflows, out-of-bounds reads. Regularly exploited in attacks targeting image processing pipelines.
- **Rust equivalent:** `tiff` crate exists but limited. No drop-in replacement.
- **Translation difficulty:** Medium-High. Complex binary format parsing, multiple compression codecs, big/little endian handling.
- **Value:** Strong target for medical/defense verticals where TIFF processing is mandatory and security is critical.

### 12. SQLite — Embedded Database
- **LOC:** ~150,000 (single file: `sqlite3.c`)
- **Why:** The most widely deployed database engine in the world. In every phone, every browser, every operating system.
- **CVE history:** Multiple critical CVEs despite extensive fuzzing and testing (SQLite has its own massive test suite).
- **Rust equivalent:** No production-grade Rust reimplementation exists (there are wrappers like `rusqlite` via FFI).
- **Translation difficulty:** **Extreme.** Virtual machine, B-tree implementation, WAL journal, custom memory allocator, extensive use of unions and casts, amalgamation build.
- **Value:** The ultimate boss fight. Not a Phase 3 target — more like Phase 4 or a standalone funded project. But if Ferrous Bridge can translate SQLite, the market is won.

---

## Recommended Attack Sequence

```
Month 1-2:   jsmn (500 LOC)         ← Prove the pipeline compiles
Month 2-3:   sds (1.2K LOC)         ← Prove ownership inference
Month 3-4:   http-parser (2.5K LOC) ← Prove callback→closure idiom
Month 4-5:   cJSON (3K LOC)         ← Prove recursive structures
Month 5-7:   libyaml (8K LOC)       ← First real-world impact (improves serde_yaml)
Month 7-9:   libexpat (15K LOC)     ← Security credibility (40+ CVEs eliminated)
Month 9-12:  libpng (30K LOC)       ← Solve longjmp, prove image processing
Month 12-14: libxml2 (100K LOC)     ← Flagship demo for DARPA/enterprise
Month 18+:   SQLite (150K LOC)      ← The endgame
```

---

## Training Data Extraction from Existing Rewrites

Use completed C→Rust rewrites as training data. These are gold:

| C Original → Rust Rewrite | Function Pairs (est.) | Quality |
|---|---|---|
| OpenSSL → Rustls | 2,000–3,000 | High (different architecture, need alignment) |
| sudo → sudo-rs | 500–800 | Very High (intentional port) |
| ntpd → ntpd-rs | 300–500 | Very High |
| BIND → Hickory DNS | 1,000–2,000 | Medium (clean-room, not translation) |
| zlib → zlib-rs | 500–1,000 | **Highest** (Trifecta explicitly ports from C) |
| bzip2 → libbzip2-rs | 300–500 | **Highest** |
| AV1 (dav1d) → rav1d | 2,000–4,000 | High |
| C2Rust unsafe output → manual safe-ification | 10,000+ possible | Medium (requires verification) |

**Total estimated high-quality training pairs: 15,000–25,000 from natural sources alone.** Combined with synthetic generation via Claude, target 100K+ verified pairs for fine-tuning.

---

## The Strategic Pick: libyaml

If I had to pick ONE target to build credibility fastest, it's **libyaml**:

1. **Immediate Rust ecosystem impact.** `serde_yaml` — the most popular YAML library in Rust — currently depends on `unsafe-libyaml`, which is a line-by-line unsafe Rust port of the C code. Replacing it with safe Rust immediately improves thousands of Rust projects.

2. **Right-sized complexity.** 8K LOC is large enough to be impressive, small enough to be achievable in Phase 2.

3. **Real CVE history.** Buffer overflows and heap overflows that would be eliminated by a safe Rust translation.

4. **Kubernetes/DevOps ubiquity.** Every Kubernetes manifest, every Ansible playbook, every CI/CD pipeline config is YAML. Translating the parser that powers all of this is a story that writes itself.

5. **Existing unsafe port as scaffold.** `unsafe-libyaml` already exists — we can use it as an intermediate step (C → unsafe Rust → safe Rust) which is exactly the C2Rust safe-ification pipeline in the Ferrous Bridge architecture.

**First demo: jsmn (proves pipeline works). First credibility target: libyaml (proves it matters).**
