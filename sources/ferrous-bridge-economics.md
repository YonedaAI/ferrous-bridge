# Ferrous Bridge — Timeline, Economics & Payoff Model

## If This Can Be Automated, What's It Worth?

---

## The Numbers That Frame Everything

Three data points define the opportunity:

**Microsoft's north star:** "1 engineer, 1 month, 1 million lines of code"
— This is the target for AI-assisted translation. Today, without tooling, a skilled Rust developer manually rewrites roughly 1,000–3,000 LOC/month of C→Rust. Microsoft is targeting a **300–1,000x productivity multiplier.**

**The Great Refactor proposal (Institute for Progress):** $100 million to secure 100 million lines of critical open-source C code → $1/line at scale. They estimate this prevents ~$2 billion in cumulative cyberattack losses. **20:1 ROI on the investment.**

**The manual baseline:** The Linux kernel's partial Rust implementation required thousands of engineer-hours at Silicon Valley rates, running into millions of dollars for ~25,000 lines of Rust. That's **$40–100/line for manual, high-assurance rewriting.**

---

## Cost Model: Manual vs. Automated

### Manual C→Rust Rewriting

| Factor | Value |
|---|---|
| Senior Rust engineer salary (loaded) | $250K–400K/year |
| Productivity: simple code | 2,000–5,000 LOC/month |
| Productivity: complex systems code | 500–1,500 LOC/month |
| Productivity: security-critical (kernel, crypto) | 200–500 LOC/month |
| Effective cost per line (simple) | $4–15/line |
| Effective cost per line (complex) | $15–60/line |
| Effective cost per line (high-assurance) | $60–150/line |
| Verification overhead (testing, review, audit) | 30–50% additional |

### AI-Assisted (Ferrous Bridge at Maturity)

| Factor | Value |
|---|---|
| Claude API cost per function (complex) | $0.05–0.50 |
| Fine-tuned model cost per function (routine) | $0.001–0.01 |
| Average function size | ~30 LOC |
| Blended cost per line (translation only) | $0.01–0.10 |
| Verification compute (rustc + Miri + fuzz) | $0.005–0.05/line |
| Human review (spot-check, not line-by-line) | $0.10–0.50/line |
| **Total blended cost per line** | **$0.10–0.60/line** |
| Estimated throughput per engineer+AI | 50K–200K LOC/month |

### The Multiplier

| Metric | Manual | Automated | Multiplier |
|---|---|---|---|
| Cost per line (simple) | $4–15 | $0.10–0.30 | **30–50x cheaper** |
| Cost per line (complex) | $15–60 | $0.30–0.60 | **25–100x cheaper** |
| Engineer throughput | 1K–5K LOC/mo | 50K–200K LOC/mo | **30–100x faster** |
| Time to translate 100K LOC project | 6–18 months | 2–6 weeks | **10–30x faster** |
| Time to translate 1M LOC project | 5–15 years | 3–8 months | **20–50x faster** |

---

## Timeline: Target Library Attack Sequence

```
         Month
Target    1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16 17 18
─────────────────────────────────────────────────────────────────────
jsmn      ████                                                    
 500 LOC  ──▶ Pipeline proof

sds          ████                                                 
 1.2K LOC    ──▶ Ownership inference validated

http-parser     █████                                             
 2.5K LOC       ──▶ Callback→closure idiom

cJSON              █████                                          
 3K LOC            ──▶ Recursive structures, training data

libyaml                 ████████                                  
 8K LOC                 ──▶ FIRST REAL-WORLD IMPACT
                            serde_yaml dependency replaced

libexpat                         ████████                         
 15K LOC                         ──▶ 40+ CVEs eliminated
                                     Security credibility

libpng                                    ██████████              
 30K LOC                                  ──▶ longjmp solved
                                              Image processing proven

libxml2                                              █████████████
 100K LOC                                            ──▶ FLAGSHIP
                                                         DARPA demo
                                                         
SQLite                                                         ──▶
 150K LOC                                               (Month 18+)

Training    ░░░░░░░░░████████████████████████████████████████████
Data        heuristic  ML classifier    continuous fine-tuning
Pipeline    Phase 1    Phase 2          Phase 3+

FTM         ░░░░░░░░░░░░░░█████████████████████████████████████
(fine-tuned              first         v2        v3
 model)                  fine-tune     (50K      (100K+
                         (10K pairs)   pairs)    pairs)
```

---

## Revenue Model: By Phase

### Phase 1 (Months 1–3): Zero Revenue, Pure R&D

- **Investment needed:** $50K–100K (compute, Claude API, dev time)
- **Output:** Pipeline proof on 4 small libraries
- **Milestone:** Open-source release of fb-frontend + fb-cab

### Phase 2 (Months 4–8): First Revenue Possible

- **Investment needed:** $100K–200K (GPU for fine-tuning, expanded compute)
- **Output:** libyaml translated to safe Rust. Fine-tuned model v1.
- **Revenue opportunity:**
  - Consulting engagements with embedded/IoT companies: $15K–50K each
  - SBIR Phase I application (if applicable): $150K–250K
  - Conference talks + blog posts drive inbound interest
