---
reviewer: gemini-2.5-pro
paper: c-rust-transpiling
round: 1
date: 2026-04-16T18:18:54Z
---

(node:7290) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
(node:7309) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.
(Use `node --trace-deprecation ...` to show where the warning was created)
Loaded cached credentials.
To the authors,

This paper presents a "safety ladder" formalism for migrating C code to idiomatic, safe Rust, using `c2rust` as a starting point. It details a verification strategy for each rung of the ladder and provides a concrete case study on `libyaml`, complete with a proposed 7-day, multi-agent translation schedule and a detailed development plan. The core idea of structuring the C→Rust migration as a series of verifiable refinement steps is a valuable contribution to this problem space. The paper is well-written, ambitious, and impressively detailed, particularly in its appendices.

However, there are several significant issues regarding the credibility of the proposed timeline and the formal strength of the verification claims that must be addressed before publication.

**VERDICT: MAJOR REVISIONS**

---

### Critical Feedback

1.  **The 7-Day Timeline is Not Credible:** The proposed 7-day schedule for a project of `libyaml`'s complexity ($\sim$9,300 LOC) is extremely optimistic, even for a team of AI agents. This aggressive timeline undermines the practical, reproducible claims of the paper.
    *   **Day 5 (Scanner sections 4, 5; parser begins):** This day allocates two agents to translating over 1,400 lines of the most complex parts of the library. Section 5 of the C scanner (`scan_scalar`), which handles all forms of scalar parsing, is notoriously difficult and full of edge cases. To complete this, the block token logic (Section 4), *and* begin the parser state machine on the same day is not believable.
    *   **Day 7 (Emitter, Dumper, Full Verification):** This day is massively overloaded. It includes finishing the complex emitter logic, translating the dumper, and then conducting the entire verification suite: Miri audit, Kani proofs for critical functions, differential fuzzing for a CPU-hour (not including harness setup/debugging), and performance benchmarking. Each of these verification tasks is non-trivial. For example, writing correct Kani harnesses requires careful thought about preconditions and postconditions, and triaging a single fuzzing-discovered divergence can take hours. Piling all of this onto the final day seems like a recipe for failure.
    *   **Recommendation:** The paper must either (a) provide strong empirical evidence that this speed is achievable, perhaps with data from the "dry runs" mentioned in Section 9.4, or (b) revise the schedule to a more realistic 10-14 day timeline. A more credible schedule would strengthen, not weaken, the paper's contribution.

2.  **Overstatement of Formal Guarantees:** The paper uses the language of formal methods (e.g., "Theorem," "Proof," refinement "$\sqsubseteq$") to describe guarantees that are empirical and non-exhaustive. This misrepresents the strength of the claims.
    *   **Behavioural Safety ($\sqsubseteq_{\mathrm{behav}}$) and Differential Fuzzing (Thm. 5.2):** Calling differential fuzzing a "proof" of semantic equivalence is incorrect. It is a powerful testing technique for finding divergences, but it provides a statistical, not a logical, guarantee. Theorem 5.2 should be recast as a "Proposition" or "Empirical Claim." The statement `Pr[...] <= epsilon` should be explicitly framed as an *empirical observation* on a test distribution, not a property of all possible inputs. The current framing could mislead readers into believing the resulting code is proven equivalent.
    *   **Memory Safety ($\sqsubseteq_{\mathrm{mem}}$) and Concurrency Safety ($\sqsubseteq_{\mathrm{conc}}$):** The definitions for these rungs rely on Miri and Loom. The paper should explicitly state that these tools perform *bounded* exploration. Miri only checks UB on paths exercised by the test suite, and Loom only checks a subset of possible thread interleavings. The guarantee is "no UB was found in the tested configurations," not "the program is free of UB." The formalism should reflect this limitation.

### Major Feedback

1.  **Selection of Critical Functions ($\mathcal{F}_{\mathrm{crit}}$):** In Section 6, the paper introduces the concept of proving function contracts for a "designated set of safety-critical functions," but it does not specify *how* this set is chosen. Is it based on heuristics, complexity, historical CVEs, or manual audit? The methodology is incomplete without a clear process for identifying these functions. The generalization to `libexpat` (Section 8) adds new functions to this set but again omits the selection rationale.

### Minor Feedback

1.  **Gantt Chart (Fig 7.1):** The "Compiler Fixer (continuous)" agent (C1) is a critical dependency for all other agents. The Gantt chart visualizes it as a parallel track, but in reality, it's a potential serial bottleneck. A B-agent cannot make progress if C1 is blocked on a complex lifetime issue. The discussion should acknowledge this.

2.  **Cost Estimate (Sec 9.5):** The estimate of USD $85-240$ in Claude tokens seems remarkably low for the sheer volume of code generation, iteration, and correction implied by the 36 tasks in Appendix A. This claim needs a citation or a more detailed breakdown of the token calculation to be credible.

3.  **`cbindgen` Check (App A.4):** The `diff` command provided for checking ABI safety is too naive. It will fail on benign differences like comments, whitespace, and declaration order. The paper correctly states the requirement is equivalence "up to whitespace and comments" (Def 3.7), but the provided CLI command does not implement this. A script that normalizes the headers before comparison would be necessary.

4.  **Undefined Terminology (Sec 9.4):** The paper mentions "RalphD's 'stuck detection' heuristic" without citation or explanation. This appears to be internal project jargon and should be defined or cited for an external audience.

---

In summary, this is a promising paper with a strong central idea and an impressive level of practical detail. By addressing the credibility of the timeline and being more precise about the nature of the verification guarantees, the authors can produce a significant and well-regarded contribution to the field.
