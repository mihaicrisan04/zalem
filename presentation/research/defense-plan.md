# Zalem Defense Deck — Plan

## A) SLIDE-BY-SLIDE PLAN (10 slides)

**Slide 1 — TITLE** *(teacher req. #1)*
- **An Architectural Proposal for a Hybrid LLM-Augmented Shopping Recommender with Grounded Output**
- Mihai-Dan Crisan · Supervisor: Assoc. Prof. PhD Adriana Guran
- UBB Cluj-Napoca · Faculty of Mathematics and Computer Science · Bachelor's thesis
- *Visual:* clean white, large Geist type. Optional: faint static frame from the context-assembly Remotion animation as a watermark, no motion yet.

**Slide 2 — CONTENTS** *(teacher req. #2)*
- Background & related work — classical recommenders, LLMs in recsys, the Rufus case
- Foundations — grounded generation, two-stage retrieve-and-rerank, evaluation
- Zalem — the prototype: grounded advisor + review-grounding pipeline
- Results & conclusions
- *Visual:* 4 numbered rows mapping to ch. 2/3/4/5 (collapse the 5 thesis chapters into 4 lines; omit ch. 1). One idea per row, airy.

**Slide 3 — DOMAIN** *(teacher req. #3a — the field)*
- Where this sits: classical recommenders narrow the catalog but are **opaque** — they never say *why*
- LLMs can explain, summarize reviews, surface tradeoffs — but **hallucinate** product facts
- The gap: a conversational advisor that explains **without inventing**
- *Visual:* two-circle Venn — "Classical RecSys (accurate, opaque)" ∩ "LLM advisor (fluent, hallucinates)" → labeled intersection "grounded hybrid". High-contrast, one accent color.

**Slide 4 — STATE OF THE ART: the Rufus case** *(teacher req. #3b — SOTA results from literature)*
- Amazon Rufus: 300M+ users, ~$12B incremental sales (2024–25) — yet documented failures:
- **32% accuracy** · **28% wrong prices** · **83% own-brand bias** · fabricated review themes
- 55% of consumers don't trust AI recommendations; only 16% use them regularly
- *Visual:* four big stat tiles (32 / 28 / 83 / themes), each a number + one-word label. Footnote in small type: "ConsumerAffairs 2024; Marketplace Pulse 2024; trade reports — not peer-reviewed." (pre-empts the committee question.)
- *Speaker note:* these are the **documented production failures** the architecture is evaluated against — "honest evaluation, not a new algorithm."

**Slide 5 — THE IDEA** *(teacher req. #4 — student's approach)*
- Anti-Rufus design principle: **hydration over generation** — the model *selects and explains*, never *sources* facts
- Every price, rating, spec, ID the user sees is read from the live catalog at request time
- **Reactive-first**: the user pulls advice; the system never auto-fires
- *Visual:* the layered architecture diagram (see Section B). This is the keystone slide.

**Slide 6 — FUNCTIONALITY 1: The grounded advisor** *(teacher req. #4 — functionality 1 of 2)*
- Read-only tools return **only catalog data**; context is re-assembled live on every request
- 3-stage output validation: identifier-existence · claim-stripping regex · embedding theme-fidelity
- *Visual:* **keep the "context assembly" transparent Remotion animation here** — it is an abstract concept animation (context fields snapping into a system message), not an app recording, so it is allowed and earns its place illustrating an invisible backend step.
- *Speaker note (look-here):* `ai/tools.ts` (5 read-only tools); `ai/advisor.ts:12-114` `assembleContext`; validators at `chapter4_system.tex:606-672`.

**Slide 7 — FUNCTIONALITY 2: Review grounding** *(teacher req. #4 — functionality 2 of 2)*
- Structured positives / negatives **with counts**, plus a "divided opinions" conflict view — no averaged-away minority opinions, **no "best product" verdict**
- Every claimed theme is **embedding-verified against the real review corpus** before it is stored
- *Visual:* a mock review-summary card — green positives column, red negatives column, a center "divided opinions" bipartite splice with counts. Reuse the store card styling (white `rounded-lg`, thin border, yellow stars, `lei` price) for visual continuity.
- *Speaker note:* `reviewSummaries.ts:127-162` (`validateThemesWithEmbeddings`, cosine > 0.35, ≥2 matches); same vector check is reused as the advisor's `reviewThemeFidelity` validator — one mechanism, two features.

**Slide 8 — RESULTS: the ablation** *(teacher req. #5 — results)*
- Strip out grounding → the model talks **2× more confidently** (162 vs 83 hard price/rating claims) and is wrong far more (**67% vs 48%** off the DB; factuality **0.76 vs 0.53**)
- The twist: **LLM judges *prefer* the fabricating config** (helpfulness 0.78 vs 0.57) — so DB-backed checks, not judge scores, carry the trust signal
- *Visual:* grounded-vs-ungrounded comparison table (6 rows from Section C). Highlight the inverted-judge row in the accent color.

**Slide 9 — RESULTS: the sweep** *(teacher req. #5 — results)*
- 8-config sweep: best on composite is the **cheapest** model (Gemini Flash-Lite, 0.807, $0.0003/query, p95 4.2s)
- **More reasoning is uniformly worse** — gpt-oss-120b high-reasoning is the worst (0.492, 12.1s p95)
- Groundedness held everywhere (mean ≥ 0.89)
- *Visual:* small Pareto scatter (cost/latency x quality) OR a 3-tile takeaway. One headline: "trust is an integration problem, not a model-capability problem."

**Slide 10 — CONCLUSIONS** *(teacher req. #5 — conclusions)*
- Contribution: an **integration architecture + honest evaluation** against documented production failures — at a scale a bachelor thesis can defend
- Limits stated up front: no human-subject study, no offline-IR baseline, ~200-product seeded catalog
- Next: within-subjects user study (trust, intrusiveness, purchase confidence)
- *Visual:* three short stacked lines (Contribution / Limits / Next). Close on the title lockup. → hands off to live demo + 1-2 min video.

**Justification of the two functionalities:** the **grounded advisor** is the thesis's central claim *and* the only feature with hard ablation evidence — it directly answers "what does the architecture buy you." The **review-grounding pipeline** is the most *visually* demonstrable and most clearly *novel/anti-Rufus* feature, and it shares its embedding verifier with the advisor, so it reinforces rather than dilutes functionality 1. Behavior-cues→context-enrichment was rejected: the thesis itself admits the composite interest score is computed but **not wired** to behavior (simple thresholds drive the UI instead), and it yields only ambient nudges — no grounded, measured outcome to defend.

**Video recommendation:** keep **one** Remotion animation — the **context-assembly** one — on Slide 6, because it visualizes an invisible backend step (context being hydrated), which a live demo cannot show. Drop or hold the **advisor-chat** animation: the live app demo covers the chat surface, so showing a pre-recorded chat risks reading as the "pre-recorded app demo" the teacher discourages. Both are abstract/transparent concept animations, but only the context-assembly one shows something the live demo can't.

---

## B) ARCHITECTURE TRUTH (code-backed)

**The correct account — two independent paths, one optional bridge:**

1. **Classical engine → store rails.** `recommendationHelpers.ts` (pure TS algorithms) + `recommendations.ts` queries power the product rails: "Similar products" and "Frequently bought together" on the detail page, "Trending" and "Recommended for you" (switching hybrid) on the homepage, `forCart` on cart. **These never call an LLM** — the homepage "renders entirely from Stage 1" (`chapter4_system.tex:689-695`). The only rerank in the rails is **MMR, a classical diversity algorithm** (`recommendationHelpers.ts:240-273`).

2. **AI advisor → reads the catalog directly.** `assembleContext` (`advisor.ts:12-114`) reads current product, review summary, live cart, localStorage recently-viewed on every request and injects them as a system message. Four of its five tools (`getProductDetails`, `searchProducts`, `getCartContents`, `getReviewsSummary`) read the catalog directly.

3. **The single bridge** is the `getRecommendations` tool (`tools.ts:59-102`), which lets the advisor pull classical query outputs *on demand* when the model chooses to call it. It is opportunistic selection — **not** an automatic "candidates → advisor" feed.

**Confusions to NOT repeat on stage (thesis prose oversells code — avoid these claims):**
- ❌ "Two-stage LLM rerank pipeline for the rails" — false; rails are pure classical + MMR. The LLM does **selection + explanation**, never numeric re-ranking, and never score-fuses with classical scores.
- ❌ "Reciprocal Rank Fusion, k=60" (`:270-272`) — **no RRF in the code**; `forYou` uses additive raw-score accumulation with flat 0.5/0.3 tier weights + a ×1.3 category boost (`recommendations.ts:155-240`).
- ❌ Switching thresholds "≥4 / 1–3" (`:276-289`) — code is **≥3 → co-occurrence, 1–2 → content**, plus an undocumented favorites tier before trending.

**How to DEPICT it (better than a left-to-right pipeline + dotted "trust boundary"):**

Use a **two-lane layered diagram around a central spine**, not a pipeline:

```
            ┌──────────────── LIVE CONVEX CATALOG ────────────────┐
            │     products · reviews · cart · co-occurrence        │   ← single source of truth (the spine, full width, top)
            └──────────────────────────────────────────────────────┘
                  ▲                                    ▲
                  │ reads                              │ reads (live, every request)
        ┌─────────┴──────────┐              ┌──────────┴───────────────┐
        │  CLASSICAL ENGINE  │              │      AI ADVISOR          │
        │  similar · FBT ·   │  · · · · · · │  assembleContext +       │
        │  trending · forYou │  getRecs     │  4 read-only tools       │
        │  (+ MMR rerank)    │   (bridge)   │  → select & explain only │
        └─────────┬──────────┘              └──────────┬───────────────┘
                  │                                    │ output passes →
                  ▼                                    ▼  3-stage validator
            STORE RAILS                          ADVISOR CHAT
        (home · product · cart)              (user-pulled, reactive)
```

Key depiction choices that fix the confusion:
- Put the **catalog as a full-width spine at the top**, with *both* lanes drawing arrows **up** to it. This visually encodes "everything is hydrated from the catalog" far better than a dotted boundary — grounding becomes *direction of data flow*, not a fuzzy line.
- Draw the two lanes as **parallel, not sequential** — kills the false "Stage 1 → Stage 2 LLM rerank" reading.
- Make `getRecommendations` a **thin dotted horizontal connector** between the lanes, labeled "on-demand bridge" — accurate and visibly optional.
- Place the **3-stage validator as a gate on the advisor's output arrow only** (it doesn't touch the rails). That gate *is* your trust boundary, but rendered as a checkpoint on one specific edge rather than a vague dotted region.

---

## C) BUILD NOTES

**Eval metric definitions (for Slide 8/9 + script):**
- **Factuality** = (specific price/rating claims − fabricated) / total claims. A claim is a literal like "$299.99" or "4.5/5"; "fabricated" = doesn't match the run-time DB snapshot within ±$0.01 / ±0.1. Objective, DB-backed.
- **Groundedness** = share of cited product IDs that exist in the live catalog. Existence only, not correctness. (Doesn't discriminate in the ablation — both 1.0, since fabrication lives in prices, not IDs.)
- **Helpfulness / Completeness** = LLM-judge opinions (Claude Haiku 4.5, cross-family to avoid self-preference; sees only {question, final answer}). Subjective, secondary, never the gate.

**Numbers — ablation (same 34 cases):**

| Metric | Grounded | Ungrounded |
|---|---|---|
| Specific price/rating claims | 83 | 162 (~2×) |
| Claims not matching store DB | 48% | 67% |
| Factuality mean | 0.76 | 0.53 |
| Judge helpfulness | 0.57 | **0.78** |
| Judge completeness | 0.70 | **0.89** |
| Latency p50 | 2.4 s | 1.4 s |

Flagship anecdote for the script: ungrounded config quoted a confident price table — Galaxy S24 Ultra **$1,199**, iPhone 15 Pro **$999** — both lifted from few-shot examples, neither in the store. Every claim fails the DB check.

**Numbers — sweep:** 8 configs × 34 cases = 272 advisor calls + ~1,100 judge calls (~$3/sweep). Best composite = Gemini 3.1 Flash-Lite **0.807**, **$0.0003/query**, **p95 4.2s**. Worst = gpt-oss-120b high-reasoning **0.492**, **p95 12.1s**. Groundedness mean **≥0.89** across all. 7/8 stay under p95 7.5s.

**"Look here in the code" notes (speaker script):**
- *Review pipeline:* daily cron `crons.ts:23-28` (04:00 UTC, no on-insert trigger) → `reviewSummariesHelpers.ts:168-190` (`generateAll`, chunks of 30) → staleness/min-3-reviews at `reviewSummariesHelpers.ts:47-74` → full-corpus regen, embeds all reviews `reviewSummaries.ts:208-211` (model `google/gemini-embedding-001`, 3072-dim) → theme validation `reviewSummaries.ts:127-162` (cosine > 0.35, "verified" if ≥2 matches). Caveat to be honest about if asked: `validationPassed` is a stored **flag, not a hard block** (`reviewSummaries.ts:257`, `:271-288`) — summaries are written regardless.
- *Context assembly:* `advisor.ts:12-114`, called unconditionally every request (`advisor.ts:133-136`), **not persisted** to thread; packs current product → review themes → cart → recently-viewed. Honest correction if asked: the advisor does **not** read `behaviorSessions`; recently-viewed comes from localStorage (`use-recently-viewed.ts`), cart from `api.cart.list`. Behavior signals only drive client-side UI nudges (`use-readiness-signals.ts`).

**Rufus stat + citation:** 32% accuracy / 28% wrong price / 83% own-brand → **ConsumerAffairs (2024)** + **Marketplace Pulse, "Amazon's Shopping AI Is Confidently Wrong" (2024)**. Scale: 300M+ users (AWS, 2024); ~$12B incremental sales (PPC Land, 2025). Be ready to say: trade/industry articles, **not peer-reviewed** — a likely committee question.

**Store product-card structure to mimic (for Slides 7 visual continuity):** white `bg-card` panel, `rounded-lg`, thin grey border, **no shadow**. Square photo top; top-left a small soft-red `-NN%` pill (tinted, not solid) with an optional primary "Deal" pill below; top-right a circular translucent-white heart button. Info block (`p-3.5`, `gap-2`): 2-line title (13px medium), row of 5 small **yellow** stars + grey `(count)`, then bold 20px price `XX.XX lei` with a struck-through grey original beside it, then a full-width glossy-primary "Add to cart" button with cart icon. **No brand on the card** (brand shows only on the detail page). Source: `apps/web/src/components/product-card.tsx`.