- **Estimated revenue:** $50K–200K

### Phase 3 (Months 9–14): Product Revenue

- **Investment needed:** $200K–400K (human review platform, Kani integration)
- **Output:** libexpat + libpng translated. Beta product.
- **Revenue streams:**

| Stream | Price | Volume | Annual Rev |
|---|---|---|---|
| Developer tier API | $500/mo | 20 customers | $120K |
| Professional tier | $5,000/mo | 5 customers | $300K |
| Enterprise pilots | $50K+ one-time | 3 engagements | $150K |
| DARPA subcontract | — | 1 | $200K–500K |
| **Phase 3 Total** | | | **$770K–1.1M** |

### Phase 4 (Months 15–24): Scale

| Stream | Price | Volume | Annual Rev |
|---|---|---|---|
| Developer tier | $500/mo | 100 customers | $600K |
| Professional tier | $5,000/mo | 20 customers | $1.2M |
| Enterprise | $50K+/mo | 5 customers | $3M+ |
| Defense contracts | custom | 2–3 | $1M–3M |
| Great Refactor FRO subcontract | — | possible | $1M–5M |
| **Phase 4 Total** | | | **$6M–12M ARR** |

### Phase 5 (Year 3+): Market Dominance

If the tooling reaches 90%+ accuracy on complex C codebases:

| Customer Segment | Deal Size | Volume | Annual Rev |
|---|---|---|---|
| Defense primes (Lockheed, Raytheon, etc.) | $500K–2M/yr | 5–10 | $5M–20M |
| Enterprise (Microsoft, Google, Meta, Amazon) | $1M–5M/yr | 3–5 | $5M–25M |
| Embedded/IoT OEMs | $100K–500K/yr | 20–50 | $4M–25M |
| Financial services | $200K–1M/yr | 10–20 | $4M–20M |
| Government (DoD, IC, civilian) | $500K–5M/yr | 5–10 | $5M–50M |
| Open-source foundations (contract work) | $100K–500K | 5–10 | $1M–5M |
| **Year 3+ Total** | | | **$25M–145M ARR** |

---

## The Macro Opportunity

### Total Addressable Market

| Segment | Estimated C/C++ LOC | Migration Cost (Manual) | Migration Cost (Automated) |
|---|---|---|---|
| U.S. Defense/IC | 5B+ lines | $50B–300B | $500M–3B |
| Enterprise software (global) | 10B+ lines | $100B–600B | $1B–6B |
| Embedded/IoT | 10B+ lines | $100B–600B | $1B–6B |
| Open source critical infra | 500M+ lines | $5B–30B | $50M–300M |
| Financial systems | 2B+ lines | $20B–120B | $200M–1.2B |
| Telecom infrastructure | 2B+ lines | $20B–120B | $200M–1.2B |
| **TOTAL** | **~30B lines** | **$300B–1.8T** | **$3B–18B** |

The manual cost is so high that **most of this code will never be rewritten without automation.** That's the market: code that CAN'T be migrated today at any reasonable cost, but MUST be migrated due to government mandates and security requirements.

### The Great Refactor as Catalyst

The Institute for Progress proposal is the perfect market accelerator:

- **Their ask:** $100M to secure 100M lines of open-source code
- **Their cost model:** ~$1/line (assumes AI tooling exists)
- **Their gap:** They need the tooling. They explicitly say the FRO should "apply the state-of-the-art AI models and Rust translation tools." **Ferrous Bridge IS that tool.**
- **Their timeline:** 3–5 years, team of ~50 people

If the Great Refactor gets funded — whether by the U.S. government, private sector, or both — Ferrous Bridge is the primary tooling vendor. This is a **$10M–30M contract opportunity** as the FRO's translation engine.

---

## What Automation Actually Unlocks

### The Compounding Flywheel

```
More translations completed
        │
        ▼
More verified C↔Rust training pairs
        │
        ▼
Better fine-tuned model
        │
        ▼
Higher accuracy, less human review
        │
        ▼
Lower cost per line
        │
        ▼
More customers can afford migration
        │
        ▼
More translations completed ← (loop)
```

This flywheel means cost per line DROPS over time as the model improves. Early customers pay $0.50/line. By Year 3, the cost could be $0.05/line. This is a classic learning-curve business where the first mover accumulates an insurmountable training data advantage.

### What Becomes Possible at $0.05/Line

At $0.05/line, things that were economically impossible become trivial:

| Scenario | LOC | Manual Cost | Automated Cost | Now Viable? |
|---|---|---|---|---|
| Translate all of curl | 150K | $3M–9M | $7.5K | YES |
| Translate all of nginx | 200K | $4M–12M | $10K | YES |
| Translate all of OpenSSH | 100K | $2M–6M | $5K | YES |
| Translate the Linux kernel (C parts) | 34M | $680M–2B | $1.7M | YES |
| Translate all of SQLite | 150K | $3M–9M | $7.5K | YES |
| Translate all of FFmpeg | 1M | $20M–60M | $50K | YES |
| Translate ALL critical open source | 100M | $2B–6B | $5M | YES |

