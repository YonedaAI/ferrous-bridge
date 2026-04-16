---
platform: bluesky
topic: c-rust-transpiling
title: "Automated C → Rust Transpiling: From c2rust's Raw Lift to Safe, Idiomatic Rust via the Safety Ladder"
status: draft
---

c2rust compiles. It doesn't make things safe. We formalize 6 rungs (rustc→Miri→fuzz→Loom→Kani→cbindgen) + 12 refactor patterns: unsafe-libyaml → safe idiomatic Rust.

https://ferrous-bridge.vercel.app/papers/c-rust-transpiling

#Rust #SystemsProgramming #MemorySafety
