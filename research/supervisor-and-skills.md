# Decision: Supervisor and Skill Architecture for the Ferrous Bridge Pipeline

**Date:** 2026-04-16
**Status:** Recommendation (not yet ratified)
**Scope:** Whether the agent supervisor should be a custom LLM-driven component, and whether each of the ten pipeline agents needs its own custom skill set.

---

## Short answer

A **thin deterministic orchestrator script**, not a custom LLM supervisor; and a **shared skill catalogue (~8 skills)**, not custom skills per agent. Specialisation lives in **prompts and retrieval context**, not in heavy infra.

---

## Question 1 — Should the Subagent Supervisor be custom-built for the C → Rust pipeline?

### What the supervisor actually has to do

Factored from the synthesis paper:

| Job | LLM needed? |
|---|---|
| Walk the DAG (which agent runs next) | **No** — fixed topology |
| Validate each artifact against its protobuf schema | **No** — `protobuf.Message.ParseFromString` |
| Run rung-by-rung verification (`rustc`, Miri, Kani, fuzz, `cbindgen`-diff) | **No** — shell out, parse exit codes |
| Aggregate reports, sum tokens, enforce budget | **No** — ledger arithmetic |
| Detect retry conditions (e.g. C2 rejects a `BuildArtifact`) | **No** — threshold check |
| Triage a *novel* failure that doesn't match any retry policy | **Yes** — reasoning over a stack trace |

Roughly 95% of the supervisor's surface area is mechanical. Building a custom LLM-driven supervisor for it is a category error:

- You'd pay tokens on every routing decision.
- You'd add non-determinism to a DAG that's supposed to be auditable.
- You'd slow sub-second scheduling decisions to multi-second LLM round-trips.
- Critically, an LLM supervisor *can decide to skip a rung* — and the entire value proposition of the safety ladder is that no rung is skippable.

### Concrete shape — `pipeline.py`, ~300 LOC

```
pipeline.py
├── DAG = {A1 → A2 → B*, A1 → A3, B* → C1 → {C2,C3,C4,C5}, …}
├── for each ready node:
│     spawn_claude_code_subagent(node.role, inputs=node.inputs)
│     parsed = protobuf.parse(stdout, schema=node.output_schema)
│     ledger.record(node, tokens, cost)
│     if rung := node.rung_check:
│         result = run_skill(rung, parsed)        # deterministic
│         if not result.ok: queue_retry(node)
└── on Nth retry: spawn TriageAgent (this *is* an LLM call)
```

- Use **Claude Code subagents** as the worker substrate (`Agent` tool with a custom `subagent_type` per role, or shell out to `claude code --agent <role> --input artifact.pb`).
- Use **plain Python** as the supervisor.
- Reserve LLM use for the triage path.

### When the calculus would shift

- Running the pipeline continuously across hundreds of libraries → swap the script for a durable workflow engine (Temporal, Inngest, Prefect). Still **not** an LLM supervisor — a *durable executor*.
- A regulated environment requiring step-by-step explainability → keep the deterministic supervisor; it is exactly the explainable component.
- Per-tenant customisation needed → templated DAG definitions in YAML, loaded by the same script.

For libyaml and libexpat, a script is correct.

---

## Question 2 — Do we need custom skills for each agent supervised by the subagent?

**No.** Build a **shared skill catalogue** that every agent draws from. Skills are for *deterministic operations the LLM should not re-derive each call*; they belong to the pipeline, not to any one role.

### Reasonable catalogue (~8 skills, each ~30–80 LOC)

| Skill | Used by | Wraps |
|---|---|---|
| `compile-rust` | B1–B5, C1 | `rustc -D warnings`; parses diagnostics |
| `run-miri` | C1, C2 | `cargo +nightly miri test`; returns `MiriReport` proto |
| `run-fuzz` | C3 | AFL++ / `cargo-fuzz` differential against C libyaml; returns `FuzzReport` |
| `run-kani` | C4 | Kani harness invocation; returns `KaniProof` |
| `cbindgen-diff` | C5 | `cbindgen` output vs original `yaml.h`; returns `ABISignature` delta |
| `c-extract-fn` | A1, A2 | clang AST query for one function's source |
| `validate-artifact` | supervisor + every agent | protobuf schema validation; returns `(ok, errors[])` |
| `safety-ladder-step` | supervisor | runs the next unmet rung; returns rung-pass/fail |

### Why shared, not per-agent

- **Single source of truth.** When the toolchain changes (a `rustc` flag tweak, a Miri version bump, a new Kani flag), you edit *one* skill. With per-agent skills, you edit five and watch drift accumulate.
- **Composition.** B1 ("translate scanner") and B3 ("translate parser") need exactly the same `compile-rust` invocation. Duplicating it across them is drift waiting to happen.
- **Auditability.** Every Miri run goes through one code path → one log format → one ledger entry.
- **Prompt-level specialisation is enough for the rest.** Each agent's "personality" — what to look for in C, which Rust patterns to favour, which UB classes to flag — is encoded in its **system prompt + retrieval context**, not in custom skill code. An agent's prompt can include "always finish by calling `compile-rust`; if it fails, reread the diagnostic and revise" — that's behavioural specialisation without a custom skill.

### When per-agent skills *would* be the right call

- An agent needs a tool that genuinely no other agent uses (e.g., a parser-specific aliasing analyser used only by B-Parser).
- A skill needs different default parameters per agent and the parameter surface is large enough that wrapping it once-per-agent is clearer than passing the params every call.
- An agent runs in an isolated security context with restricted tool access (then the skill is part of the agent's sandbox profile).

For libyaml: none of these conditions hold for the ten DAG agents.

---

## The right mental model

| Layer | What it does | Where it lives |
|---|---|---|
| **Skill** | Mechanical, reused operation | Shared catalogue |
| **Prompt + retrieval** | Agent personality and domain context | Per-agent prompt file |
| **Supervisor code** | DAG flow control, validation, ledger | `pipeline.py` |
| **Triage LLM call** | Novel-failure reasoning | Spawned by supervisor on Nth retry |

Custom infrastructure is justified only when one of those four boxes is genuinely under-served. For libyaml and libexpat, none are.

---

## Combined recommendation

| Axis | Choice |
|---|---|
| Supervisor implementation | **Plain Python script** (~300 LOC) owning the DAG; spawns Claude Code subagents; runs deterministic skills; escalates novel failures to a triage LLM call |
| Skill packaging | **Shared catalogue** of ~8 skills covering compile, Miri, fuzz, Kani, cbindgen-diff, source extraction, schema validation, safety-ladder stepping |
| Per-agent specialisation | **System prompt + retrieval context** per agent role (no custom skill code) |
| Worker substrate | **Claude Code subagents** invoked by role from the supervisor |
| When to revisit | Continuous translation across hundreds of libraries → durable workflow engine; regulated environment → keep deterministic supervisor as the explainability anchor |

### Rule of thumb

- Mechanical and reused → **skill**
- Agent-specific reasoning → **prompt + retrieval**
- Flow control → **deterministic supervisor code**
- Novel failure mode → **escalate to a triage LLM call**
