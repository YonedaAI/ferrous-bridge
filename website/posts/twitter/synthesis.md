---
platform: twitter
topic: synthesis
title: "Ferrous Bridge: A C → Rust Automated Agent Orchestration Pipeline with Type Checks and Safety Guarantees"
status: draft
---

1/5 What if translating C → safe Rust were a *typed* build system, not a prompt chain? Ferrous Bridge: 10 agents, 11 artifact types, a typed DAG, and a Claude Code subagent supervisor that refuses to run a stage whose input fails schema validation. 🧵

https://ferrous-bridge.vercel.app/papers/synthesis

#AI #Rust #SystemsProgramming

2/5 The supervisor IS Claude Code subagents — not a fictional orchestrator. Each agent is a morphism A: In → Out. Composition is well-typed iff Out_i = In_{i+1}. The supervisor is rustc for the pipeline. Schema mismatch → SchemaMismatch error → human queue.

3/5 The 6-rung safety ladder (rustc → Miri → AFL++ → Loom → Kani → cbindgen) composes into an informal theorem: an artifact that climbs all 6 rungs is observationally equivalent to the C original and free of all 7 UB classes from Part I.

4/5 Instantiated on libyaml: 7 days, $85–$240 Claude API cost (projected). Same DAG, same agents, same schemas → libexpat in 8–10 days. The DAG is library-agnostic; only the seed corpus and type contracts are library-specific.

5/5 38-task dev plan for the orchestration layer itself: protobuf schemas, typed message bus, DAG executor, telemetry, ferrous-bridge run CLI.

https://ferrous-bridge.vercel.app/papers/synthesis
GitHub: https://github.com/YonedaAI/ferrous-bridge

#ClaudeCode #Compilers #MemorySafety
