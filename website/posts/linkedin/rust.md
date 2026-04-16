---
platform: linkedin
topic: rust
title: "Idiomatic Safe Rust as a Translation Target: Ownership, Lifetimes, and ABI-Compatible Parser Design"
status: draft
---

When migrating a C library to Rust, the hardest question is not "how do we translate this line of code?" It is "what should the target look like?" Without a precise answer, automated translation has no success criterion, and human review has no benchmark. Part II of the Ferrous Bridge series answers this question concretely for streaming parser libraries.

We provide a design specification for safe-libyaml: three operational definitions of what "safe," "idiomatic," and "ABI-compatible" mean as engineering targets, not marketing claims. Safe means zero unsafe blocks outside a thin FFI shim and a clean run under Miri's Stacked Borrows interpreter. Idiomatic means Result everywhere integer error codes appear, Option everywhere nullable pointers appear, enum for every tagged C union, iterator adaptors where C uses index loops, and no suppressed Clippy lints. ABI-compatible means a cbindgen-generated header that diffs to empty against the original yaml.h.

The central design decision in the paper is the lifetime-parameterised Event<'a> enum with Cow<'a, str> payloads. Plain scalars borrow zero-copy from the input buffer; escape-decoded scalars carry an owned String. The Rust borrow checker enforces that a borrowed event cannot outlive the input — no runtime bookkeeping, no unsafe, no copying when copying is unnecessary. We prove a soundness proposition for this design and provide an OwnedEvent escape hatch for contexts where the lifetime parameter becomes unwieldy, such as multi-threaded pipelines or serde-style deserializers.

This paper is a specification, not a report of a completed implementation. Performance targets are inherited from libyaml-safer, a one-week manual safe port by S. Ask that demonstrates the exercise is feasible. The Ferrous Bridge pipeline's goal is to reproduce that quality automatically. A 32-task agent-level build plan is included, demonstrating implementability of the design. Engineers building Rust parser libraries, designing safe FFI boundaries, or evaluating automated migration tooling will find the design rules directly applicable beyond the libyaml case.

Paper: https://ferrous-bridge.vercel.app/papers/rust
PDF: https://ferrous-bridge.vercel.app/pdf/rust.pdf
GitHub: https://github.com/YonedaAI/ferrous-bridge

#Rust #SystemsProgramming #MemorySafety #Compilers #libyaml #AI #Verification
