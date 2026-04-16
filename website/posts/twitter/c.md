---
platform: twitter
topic: c
title: "The C Language as a Translation Source: Semantics, Undefined Behavior, and the libyaml Idiom Set"
status: draft
---

1/5 libyaml has 90M+ transitive downloads via serde_yaml. Its Rust port is still pervasively unsafe. Why? Because C hides contracts the compiler never checks. We catalogued them. 🧵

https://ferrous-bridge.vercel.app/papers/c

#Rust #SystemsProgramming #MemorySafety #C

2/5 We define 7 UB classes that account for nearly every C CVE: spatial safety, temporal safety, TBAA aliasing, signed overflow, unsequenced modification, uninit reads, and data races — each mapped to the exact Rust feature that statically forbids it.

3/5 libyaml's yaml_string_t is a manual {start, end, pointer} triple. No compiler-checked invariant that pointer stays in [start, end]. One of 11 idioms we catalogued, each with a formal translation contract mapping it to its Rust equivalent.

4/5 Each translation contract is an inference rule: "if this C idiom is observed AND these side conditions are discharged, THEN this Rust construct is a faithful refinement." The analysis pipeline discharges the obligations.

5/5 Full paper + 29-task agent dev plan for the C analysis phase (CAB):

https://ferrous-bridge.vercel.app/papers/c
PDF: https://ferrous-bridge.vercel.app/pdf/c.pdf

GitHub: https://github.com/YonedaAI/ferrous-bridge

#Compilers #Verification #Rust
