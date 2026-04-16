---
platform: linkedin
topic: c
title: "The C Language as a Translation Source: Semantics, Undefined Behavior, and the libyaml Idiom Set"
status: draft
---

C does not require programmers to state their invariants. The compiler does not check them. And when they are violated, the result is not a compile error — it is a CVE. This is the root of the problem that any serious C-to-Rust migration effort must solve before writing a single line of Rust.

Part I of the Ferrous Bridge series addresses this problem directly. We give a small-step operational semantics for the translation-relevant fragment of C (stores, provenance-bearing pointers, sequence points, indeterminate values) and organise the C standard's undefined behaviour into seven classes — spatial memory safety, temporal memory safety, type-based aliasing, signed integer overflow, unsequenced modification, indeterminate reads, and data races. For each class, we identify the precise Rust type-system feature that statically forbids it: checked slice indexing, ownership and drop, the borrow checker's aliasing discipline, checked arithmetic, and the Send/Sync marker traits.

The paper then catalogues eleven concrete idioms found in libyaml — a library with over 90 million transitive downloads through serde_yaml — including the three-pointer yaml_string_t, the STACK_*/QUEUE_*/STRING_* macro families, the integer-as-bool return convention, the tagged-union event type, custom allocator hooks, and scanner-into-parser buffer aliasing. For each idiom we state a formal translation contract: a typed inference rule specifying the Rust construct that faithfully replaces the C pattern and the proof obligation that must be discharged for the translation to be a semantic refinement.

These contracts are not theoretical exercises. They are the rule-set against which the Ferrous Bridge pipeline's Ownership Semantic Graph is built: every pointer annotation in the OSG corresponds to a discharged or undischarged contract side condition. The paper closes with a 29-task development plan for the analysis-phase agents that produce the C-Analysis Bundle. This work is Part I of a four-paper series; the companion papers treat the Rust target design, the transpilation process, and the full agent orchestration pipeline.

Paper: https://ferrous-bridge.vercel.app/papers/c
PDF: https://ferrous-bridge.vercel.app/pdf/c.pdf
GitHub: https://github.com/YonedaAI/ferrous-bridge

#Rust #SystemsProgramming #MemorySafety #C #Compilers #Verification #libyaml #AI
