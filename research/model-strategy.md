# Decision: Model Strategy for the Ferrous Bridge C → Rust Pipeline

**Date:** 2026-04-16
**Status:** Recommendation (not yet ratified)
**Scope:** Which model(s) should drive the multi-agent transpilation pipeline (`safe-libyaml` first, `safe-libexpat` next).

---

## Question 1 — Are there two custom-built models trained specifically on C and Rust, or is a generalist code model the better choice?

**Recommendation: generalist, with per-agent specialisation on top.**

There aren't really two production-grade single-language models to reach for. The C/Rust-translation landscape today:

- **c2rust** — deterministic transpiler (not an LLM), already your Phase B raw lift.
- **Open-weight code models** (DeepSeek-Coder-V2, Qwen2.5-Coder, StarCoder2, Granite Code) — all multilingual; none are "C-only" or "Rust-only" checkpoints.
- **Frontier generalists** (Claude Opus 4.7, GPT-class, Gemini 2.5 Pro) — strongest current numbers on both languages and on the cross-language reasoning the task actually needs.
- **Research artifacts** (DARPA TRACTOR fine-tunes, VERT, CRUSt-style projects) — interesting but not turnkey, mostly paper-grade.

Even if a true "C model" and "Rust model" existed, splitting along the *language* axis is the wrong cut for this pipeline. Translation is fundamentally bilingual: the hard work — mapping C UB to Rust ownership, deciding `Vec<T>` vs `Box<[T]>` vs `&[T]`, recognising when a `STACK_*` macro becomes a `Vec` and when it becomes an iterator chain, knowing that a libyaml `yaml_string_t` triple is `Vec<u8>` not `String` — needs simultaneous fluency in both languages *and* in their relationship. A unilingual model on either side loses exactly the bridge information you're trying to capture. That's also why c2rust alone (essentially a "C-knowing rewriter") produces unsafe Rust: no Rust-target taste.

The right axis for specialisation in your pipeline is **by agent role**, not by language:

- `CABExtractor` / `IdiomDetector` → C-reading prompts; retrieve K&R + the UB taxonomy from Paper I.
- `RustScaffolder` / `RustEmitter` / `IdiomRefactorer` → Rust-writing prompts; retrieve the Nomicon + Miri docs + Paper II's safe-Rust rubric.
- `TransitionRefactorer` / `RungVerifier` → cross-language reasoning; retrieve the six-rung safety-ladder definitions.

All running on the **same generalist backbone**, distinguished by **prompt + retrieval + tool grounding** (rustc, Miri, Kani, cargo-fuzz, cbindgen). Verification is deterministic anyway — the model orchestrates and interprets reports; the tools provide ground truth.

**For libyaml specifically:** ~9K LOC fits comfortably in a 1M-context window, the idiom set is well-represented in frontier training data, and the pipeline is one-shot per library, so API economics aren't a constraint. Frontier generalist wins on quality with near-zero operational overhead.

**When the calculus would shift:**

- Translating thousands of crates → self-hosted Qwen2.5-Coder or DeepSeek-Coder fine-tuned on safety-ladder transition pairs becomes cost-attractive.
- A hard correctness requirement on a specific transition → a small surgical fine-tune on *that transition* (e.g., `*mut T → &mut T` lifetime-elision rewrites), still not on a single language.
- Air-gapped or sovereignty constraints → open-weight multilingual code model + tool grounding.

**Net:** one generalist backbone, ten agent prompts, deterministic tools at the rungs. Don't bifurcate by language.

---

## Question 2 — What about a `C(model) → General(Claude transpiler) → Rust(model)` three-stage architecture?

**Right pipeline shape, but it doesn't need three separate models.**

What's drawn here is the classic encoder → translator → decoder architecture (early NMT used it, ~2017; modern NMT collapsed it into one shared-parameter model because the cross-language reasoning is what matters). For C → Rust the same lesson applies — and importantly, the synthesis paper already has the *staged* architecture being described. The question is whether each stage needs its own checkpoint, or whether one generalist with stage-specific context wins.

### You already have the staged pipeline

```
C source
   ├── c2rust ───────────────► raw unsafe Rust   (deterministic, no model)
   ├── CABExtractor ─────────► CAB                (typed protobuf)
   ├── OSGProducer ──────────► OSG                (typed protobuf)
   └── TransitionRefactorer ─► rung-N Rust         (consumes c2rust + CAB + OSG)
```

Each agent is a stage. The handoffs are typed artifacts (CAB / OSG / RustScaffold / RustUnit), not free-form text — so information doesn't degrade across boundaries.

### Why one model + three agent prompts beats three model checkpoints

1. **The hardest work is in the middle.** The bridge stage decides `*mut T → &mut T` vs `Box<T>` vs `Rc<RefCell<T>>`, maps a `STACK_PUSH` macro to a `Vec::push` plus a panic-vs-error-result choice, decides whether two C pointers are in an aliasing relationship that Rust forbids. This is bilingual reasoning. A C-only model can't see what matters; a Rust-only model can't see why the input has the shape it does. So the middle stage *must* be a strong generalist anyway. Once you've paid for that, the marginal value of specialised flanks is small.

2. **Compounding error.** Three 95%-accurate stages → ~86% end-to-end. One 95%-accurate stage → 95%.

3. **Specialisation without specialised weights.** Stage-specific prompts + retrieval (K&R + UB taxonomy for the C agent, Nomicon + Miri for the Rust agent, safety-ladder rubric for the bridge) get you 90% of the value with one model and zero infra cost.

4. **c2rust already plays the role of the "C-side decoder."** It produces typed Rust IR deterministically. Adding an LLM in front of it duplicates work; the LLM's job is what comes *after* c2rust.

### When the three-checkpoint version wins

- Air-gapped / sovereignty constraint → open-weight per stage (Qwen2.5-Coder for the C reader, DeepSeek-Coder-V2 fine-tuned for the Rust emitter, generalist for the bridge).
- Translating thousands of libraries → fine-tune a small Rust-emitter on safety-ladder transition pairs and let it handle the bulk-rewrite step at low cost.
- A specific transition is the bottleneck (e.g., `*mut → &mut` lifetime elision) → surgical fine-tune on *that transition pair*, not on the whole language.

For libyaml-then-libexpat, none of these conditions hold. Stick with the staged DAG already in the synthesis paper, run all agents on Claude, specialise via **prompt + retrieval + tool grounding**.

---

## Combined recommendation

| Axis | Choice |
|---|---|
| Backbone model | **Frontier generalist** (Claude Opus 4.7, 1M context) for all agents |
| Specialisation mechanism | **Prompt + retrieval per agent role** (not per language, not per checkpoint) |
| Pipeline shape | **Staged DAG already in synthesis paper** (CAB → OSG → RustScaffold → safety ladder) |
| Determinism anchors | **c2rust, rustc, Miri, Kani, cargo-fuzz, cbindgen** — tools provide ground truth, model interprets |
| When to revisit | At >1000-library scale, or under air-gap / sovereignty constraint, or after identifying a specific transition that warrants a surgical fine-tune |

The staged-pipeline intuition is correct and is already encoded in the architecture. The lesson from a decade of NMT is: **shared-parameter models beat split-checkpoint pipelines** for translation tasks, because cross-attention across the language boundary is where translation quality lives.
