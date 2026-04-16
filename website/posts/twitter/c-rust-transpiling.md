---
platform: twitter
topic: c-rust-transpiling
title: "Automated C → Rust Transpiling: From c2rust's Raw Lift to Safe, Idiomatic Rust via the Safety Ladder"
status: draft
---

1/5 c2rust solves compilation. It does NOT solve safety. unsafe-libyaml has every UB class the original C had — it's just relabeled with the word "unsafe". Here's how to actually climb the safety ladder. 🧵

https://ferrous-bridge.vercel.app/papers/c-rust-transpiling

#Rust #SystemsProgramming #MemorySafety

2/5 We formalize 6 refinement rungs: compile safety (rustc), memory safety (Miri/Stacked Borrows), behavioural safety (differential fuzzing), concurrency safety (Loom), refinement safety (Kani), ABI safety (cbindgen). Each rung implies all weaker ones.

3/5 12 refactoring patterns, each with c2rust output → target safe form. Example: the raw *mut T triple {start, end, pointer} → Vec<u8>. The decision rule comes from the Ownership Semantic Graph the pipeline builds.

4/5 We show a worked Kani proof for libyaml's STRING_EXTEND buffer-extension invariant, and a differential-fuzz harness that runs libyaml.so and safe-libyaml on the same bytes and compares event streams.

5/5 A 7-day, 5-agent schedule for translating libyaml (~9,300 LOC), plus the generalization to libexpat (~15,000 LOC, 40+ CVEs). Full paper + 36-task prototype plan:

https://ferrous-bridge.vercel.app/papers/c-rust-transpiling

#Compilers #Verification #C
