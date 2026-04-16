---
platform: linkedin
topic: c-rust-transpiling
title: "Automated C → Rust Transpiling: From c2rust's Raw Lift to Safe, Idiomatic Rust via the Safety Ladder"
status: draft
---

c2rust solves the compilation problem. It does not solve the safety problem. Immunant's tool can mechanically rewrite any C translation unit into Rust that compiles and preserves the original ABI — but the output is pervasively unsafe: raw pointer arithmetic, manual bounds checks, integer-coded error returns, tagged unions accessed by hand. The unsafe-libyaml crate, backing 90+ million downloads of serde_yaml, retains every undefined-behaviour class the original C admits. The word "unsafe" appears in the output, but the guarantees are unchanged.

Part III of the Ferrous Bridge series formalises the gap between c2rust's raw lift and idiomatic safe Rust as a safety ladder: a chain of six refinement relations indexed by an increasingly strong verification regime. Rung 1 is compile safety, established by rustc with -D warnings. Rung 2 is memory safety, established by Miri under the Stacked Borrows aliasing model. Rung 3 is behavioural safety, established by a differential-fuzz harness that runs libyaml and safe-libyaml on the same inputs and compares event streams. Rung 4 is concurrency safety via Loom and cargo-careful. Rung 5 is refinement safety via Kani's bounded model checker — we include a worked proof of libyaml's STRING_EXTEND buffer-extension invariant. Rung 6 is ABI safety, confirmed by a cbindgen diff against the original C header.

We catalogue twelve refactoring patterns, each expressed as a transform from c2rust output to the target safe form, derived from a direct inspection of unsafe-libyaml against the manual safe port libyaml-safer. These patterns cover the raw-pointer triple to Vec<u8>, index loops to iterator adaptors, tagged C unions to Rust enums, integer error returns to Result<T,E>, and more. Each pattern is justified by a refactoring-soundness lemma: the transform preserves observable behaviour modulo the side condition that the Ownership Semantic Graph provides.

The methodology is validated by a 7-day, 5-agent translation schedule for libyaml (~9,300 LOC, 175 functions), and then extended to libexpat (~15,000 LOC, 40+ CVEs), demonstrating that the same ladder applies to a second library with only targeted additions (entity-expansion depth limits, namespace separator validation). A 36-task prototype development plan is included in the appendix.

Paper: https://ferrous-bridge.vercel.app/papers/c-rust-transpiling
PDF: https://ferrous-bridge.vercel.app/pdf/c-rust-transpiling.pdf
GitHub: https://github.com/YonedaAI/ferrous-bridge

#Rust #SystemsProgramming #MemorySafety #C #Compilers #Verification #AI #libexpat
