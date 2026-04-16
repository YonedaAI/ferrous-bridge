export interface Paper {
  slug: string;
  part: string;
  title: string;
  abstract: string;
  pages: number;
  hasCode: boolean;
  category: string;
  doi: string;
}

export const papers: Paper[] = [
  {
    slug: 'c',
    part: 'Part I',
    title: 'The C Language as a Translation Source: Semantics, Undefined Behavior, and the libyaml Idiom Set',
    abstract: 'The Ferrous Bridge programme translates security-critical C libraries into safe, idiomatic Rust. The first concrete target is libyaml (~9,300 lines of C across ten source files). To translate C faithfully one must read C as a specification language for invariants rather than as a procedural recipe: the ISO C18 abstract machine leaves vast latitude (sequence points, indeterminate evaluation order, undefined behaviour, type-based aliasing assumptions) which C compilers exploit aggressively. This paper provides a unified semantic reference, including a small-step operational semantics, a UB taxonomy aligned with Rust type-system features, and translation contracts for each libyaml idiom.',
    pages: 29,
    hasCode: false,
    category: 'cs.PL',
    doi: '2026.04.c',
  },
  {
    slug: 'rust',
    part: 'Part II',
    title: 'Idiomatic Safe Rust as a Translation Target: Ownership, Lifetimes, and ABI-Compatible Parser Design',
    abstract: 'The migration of legacy C libraries to Rust is bottlenecked less by syntax than by the inverse problem of recovering the implicit invariants that C never forced its programmers to state. This paper is a design specification characterising the target side of that recovery: what idiomatic safe Rust should look like for a streaming parser library, and what engineering rules a translation pipeline must follow to hit that target deterministically. We adopt lightweight notation for lifetime subtyping, the borrow judgment, and the Result/Option algebra as clarity tools for stating which design components are forced by Rust\'s type system and which are engineering choices.',
    pages: 37,
    hasCode: false,
    category: 'cs.PL',
    doi: '2026.04.rust',
  },
  {
    slug: 'c-rust-transpiling',
    part: 'Part III',
    title: 'Automated C → Rust Transpiling: From c2rust\'s Raw Lift to Safe, Idiomatic Rust via the Safety Ladder',
    abstract: 'Automated C→Rust transpilation, as exemplified by c2rust (DARPA TRACTOR-funded), is a solved compilation problem but an unsolved safety problem. The output is pervasively unsafe: raw *mut T pointers, manual bounds arithmetic, integer-as-error returns. We formalize the gap between the c2rust lift and idiomatic safe Rust as a safety ladder: a chain of refinement relations indexed by an increasingly strong verification regime (rustc, Miri, differential fuzzing, Loom/cargo-careful, Kani), and we characterise the per-stage refactoring engine that walks each function up that ladder.',
    pages: 35,
    hasCode: false,
    category: 'cs.PL',
    doi: '2026.04.c-rust-transpiling',
  },
  {
    slug: 'synthesis',
    part: 'Synthesis',
    title: 'Ferrous Bridge: A C → Rust Automated Agent Orchestration Pipeline with Type Checks and Safety Guarantees',
    abstract: 'The Ferrous Bridge programme frames C→Rust translation as a multi-agent orchestration pipeline: a typed directed acyclic workflow whose nodes are AI-driven agents and whose edges carry typed artifacts. We give a formal account of the artifact-type category (eleven artifact types, ten agents, one DAG, one supervisor channel), the six-rung safety ladder as a chain of refinement relations, and an informal composition theorem stating that if every agent discharges its local proof obligation, the end-to-end pipeline delivers a safe-libyaml crate that compiles under #![deny(unsafe_code)] and passes all verification stages.',
    pages: 37,
    hasCode: false,
    category: 'cs.PL',
    doi: '2026.04.synthesis',
  },
];

export function getPaper(slug: string): Paper | undefined {
  return papers.find((p) => p.slug === slug);
}

export function getPaperIndex(slug: string): number {
  return papers.findIndex((p) => p.slug === slug);
}
