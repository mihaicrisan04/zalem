# thesis refactor plan (2026-05-17)

full structural refactor of the thesis manuscript. trims from 94p → 50p, restructures to mirror the UBB-style example in `thesis-example/`, picks a single CS theoretical anchor, and consolidates implementation into one chapter that covers everything from architecture to frontend (including eval).

reference: `thesis-example/Solving_Techniques_for_Rubik_s_Cube_in_Software_and_Robotics_Environment.pdf` — author Măierean Mircea, supervisor Nechita Mihai-Simion, same faculty (UBB Cluj-Napoca, Computer Science in English), 2026.

---

## target

- **page budget: ≤50 pages** (hard target, accepts ~52 with slack)
- **5 chapters** (vs the example's 7 — collapsed because eval is folded in and impl is one chapter)
- **Ch1 light:** Context, Motivation, Objectives, Thesis Structure. no separate RQ/Hypotheses/Contributions sections (example has none either)
- **Ch3 is the CS chapter:** hybrid braid of recsys foundations + retrieve-rerank + agents + grounded generation + eval metrics. has equations, similarity formulas, formal architecture sketches
- **Ch4 is the implementation chapter:** architecture → data layer → recsys engine → behavior → advisor → review summarization → comparison → output validation → frontend walkthrough → eval harness → results
- **Ch5 is brief:** conclusions and future work

---

## final structure

| ch | title | target | content |
| --- | --- | --- | --- |
| — | front matter | 3p | abstract (tight), TOC |
| 1 | Introduction | 3p | Context · Motivation · Objectives · Thesis Structure |
| 2 | Background and Related Work | 8p | classical recsys, LLMs in recsys, trust/HCI (brief), Rufus case study (kept at strength) |
| 3 | **Hybrid Recommendation with Grounded LLM Assistance** | 10p | the CS theoretical chapter — see § Ch3 detail below |
| 4 | **System Implementation** | 23p | one consolidated chapter covering everything from architecture to frontend, plus eval harness and results — see § Ch4 detail below |
| 5 | Conclusions and Future Work | 2p | summary, future work bullets |
| — | references | 3p | audited bibliography |
| | **total** | **~52p** | aim 50, accept 52 |

---

## ch3 detail — Hybrid Recommendation with Grounded LLM Assistance

this is the "How to Solve a Rubik's Cube" equivalent. its job is to make the thesis feel like CS, not app development. it has formal definitions, equations, and architecture patterns that the implementation chapter then maps onto.

### 3.1 Classical Recommender Foundations (1.5p)
- collaborative filtering via co-occurrence
- content-based filtering
- hybrid approaches (switching, weighted, mixed)
- temporal decay and popularity bias

### 3.2 Similarity Measures (2p)
- **Jaccard** similarity `J(A,B) = |A ∩ B| / |A ∪ B|` — set-theoretic justification, why it suits co-purchase signals
- **Weighted attribute similarity** for content-based — formal scoring function
- **Cosine** similarity (for the embedding-based theme-fidelity scorer)
- **Exponential time decay** `score = count × e^(−λt)` — derivation of λ from desired half-life

### 3.3 The Two-Stage Retrieve-and-Rerank Pattern (1.5p)
- IR-theoretic lineage (BM25 retrieval + neural rerank)
- latency-bounding argument: candidate generation O(ms), rerank O(s)
- why the pattern is dominant in production recsys

### 3.4 LLM Agents and Tool Use (2p)
- the ReAct loop (Thought → Action → Observation)
- function calling and structured output (JSON-mode, schemas)
- step budgets and termination conditions
- multi-turn context assembly

### 3.5 Grounded Generation and Output Validation (2p)
- hallucination as a fundamental failure mode of free-form generation
- hydration-over-generation principle
- post-generation validation: identifier-existence checks, factual-claim stripping, theme-fidelity via embeddings
- formal statement of the validation pipeline

### 3.6 Evaluation Metrics for Hybrid Systems (1p)
- programmatic scorers (groundedness, factuality, theme fidelity, tool-call efficiency)
- LLM-as-judge with cross-family bias mitigation
- pareto fronts on (cost, quality) and (latency, quality)
- composite ranking under explicit weights

---

## ch4 detail — System Implementation

one consolidated chapter. every subsection is 1–2p. mirrors the example's "Web Application" chapter pattern but extended to absorb the eval contribution. **bold** sub-sections are the load-bearing ones; others are intentionally short.

### 4.1 Requirements and Specifications (1.5p)
- compressed functional + non-functional requirements
- architecture overview figure (TikZ)
- tech stack one-paragraph

### 4.2 Codebase and Deployment (1p)
- monorepo layout (one paragraph + figure)
- Convex + Next.js + OpenRouter + Dokploy topology

### 4.3 Data Layer (2p)
- Convex schema, ER diagram (TikZ)
- seed data (DummyJSON + faker, deterministic seeds)
- index strategy

### 4.4 **Recommendation Engine** (2p)
- co-occurrence with Jaccard (cross-ref §3.2) — keep `contentSimilarity` listing
- content similarity, trending, personalized — prose only
- two-stage pipeline figure (TikZ)

### 4.5 **Behavior Tracking and Readiness Signals** (2p)
- client hooks (`useHover`, `useDwellTime`, `useViewportTracking`) — keep `useDwellTime` listing
- aggregation + flush (figure)
- readiness evaluator (composite score, cooldowns)

### 4.6 **LLM Advisor** (3p)
- model routing across Cerebras-served `gpt-oss-120b` + Gemini Flash-Lite — keep `selectModel` listing
- agent construction via `@convex-dev/agent` (prose, no listing)
- system prompt summary + few-shot strategy
- tools (productDetails, search, recommendations, cart, reviews, comparison) — table
- advisor sidebar UI (figure + screenshot)

### 4.7 Review Summarization (1.5p)
- batch generation pipeline
- conflict surfacing with counts
- ground-truth check against review corpus

### 4.8 AI-Assisted Comparison (1.5p)
- comparison tool + structured JSON schema
- comparison UI (table render, no winner verdict)

### 4.9 **Output Validation Pipeline** (2p)
- schema validation
- catalog hydration (identifier-existence)
- factual-claim stripping (regex over free text)
- theme-fidelity via embedding match
- validation-pipeline figure

### 4.10 Frontend Walkthrough (1.5p)
- UI screenshots (homepage recs, product page with review summary)
- store flow narrative

### 4.11 **Evaluation Harness** (2p)
- Promptfoo + custom Convex provider (build-vs-buy paragraph)
- 5 programmatic scorers (groundedness, factuality, theme-fidelity, tool-call efficiency, has-final-answer)
- LLM-as-judge with cross-family Claude Haiku 4.5
- 9-config sweep (model × reasoning effort × prompt variant)
- eval architecture figure

### 4.12 **Results** (3p)
- ranked-configs table
- pareto plot: cost × quality
- pareto plot: latency × quality
- per-category programmatic correctness
- prompt-variant comparison (few-shot contamination finding — keep the Vivo V9 paired-output quote, it's load-bearing evidence)
- selected configuration: justification on measured numbers

### 4.13 Engineering Challenges (compact, ~0.5p)
- bullet list (not prose paragraphs)
- 3–5 entries max

---

## what gets cut

### whole sections removed
- Ch3 (Problem Definition) as a standalone chapter — content scatters into Ch1 (motivation) and Ch4 §4.1 (requirements)
- Ch6 (Evaluation Methodology) as a standalone chapter — folds into Ch4 §4.11
- Ch7 (Results) as a standalone chapter — folds into Ch4 §4.12
- Ch1 sections: Research Questions, Hypotheses, Contributions (as named sections)
- Ch4 (current) §4.2 Codebase Structure as its own section (folds into §4.2 here as one paragraph)
- Ch4 (current) §4.13 End-to-End Advisor Request trace
- Ch3 (current) §3.4 traceability table (RQ → FR mapping)
- Ch3 (current) §3.3 non-goals as a list (folded into prose in §4.1 or dropped)

### figures cut
- `monorepo-graph.pdf` (low value)
- `eval-run-lifecycle.pdf` (subsumed by eval architecture figure)

### figures kept
- `architecture-overview` (TikZ), `validation-pipeline`, `model-routing`, `advisor-request`, `deployment-topology`, `eval-architecture`, `readiness-loop`, `behavior-flush`, ER diagram (TikZ), two-stage-pipeline (TikZ), `ui-homepage-recommendations.png`, `ui-product-review-summary.png`, both pareto `.tex` plots, ranked-configs `.tex` table, per-category `.tex` table

### code listings kept
- `contentSimilarity` (in §4.4)
- `useDwellTime` (in §4.5)
- `selectModel` (in §4.6)

### code listings dropped
- schema-products listing (duplicates ER diagram)
- second behavior listing (one is enough)
- agent-construction listing (prose-only is fine)

---

## file-level migration

### new files
- `thesis/chapters/chapter3_foundations.tex` — the hybrid braid, drafted from scratch using current `chapter4_design.tex` theoretical/rationale sections as raw material
- `thesis/chapters/chapter4_system.tex` — consolidated impl + eval + results, merging current `chapter4_design.tex` impl parts + `chapter5_implementation.tex` + `chapter6_evaluation_methodology.tex` + `chapter7_results.tex`

### files heavily rewritten
- `thesis/chapters/chapter1_introduction.tex` — trim from 7 sections to 4 (Context, Motivation, Objectives, Thesis Structure). drop H1/H2 hypotheses. fold contributions into closing of Objectives or move to Conclusions.
- `thesis/chapters/chapter2_background.tex` — trim from 10p to 8p. compress the four LLM-in-RecSys subsections to two. shorten Positioning to one paragraph. **keep Rufus case study at full strength.**

### files renamed
- `chapter8_conclusions.tex` → `chapter5_conclusions.tex`. trim from 4p to 2p. drop the contributions-revisited list (covered by closing of Ch1 Motivation). compress future-work subsections to one paragraph each.

### files deleted
- `chapter3_problem.tex` — content scattered as described
- `chapter4_design.tex` — split into new ch3 (theory) and new ch4 (impl)
- `chapter5_implementation.tex` — content absorbed by new ch4
- `chapter6_evaluation_methodology.tex` — content absorbed by new ch4 §4.11
- `chapter7_results.tex` — content absorbed by new ch4 §4.12
- `chapter8_conclusions.tex` — replaced by `chapter5_conclusions.tex`

### main.tex changes
```latex
\input{chapters/chapter1_introduction}
\input{chapters/chapter2_background}
\input{chapters/chapter3_foundations}
\input{chapters/chapter4_system}
\input{chapters/chapter5_conclusions}
```
- update abstract (current abstract is acceptable; may need a sentence reflecting the consolidated structure)
- title page: no change (already matches the UBB template via `style.sty`)

### references.bib
- audit unused `\cite` entries; remove ones not actually cited in the final manuscript
- consider switching from `alpha` to `abbrv` if faculty rules allow — saves 1–2p

---

## order of operations

| step | what | est | notes |
| --- | --- | --- | --- |
| 1 | trim ch1 (drop RQ/H/Contrib sections) | 0.5d | quick |
| 2 | draft new ch3 foundations (hybrid braid) | 2d | most novel work; needs careful formula writing |
| 3 | draft new ch4 system (merge 4 existing chapters) | 3d | biggest job; needs aggressive trimming |
| 4 | trim ch2 background | 0.5d | line-level work |
| 5 | trim new ch5 conclusions (former ch8) | 0.5d | quick |
| 6 | update main.tex + abstract | 0.5d | mechanical |
| 7 | bibliography audit + optional bibstyle swap | 0.5d | verify with faculty rules first |
| 8 | build, fix refs, page count check, polish pass | 1d | iterate to hit 50p |

**total estimate: ~1 week** of focused writing.

recommended: draft ch3 first (it's the most novel) and ch4 second. these are the two new chapters; everything else is trimming or relocating.

---

## risks and mitigations

- **risk:** ch4 at 23p becomes a megachapter that's hard to navigate.
  **mitigation:** strict 1–2p budget per subsection; figures and tables break up prose; clear `\section` / `\subsection` hierarchy with anchor labels.

- **risk:** dropping RQs/hypotheses leaves the thesis without an explicit testable claim.
  **mitigation:** restate the central claim as the closing paragraph of ch1 §Motivation (one tight sentence). ch5 conclusions explicitly answers it. the example does the same — its claim is "we can build a hybrid software+hardware Rubik's solver", stated in ch1 motivation, answered in ch7 conclusions.

- **risk:** the eval material gets squeezed at 5p combined (§4.11 + §4.12) and loses argument quality.
  **mitigation:** budget 5p firmly; if it spills to 6p that's acceptable (the pareto plots and ranked-configs table are evidence the thesis needs). protect the few-shot contamination paired-output quote — it's the strongest single piece of evidence the harness pays for itself.

- **risk:** the current 94p draft has more depth than 50p can hold; some genuinely strong content will be lost.
  **mitigation:** prioritize content with thesis-claim weight (Rufus, validation pipeline, eval harness rationale, pareto evidence). sacrifice ceremonial content first (hypotheses, traceability table, contributions list, codebase-structure section, end-to-end advisor-request trace).

- **risk:** examiner expects a separate problem-definition chapter per UBB submission rules.
  **mitigation:** verify the example's structure is compliant (it has no separate problem chapter either — its Ch1 §Objectives carries that role). if compliance requires it, reintroduce a thin ch3 (1–2p) and renumber.

---

## what this preserves

- the central thesis claim (trustworthy reactive-first advisor; hydration over generation; measured tradeoffs)
- the Rufus case study at full strength
- the validation pipeline as a load-bearing contribution (now in §4.9 instead of buried in a long design chapter)
- the eval harness as a real contribution (now in §4.11–§4.12)
- the 9-config sweep + pareto plots + ranked-configs table
- the few-shot contamination finding
- the three keeper code listings
- every canonical TikZ figure

## what this gains

- a real CS theoretical chapter (currently absent — current ch2 is literature, current ch4 mixes design rationale with implementation)
- a clearer mapping from theory → implementation (every §3.x section has a §4.x counterpart that implements it)
- a tighter thesis the reader can finish in one sitting
- alignment with the UBB-style example, which is the closest reference for what the faculty expects

---

## writing principle for the refactor

match the example's voice:

- **direct descriptive prose** — no rhapsodic motivation paragraphs
- **equations where they earn placement** — similarity measures, time decay, the validation predicate
- **tables for systematic enumeration** — config sweep, ranked configs, tool catalog
- **figures that carry weight** — architecture, ER diagram, validation pipeline, pareto plots
- **code listings only when prose can't show it** — the three keepers
- **no multi-paragraph introductions to sections** — one sentence of orientation, then content
- **lower-case prose** for natural reading; capitalize specific technical terms (LLM, API, JSON, NDCG, RAG)

---

## status

- **not started.** plan documented 2026-05-17 after reviewing the example and aligning on Ch3 anchor (D, hybrid braid), eval placement (folded into ch4), and ch1 ceremony (drop RQ/H/Contrib).
- next step: draft `chapter3_foundations.tex` from scratch using `chapter4_design.tex` theoretical sections as raw material.
