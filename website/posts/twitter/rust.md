---
platform: twitter
topic: rust
title: "Idiomatic Safe Rust as a Translation Target: Ownership, Lifetimes, and ABI-Compatible Parser Design"
status: draft
---

1/4 What does idiomatic safe Rust look like for a streaming parser? Not just "no unsafe" — it's a precise engineering spec. We wrote it down for safe-libyaml. 🧵

https://ferrous-bridge.vercel.app/papers/rust

#Rust #MemorySafety #SystemsProgramming

2/4 The central design decision: Event<'a> with Cow<'a, str> payloads. Plain scalars borrow zero-copy from the input buffer. Escape-decoded scalars are Owned. The borrow checker enforces the lifetime invariant — no runtime cost, no unsafety.

3/4 Three operational definitions guide the whole crate: "safe" = no unsafe outside FFI shim + Miri-clean. "idiomatic" = Result everywhere, Option everywhere, enum for every tagged union. "ABI-compatible" = cbindgen diff against yaml.h is empty.

4/4 This is a design specification for safe-libyaml, not a report of a completed port. Performance targets are inherited from the manual libyaml-safer port by S. Ask. Full spec + 32-task agent build plan:

https://ferrous-bridge.vercel.app/papers/rust

#Compilers #libyaml #Rust
