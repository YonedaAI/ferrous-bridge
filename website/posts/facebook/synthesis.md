---
platform: facebook
topic: synthesis
title: "Ferrous Bridge: A C → Rust Automated Agent Orchestration Pipeline with Type Checks and Safety Guarantees"
status: draft
---

What if you could take a C library and automatically produce a safe, verified Rust replacement — with a paper trail proving every step was correct? 🤖

That is what Ferrous Bridge is building. And our synthesis paper describes the whole system.

Here is the core idea. We treat the entire translation process as a pipeline of AI agents — 10 agents in total, each one responsible for a specific job. One agent analyzes the C source code. Another builds the scaffold for the Rust crate. Several agents handle different parts of the actual translation. Others verify the result using different tools: a memory checker, a fuzz tester, a formal verification tool, and a compatibility checker.

What makes this different from just chaining AI prompts together is that every handoff between agents is TYPE CHECKED. Each agent produces output in a specific format — defined by a machine-readable schema — and the next agent's input has to match exactly. If it does not match, the pipeline stops and asks a human to review. This is orchestrated using Claude Code subagents — the actual Claude Code tool, not something invented for this paper.

We are honest about one thing: the main theorem in the paper — that a pipeline completing all six verification steps produces a result equivalent to the original C — is an INFORMAL theorem. It is justified by the verification tools, not by a formal mathematical proof. We think that is the right tradeoff for a system at this stage, and we say so plainly.

The projected cost to run the pipeline on libyaml is between $85 and $240 in AI API costs, in about 7 working days. We also show how the same pipeline applies to libexpat, a different C library, with only targeted changes.

Read the full paper: https://ferrous-bridge.vercel.app/papers/synthesis
PDF: https://ferrous-bridge.vercel.app/pdf/synthesis.pdf
Source: https://github.com/YonedaAI/ferrous-bridge

#Rust #AI #MemorySafety #SystemsProgramming #OpenSource #Research