**At $0.05/line, the Great Refactor's $100M budget could translate 2 BILLION lines of code.** The entire global C codebase becomes addressable.

---

## Payoff by Stakeholder

### For Ferrous Bridge / Magneton Labs

| Milestone | Timeline | Value |
|---|---|---|
| First paying customer | Month 8–10 | Validation |
| $1M ARR | Month 14–18 | Series A viable |
| $10M ARR | Month 24–30 | Market leader |
| $50M+ ARR | Year 4–5 | Acquisition target or IPO path |
| Training data moat (1M+ verified pairs) | Year 3 | Unassailable competitive advantage |

### For the Security Community

| Impact | Timeline |
|---|---|
| libyaml safe → serde_yaml no longer depends on unsafe code | Month 6–8 |
| libexpat safe → 40+ CVE classes eliminated across every Linux system | Month 10–12 |
| libpng safe → image processing attack surface eliminated | Month 14–16 |
| libxml2 safe → 100+ CVE classes eliminated | Month 16–20 |
| Critical infrastructure secured at scale | Year 3–5 |

### For the U.S. Government

| Impact | Timeline |
|---|---|
| DARPA TRACTOR has a production-grade performer | Month 12–14 |
| DoD codebases have a migration path | Year 2 |
| ONCD memory safety mandate becomes achievable | Year 3–5 |
| Estimated prevented cyberattack losses | $2B+ (Great Refactor estimate) |

### For Enterprise Customers

| Impact | Timeline |
|---|---|
| "1 engineer, 1 month, 1 million lines" becomes real | Year 2–3 |
| Legacy C migration no longer requires 10-year timelines | Year 2 |
| Memory safety compliance achievable without hiring 100 Rust devs | Year 2 |
| Insurance/liability reduction from provably safer code | Year 3+ |

---

## Risk-Adjusted Scenarios

### Bear Case: AI Translation Plateaus at 70% Accuracy

- Fine-tuned model handles routine code but fails on complex patterns
- Human review required for 30%+ of output
- Effective cost: $0.50–1.00/line (still 10–30x cheaper than manual)
- Market: $500M–2B (niche tooling for Rust migration consultancies)
- **Ferrous Bridge outcome:** $5M–15M ARR. Profitable but not transformative.

### Base Case: AI Translation Reaches 90% Accuracy

- Fine-tuned model handles most code, Claude handles complex cases
- Human review required for 5–10% of output
- Effective cost: $0.10–0.30/line
- Market: $3B–10B (every organization with legacy C must migrate)
- **Ferrous Bridge outcome:** $20M–60M ARR. Clear market leader. Acquisition target.

### Bull Case: AI Translation Reaches 98%+ Accuracy

- Fully automated for standard code, human review only for novel patterns
- Effective cost: $0.01–0.05/line
- Market: $10B–50B+ (entire global C/C++ codebase becomes addressable)
- Microsoft's "1 engineer, 1 month, 1 million lines" is achieved externally
- The Great Refactor becomes a 1-year project instead of 5-year
- **Ferrous Bridge outcome:** $100M+ ARR or $1B+ acquisition by Microsoft/Google/Amazon

---

## Investment Required vs. Payoff

| Phase | Duration | Investment | Cumulative | Expected Revenue | Cumulative Rev |
|---|---|---|---|---|---|
| Phase 1 | 3 months | $75K | $75K | $0 | $0 |
| Phase 2 | 5 months | $150K | $225K | $100K | $100K |
| Phase 3 | 6 months | $300K | $525K | $800K | $900K |
| Phase 4 | 10 months | $500K | $1.0M | $3M | $3.9M |
| Year 3 | 12 months | $1M | $2.0M | $10M+ | $14M+ |

**Break-even: Month 12–14 in the base case.**

The total investment to reach market leadership is roughly $1–2M over 2 years. For a market worth $3B–50B depending on technology achievement, this is an extraordinarily asymmetric bet.

---

## The Bottom Line

The automation of C→Rust translation is not a question of "if" — it's a question of "who builds it first." DARPA is funding it. Microsoft is building it internally. The Great Refactor is proposing to fund it at $100M. Meta is rewriting their messaging stack. The Linux kernel has adopted Rust.

The economics are simple:
- **Manual rewriting:** $4–150/line, years-long timelines, doesn't scale
- **Automated translation:** $0.05–0.60/line, weeks-long timelines, scales infinitely
- **The gap:** 30–1,000x cost reduction on the most critical security problem in software

Whoever builds the first production-grade automated C→Rust translator captures the defining infrastructure opportunity of the memory safety era. The training data flywheel means the first mover's advantage compounds exponentially.

**Build the pipeline. Translate jsmn. Then sds. Then libyaml. Each success makes the next one cheaper and faster. By the time you reach libxml2, the model has seen enough patterns to handle anything.**

The window is open now. It won't be open forever.
