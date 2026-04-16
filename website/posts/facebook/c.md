---
platform: facebook
topic: c
title: "The C Language as a Translation Source: Semantics, Undefined Behavior, and the libyaml Idiom Set"
status: draft
---

Did you know that the YAML parser underneath a huge chunk of the Rust ecosystem — serde_yaml and its forks — has been downloaded over 90 million times, and it is still written in unsafe Rust? 🔍

Here is why that matters, and why fixing it is harder than it looks.

C does not require programmers to write down their assumptions. When you write a C struct with three pointers, there is no part of the language that enforces which pointer is allowed to go past which boundary. The programmer knows the rule. The compiler does not. And when someone forgets the rule — or a compiler optimization exploits the gap — you get a security vulnerability.

Our first Ferrous Bridge research paper, Part I of a four-paper series, does something practical: it makes those hidden assumptions EXPLICIT. We define 7 classes of undefined behavior in C — things like reading past the end of a buffer, using memory after freeing it, or modifying the same variable twice without a sequence point between — and for each one we identify the exact Rust language feature that makes the same mistake impossible to write.

We also catalogued 11 specific patterns in libyaml (the YAML library at the heart of all this) and wrote formal "translation contracts" — rules that say "if you see this C pattern, and you can verify these conditions, then this Rust equivalent is a provably faithful replacement."

This is the foundation. The next three papers in the series build the automated pipeline on top of it.

Read the paper here: https://ferrous-bridge.vercel.app/papers/c
PDF: https://ferrous-bridge.vercel.app/pdf/c.pdf
Source: https://github.com/YonedaAI/ferrous-bridge

#Rust #SystemsProgramming #MemorySafety #OpenSource #Research
