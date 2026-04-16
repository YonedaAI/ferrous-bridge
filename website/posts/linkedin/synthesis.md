---
platform: linkedin
topic: synthesis
title: "Ferrous Bridge: A C → Rust Automated Agent Orchestration Pipeline with Type Checks and Safety Guarantees"
status: draft
---

The dominant approach to AI agent orchestration treats correctness as an end-to-end concern: you run the pipeline, inspect the output, and check whether it is right. For high-assurance software translation — migrating security-critical C libraries to safe Rust — this framing is exactly wrong. You cannot afford to discover that the output is wrong after it has been published as a crate backing 90 million downloads.

Ferrous Bridge takes a different approach: orchestration as a typing problem. Each of the pipeline's ten agents is modelled as a morphism between typed artifact schemas. The Claude Code subagent supervisor — built on Claude Code's actual subagent mechanism, not a fictional orchestrator — validates artifact schemas at every hand-off. A stage whose input fails schema validation is refused, and a structured SchemaMismatch error is routed to the human-review queue. This is the same discipline Rust's type system imposes on function calls, applied at the level of an AI agent workflow.

The pipeline produces a safe Rust crate that satisfies six formally defined safety rungs: compile safety (rustc), memory safety (Miri, Stacked Borrows), behavioural safety (differential fuzzing with AFL++), concurrency safety (Loom), refinement safety (Kani bounded model checking), and ABI safety (cbindgen header diff). The synthesis paper presents an informal composition theorem stating that a crate satisfying all six rungs is observationally equivalent to the original C library and free of all seven undefined-behaviour classes enumerated in Part I of the series. We are explicit that this theorem is informal, not a formal proof — the safety ladder is justified by the verification oracles, not by a mechanised proof of the composition.

The pipeline is instantiated on libyaml (projected 7 working days, $85–$240 in Claude API costs) and on libexpat (8–10 days), demonstrating that the library-agnostic DAG requires only targeted additions for a second target. An appendix provides a 38-task development plan for the orchestration layer itself — the protobuf artifact schemas, the typed message bus, the workflow DAG executor, the telemetry surface, and the ferrous-bridge run CLI — granular enough to be executed by a team today.

Paper: https://ferrous-bridge.vercel.app/papers/synthesis
PDF: https://ferrous-bridge.vercel.app/pdf/synthesis.pdf
GitHub: https://github.com/YonedaAI/ferrous-bridge

#Rust #AI #SystemsProgramming #MemorySafety #ClaudeCode #Compilers #Verification #libexpat
