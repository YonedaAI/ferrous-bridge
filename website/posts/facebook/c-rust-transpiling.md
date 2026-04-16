---
platform: facebook
topic: c-rust-transpiling
title: "Automated C → Rust Transpiling: From c2rust's Raw Lift to Safe, Idiomatic Rust via the Safety Ladder"
status: draft
---

There is a tool called c2rust that can automatically translate C code into Rust. It is impressive engineering. But here is the catch: the output still has all the same memory bugs. It just has the word "unsafe" written next to them now. 🪜

Our third Ferrous Bridge paper tackles the question: once you have that mechanical translation, how do you actually MAKE it safe?

The answer we propose is a "safety ladder" — a series of six steps, each one adding a stronger guarantee than the step before.

Step 1 is getting it to compile with strict Rust settings. Step 2 is running it under Miri, a tool that interprets Rust programs and catches memory errors at runtime. Step 3 is differential fuzzing — running millions of random inputs through BOTH the original C library and the new Rust version simultaneously, checking that they produce identical output. Step 4 adds checking for concurrency bugs. Step 5 uses a formal verification tool called Kani to PROVE specific safety properties mathematically. Step 6 confirms that the Rust version exposes the exact same interface as the original C library, so existing programs can swap it in without changes.

We show 12 specific refactoring patterns — concrete code transformations that move from the raw c2rust output up toward safe idiomatic Rust. Things like replacing a raw three-pointer buffer struct with Rust's Vec type, or replacing C's integer error returns with Rust's Result type.

We also give a day-by-day 7-day schedule for translating libyaml (about 9,300 lines of C across 10 files), and show how the same approach applies to libexpat — a different C parser with over 40 known security vulnerabilities in its history.

Read the paper: https://ferrous-bridge.vercel.app/papers/c-rust-transpiling
PDF: https://ferrous-bridge.vercel.app/pdf/c-rust-transpiling.pdf
Source: https://github.com/YonedaAI/ferrous-bridge

#Rust #MemorySafety #SystemsProgramming #OpenSource #Research
