# OUTLINE

# Thesis Outline for Defense Presentation

## Title Block

**English title:** An Architectural Proposal for a Hybrid LLM-Augmented Shopping Recommender with Grounded Output

**Romanian title:** O Propunere de Arhitectură pentru un Sistem Hibrid de Recomandare pentru Cumpărături cu Asistent LLM și Răspunsuri Ancorate în Catalog

**Author:** Mihai-Dan Crisan

**Supervisor:** Assoc. Prof. PhD Adriana Guran

**Specialization:** Computer Science (Informatică Engleză) — UBB Cluj-Napoca, Faculty of Mathematics and Computer Science — Bachelor's thesis (Lucrare de Licență)

---

## Chapter Structure (Table of Contents)

**Chapter 1 — Introduction**
- Context and Motivation
- Motivation
- Objectives
- Thesis Structure

**Chapter 2 — Background and Related Work**
- Classical Recommender Systems (Co-Occurrence and Collaborative Filtering; Content-Based Filtering; Hybrid Recommenders and Trending)
- Explainable Recommendations
- Large Language Models in Recommender Systems
- Review Summarization for Purchase Validation
- AI-Assisted Comparison as Decision Support
- Trust and Human-AI Interaction (Timing and Consumer Resistance; Behavioral Signals as Intent Indicators)
- Case Study: Amazon Rufus (System Architecture and Capabilities; Documented Accuracy and Trust Issues; Feature Evolution and Lessons)
- Positioning of This Thesis

**Chapter 3 — Fundamentals of Recommendation and an Approach for Grounded Output**
- Classical Recommender Foundations
- Similarity Measures and Time Decay
- The Two-Stage Retrieve-and-Rerank Pattern
- LLM Agents and Tool Use
- Grounded Generation and Output Validation
- Evaluation Metrics for Hybrid Systems

**Chapter 4 — Zalem: A Case Study**
- Requirements and Architecture
- Codebase and Deployment
- Data Layer
- Recommendation Engine
- Behavior Tracking and Readiness Signals
- LLM Advisor
- Review Summarization
- AI-Assisted Comparison
- Output Validation Pipeline
- Frontend Walkthrough
- Evaluation Harness
- Results (Ranked Configurations; Pareto Fronts; Per-Category Programmatic Correctness; Few-Shot Contamination; Ablation: Removing Grounding; Summary and Validity)
- Engineering Challenges

**Chapter 5 — Conclusions and Future Work**
- Summary
- Practical Implications
- Limitations
- Future Work
- Closing Remarks

---

Relevant files: main file `/Users/mihai/dev/personal/zalem/thesis/main.tex`; chapters in `/Users/mihai/dev/personal/zalem/thesis/chapters/` (`chapter1_introduction.tex`, `chapter2_background.tex`, `chapter3_foundations.tex`, `chapter4_system.tex`, `chapter5_conclusions.tex`).

---

# SOTA

# Zalem Thesis — Defense Prep Extract

Sources read: `chapter1_introduction.tex`, `chapter2_background.tex`, `chapter3_foundations.tex`, `references.bib` (all under `/Users/mihai/dev/personal/zalem/thesis/`).

## 1. Domain / Field
The thesis situates itself at the intersection of **classical recommender systems** and **LLM-augmented / grounded conversational shopping assistants**. Precisely, it is about a **hybrid recommendation architecture** that combines classical recommender algorithms with a **reactive, grounded LLM advisor** for e-commerce. Core themes: LLM-augmented recommendation, grounded generation (the thesis's own framing is "hydration over generation," its variant of RAG-style grounding), two-stage retrieve-and-rerank, LLM hallucination mitigation, and human-AI trust/timing.

The stated contribution is explicitly **not a new algorithm** but "an integration architecture and an honest evaluation against documented production failures, at a scale a bachelor thesis can defend."

## 2. Problem / Motivation
- Online retail has too many substitutes; classical recommenders narrow the space but are **opaque** — users are not told *why* items were chosen.
- LLMs can explain, summarize reviews, surface tradeoffs — but introduce **trust failures**: hallucinated product data, fabricated review themes, perceived intrusiveness. These are **documented, not speculative** (Rufus + surveys).
- **Timing matters**: suggestions after a natural pause read as helpful; suggestions during active deliberation read as interruption. This drives a **reactive-first** interaction model — the system tracks lightweight browsing signals (dwell, scroll, viewport, review-tab engagement) to *prepare context*, but never auto-triggers AI advice. "The user pulls."
- Central claim (two parts): (a) a hybrid architecture combining classical algorithms with a reactive grounded LLM advisor can answer real shopping questions **without inheriting production trust failures**; (b) every model/prompt choice can be **backed by measured evidence**, not intuition.

## 3. State of the Art / Related Work
**Classical recommenders** (ch. 2): three families — item-based collaborative filtering (co-occurrence as lightweight special case, Jaccard over buyer sets), content-based filtering (attribute vectors, solves cold start but causes filter bubbles), and hybrids. Burke's 7-pattern taxonomy (weighted/switching/mixed most common); prototype uses a **switching hybrid** for "recommended for you" and **Reciprocal Rank Fusion** where ranks are combined. Trending = **exponential time decay** with per-category half-life.

**LLMs in recommenders**: surveys identify three LLM roles — knowledge enhancement, interaction, model enhancement. Thesis uses roles 1 & 2 (knowledge + conversational interaction), does **not** retrain a ranker. Standard pattern is **two-stage**: classical candidate generator → LLM rerank/explain/summarize on a small set. Cost driver: LLM inference scales with context size, so feed 5 candidates not 5,000 catalog items.

**Explainable recs**: classical = generic pattern-level ("users who bought X also bought Y"); LLMs generate sentence-level rationales; KG-grounded explanations sit between, with fewer hallucinated attributes.

**Review summarization**: naive summarization (a) averages sentiment hiding minority opinions, (b) fabricates themes not in the source corpus. Thesis treats theme fabrication as a hard constraint (validated against source text, conflicts surfaced with counts).

**AI comparison**: main failure is the "best product" verdict; UX guidance recommends **tradeoff-first** layout. Consumer research: **56% of shoppers want comparison help, 47% want review summarization** (DigidayAIShopping 2025; note ch.2 §bg-comparison cites 56%/47% via DigidayAIShopping, while intro/bib note for that ref says 47% want review summarization).

**Trust & HCI**: CHI 2024 timing study (pause-delivered suggestions rated more helpful); reactive personalization preserves perceived autonomy, a strong predictor of trust. Behavioral signals (cursor, dwell, scroll) are reliable attention proxies — but in e-commerce dwell predicts intent-to-buy less reliably, so thesis treats dwell as attention proxy only.

**Grounding / hallucination**: hallucination is inherent to the model class (Ji et al. survey), so mitigation must be **structural** — hence hydration-over-generation + a three-check validation pipeline (identifier-existence, claim-stripping regex, embedding-based theme fidelity).

## 4. The Amazon Rufus Case — Exact Statistics + Years/Sources
**Scale / revenue:**
- Serves **over 300 million users** (RufusScaling, AWS Blog, **2024**).
- Credited with roughly **$12 billion in incremental sales in 2025** (RufusRevenue2025 — **PPC Land, 2025**). Thesis treats this as a market-sizing data point, not proof of product-market fit.
- COSMO knowledge graph reportedly improves internal relevance metrics by **60%** (COSMO — Amazon Science, **2024**).

**The four documented failure stats:**
- **32% accuracy** for picking the right product for a query.
- **28% price hallucination** rate (responses with a price quote the wrong price).
- **83% self-serving bias** toward Amazon-owned/branded products.
- **Review-theme fabrication** (themes not in the source corpus) — the most publicly criticized failure.

**Exact sources / years of these stats:**
- The **32% accuracy, 28% wrong price, and 83% own-brand** figures are cited primarily to `RufusWrong2024` = **ConsumerAffairs, "Amazon's AI Shopping Assistant Rufus Is Often Wrong," 2024** (bib note: "32% accuracy, 83% self-serving"; the article slug `110724` implies Nov 7, 2024). The intro also pairs it with `RufusConfidentlyWrong2024`.
- The **28% price hallucination** and **review-theme fabrication** are cited to `RufusConfidentlyWrong2024` = **Marketplace Pulse, "Amazon's Shopping AI Is Confidently Wrong," 2024** (bib note: "28% price hallucination").

So the precise answer: **the Rufus accuracy/price/bias statistics come from two 2024 articles — ConsumerAffairs (2024) and Marketplace Pulse (2024)** — not peer-reviewed studies. The thesis calls these "independent studies / external evaluations."

**Supporting consumer-survey stats (cited in intro & ch.2):**
- **55%** of consumers don't trust AI chatbot product recommendations (ConsumerDistrust2025 — Retail Media Breakfast Club, **2025**).
- **42%** see e-commerce AI assistants as upsell tools, not advisors (AIUpsell2025 — Tabor, **2025**).
- **71%** of retailers deployed conversational AI, but only **16%** of consumers use them regularly (ConsumerResistanceAI — Spanish Journal of Marketing, Emerald, **2024**).

**Rufus timeline argument:** launched **early 2024** as reactive; proactive "Help Me Decide" added **~10 months later** — matching the CHI 2024 timing finding (reactive first).

## 5. Key References to Be Able to Name
- **Burke (2002)** — *Hybrid Recommender Systems: Survey and Experiments* (7-pattern taxonomy; the switching hybrid).
- **Jaccard (1912)** — Jaccard similarity coefficient (used over buyer sets).
- **Manning, Raghavan & Schütze (2008)** — *Introduction to Information Retrieval* (cosine similarity).
- **Yao et al. (ReAct, ICLR 2023 / arXiv 2210.03629, 2022)** — ReAct loop (the agent reasoning/acting pattern).
- **Ji et al. (2023)** — *Survey of Hallucination in Natural Language Generation* (ACM Computing Surveys) — hallucination is inherent, mitigation must be structural.
- **Zheng et al. (2024, NeurIPS / MT-Bench, arXiv 2306.05685)** — LLM-as-a-judge; self-preference bias (justifies cross-family judge = Claude Haiku 4.5).
- **Marler & Arora (2010)** — Weighted Sum Method for Multi-Objective Optimization (the composite ranking).
- **Zhai et al. (HSTU, 2024, arXiv 2402.17152)** — generative recommenders / cascade ranking (two-stage retrieve-rerank).
- **Liu et al. (2024)** — *LLM Enhanced Recommender Systems: A Survey* (the three LLM roles).
- **Amazon Science / AWS (2024)** — Rufus technology + scaling blogs; **COSMO (2024)** commonsense KG.
- **Shopify Engineering (2024 generative recs; 2025 agentic systems)** — production two-stage + agentic UX.
- Market/UX: ConsumerAffairs (2024), Marketplace Pulse (2024), PPC Land (2025), Digiday (2025), Smashing Magazine (2026), CHI 2024 timing study.

Note for defense: the Rufus failure statistics rest on **two trade/industry articles from 2024**, not academic studies — a likely question from the committee. Also note one CHI 2024 and a few survey entries in `references.bib` have placeholder/anonymous author fields ("authors not specified"), which a committee may flag.

---

# APPROACH

I now have full evidence. Here is my analysis.

---

# Zalem: thesis-vs-code system analysis

## 1. Core idea (1-2 sentences)

A "grounded-by-construction" hybrid shopping recommender: a cheap classical engine generates candidate product identifiers under a tight latency budget, and an LLM advisor is constrained to *select and explain* from catalog-read tool results rather than generate product facts — so every price, rating, spec, and identifier the user sees is hydrated from the live Convex catalog, never from the model. The thesis frames this as the anti-Rufus design (`chapter4_system.tex:494-520`, `:296-299`).

## 2. Architecture / data flow

- **Client** — Next.js 16 / React 19, Convex reactive queries. Store pages subscribe to recommendation queries directly (`apps/web/src/app/(store)/page.tsx:13-14`, `apps/web/src/components/product/product-detail-client.tsx:35-43`, `cart/page.tsx:25`). (`chapter4_system.tex:61-67`)
- **Backend** — single Convex deployment. Two relevant subsystems:
  - **Classical engine** — `convex/recommendations.ts` (queries/crons) + `convex/recommendationHelpers.ts` (pure TS algorithms, no Convex imports; `recommendationHelpers.ts:1-3`).
  - **AI advisor** — `convex/ai/advisor.ts` action wrapping `@convex-dev/agent` (`agent.ts:13-29`) with 5 read-only tools (`tools.ts`).
- **External deps** — Clerk auth, OpenRouter inference (`chapter4_system.tex:49-51`).
- **Precompute** — daily crons write `productCoOccurrences` (Jaccard) and `trendingScore` (`recommendations.ts:415-476`).

## 3. CRITICAL — classical engine vs AI advisor

### (a) What the classical algorithms produce, and where their output is shown

| Algorithm | Code | UI surface |
|---|---|---|
| Content similarity (weighted 6-attr sum) | `recommendationHelpers.ts:53-80`, `recommendations.ts:24-62` (`similarProducts`) | "Similar products" on product detail page (`product-detail-client.tsx:35-37, 404-405`) |
| Co-occurrence Jaccard | `recommendationHelpers.ts:86-148`, `recommendations.ts:64-86` (`frequentlyBoughtTogether`) | "Frequently bought together" on product page (`product-detail-client.tsx:39-43`) |
| Time-decay trending | `recommendationHelpers.ts:152-167`, `recommendations.ts:88-112` (`trending`) | Homepage popularity row (`page.tsx:13, 36-37`) |
| Switching hybrid + MMR (cold-start fallthrough) | `recommendations.ts:113-245` (`forYou`) | Homepage "Recommended for you" (`page.tsx:14`); cart variant `forCart` (`cart/page.tsx:25`) |
| MMR diversity rerank | `recommendationHelpers.ts:240-273` | applied inside `similarProducts` and `forYou` |

These rails **never call an LLM**. The thesis states this explicitly: *"The homepage is built entirely from classical recommendation slots... None of these calls an LLM. The entire homepage renders from Stage 1"* (`chapter4_system.tex:689-695`).

### (b) Does the advisor consume classical candidates, or read the catalog independently?

**Both — but they are independent code paths.** The advisor (`advisor.ts:118-161`) does two things:
1. **`assembleContext`** (`advisor.ts:12-114`) reads the catalog *directly* on every request — current product (`products.get`), review summary, cart, recently-viewed — and injects it as a system message. This bypasses the classical engine entirely.
2. **Tools** the agent may call mid-conversation (`tools.ts`). Four of five read the catalog directly (`getProductDetails`, `searchProducts`, `getCartContents`, `getReviewsSummary`). Only **`getRecommendations`** (`tools.ts:59-102`) reaches into the classical engine — it dispatches to `api.recommendations.similarProducts` / `frequentlyBoughtTogether` / `trending` (`tools.ts:76-88`).

So the advisor consumes classical candidates **only opportunistically, when the model decides to call `getRecommendations`**. There is no automatic "classical candidates → advisor" feed; the advisor's default information source is its own direct catalog reads via `assembleContext` + the four direct tools.

### (c) Is the intuition correct?

**Mostly correct, with one connection point.** The accurate statement is:

- The classical algorithms power the store's product-recommendation **rails** on home / product / cart pages (`page.tsx`, `product-detail-client.tsx`, `cart/page.tsx`) — a self-contained path that never touches the LLM.
- The AI advisor is a **separate path** that primarily reads the catalog directly (`assembleContext` + 4 direct tools).
- The **single bridge** is the `getRecommendations` tool (`tools.ts:59-102`), which lets the advisor pull the same classical query outputs *on demand* into a conversation. The rails do not feed the advisor, and the advisor does not feed the rails.

So "two separate paths" is the right mental model; they share the classical *query functions* via one optional tool, not a pipeline.

## 4. Two-stage "candidates → re-rank/explain" — thesis/code mismatch

This is where the thesis prose **overstates** the code. Flag explicitly:

- **The two-stage figure (`chapter4_system.tex:291-348`) implies a generic Stage 1 (classical candidates) → Stage 2 (LLM rerank + explain) pipeline.** In the actual code this two-stage rerank **does not exist for the store rails** — and the thesis itself concedes this at `:689-695` ("the entire homepage renders from Stage 1"). The only "rerank" in the rails is **MMR, a classical algorithm** (`recommendationHelpers.ts:240-273`, called at `recommendations.ts:58, 237`), not an LLM.

- **The LLM never numerically re-ranks classical candidates.** In the advisor path, `getRecommendations` returns classical results and the model writes prose citing some of them (`tools.ts:92-100`). That is *selection + explanation*, not re-ranking. There is no scoring fusion of model output with classical scores anywhere.

- **RRF claim is unsupported by code.** `chapter4_system.tex:270-272` claims `forYou` combines signals with "Reciprocal Rank Fusion with k=60". Grep finds **no RRF anywhere** in the backend. The actual `forYou` (`recommendations.ts:155-240`) uses **additive raw-score accumulation** (`candidateScores.set(id, prev + score)`, `:169-172`), a flat `0.5`/`0.3` weight per tier (`:187, 202`), a `×1.3` category-preference boost (`:216`), then MMR. No `k=60`, no rank fusion.

- **Switching-hybrid thresholds mismatch.** The callout (`:276-289`) says Warm = ≥4 purchases → co-occurrence, Lukewarm = 1–3 → content. Code (`recommendations.ts:158, 176, 191`) uses **≥3 → co-occurrence**, **1–2 → content**, plus an undocumented **favorites-based tier 3** for zero-purchase users with favorites before falling through to trending. Minor but real.

**Net:** the grounding/hydration claim (LLM never sources facts; everything hydrated from catalog) is fully backed by code (`tools.ts` returns only catalog reads; `assembleContext`; validation in `:606-672`). The "two-stage LLM-rerank pipeline" and "RRF k=60" framing is the part that oversells what the code does — the rails are pure classical (incl. MMR), and the LLM's role is candidate *selection/explanation*, not re-ranking.

## 5. The two functionalities to spotlight

Recommend these two:

**1. The grounded AI advisor (hydration-over-generation + 3-stage output validation).** This is the thesis's central contribution and the most defensible end-to-end story: read-only tools that return only catalog data (`tools.ts`), `assembleContext` (`advisor.ts:12-114`), and the identifier-existence / claim-stripping / theme-fidelity validators (`chapter4_system.tex:606-672`). It is also the only feature backed by hard evaluation evidence — the grounding ablation (`:1034-1113`: ungrounded fabricates 162 claims at 67% DB-mismatch vs grounded 83 at 48%; factuality 0.76 vs 0.53). This directly answers "what does the architecture buy."

**2. The reviews → sentiment grounding pipeline (conflict-surfacing review summaries).** The clearest *novel, anti-Rufus* product feature and the most visually demonstrable: structured positives/negatives with counts + bipartite "divided opinions" conflicts (`chapter4_system.tex:542-576`, schema callout `:554-560`), generated offline by cron, then **embedding-verified against the real review corpus** before persistence (`:567-576`) — the same vector check reused as the `reviewThemeFidelity` validator. It shares `getReviewsSummary` with the advisor (`tools.ts:120-158`), so it doubles as evidence for feature #1's grounding.

**Why not behavior-cues → context-enrichment:** it is real and well-engineered (`chapter4_system.tex:350-434`, five client hooks), but the thesis admits the composite interest score is computed yet **not wired to behavior** — simple per-signal thresholds drive the UI instead (`:430-433`), and it produces only ambient UI nudges, not a grounded/measured outcome. Weaker to spotlight than the two above.

### Key files
- `/Users/mihai/dev/personal/zalem/packages/backend/convex/recommendationHelpers.ts` (pure classical algorithms)
- `/Users/mihai/dev/personal/zalem/packages/backend/convex/recommendations.ts` (rail queries; `forYou` switching hybrid `:113-245`; no RRF)
- `/Users/mihai/dev/personal/zalem/packages/backend/convex/ai/advisor.ts` (`assembleContext` `:12-114`)
- `/Users/mihai/dev/personal/zalem/packages/backend/convex/ai/tools.ts` (`getRecommendations` bridge `:59-102`)
- `/Users/mihai/dev/personal/zalem/packages/backend/convex/ai/agent.ts` (agent + 5 tools)
- `/Users/mihai/dev/personal/zalem/apps/web/src/app/(store)/page.tsx`, `.../components/product/product-detail-client.tsx`, `.../app/(store)/cart/page.tsx` (rail consumption)
- `/Users/mihai/dev/personal/zalem/thesis/chapters/chapter4_system.tex` (mismatches at `:270-272` RRF, `:276-289` thresholds, `:291-348` two-stage figure)

---

# MECHANICS

## Zalem backend — defense Q&A code notes

All references are `file:line`. Files live under `/Users/mihai/dev/personal/zalem/packages/backend/convex/` (backend) and `/Users/mihai/dev/personal/zalem/apps/web/src/` (client).

---

### (A) Review-summary pipeline

**What triggers (re)generation**
- A **daily cron**, not on-new-review. `crons.ts:23-28` registers `"generate review summaries"` at `0 4 * * *` (04:00 UTC) calling `internal.ai.reviewSummariesHelpers.generateAll`. There is no on-insert trigger anywhere — review writes do not call `invalidateSummary`/`generateForProduct`.
- `generateAll` (`reviewSummariesHelpers.ts:168-190`) asks `getProductsNeedingSummary` for the stale set, then fans out in chunks of `CHUNK_SIZE = 30` (`reviewSummariesHelpers.ts:166`) via `processChunk` (`reviewSummariesHelpers.ts:192-233`), which self-reschedules chunk-by-chunk (`:224-228`).

**Staleness check + min review count**
- `getProductsNeedingSummary` (`reviewSummariesHelpers.ts:47-74`). Skips products with `reviewCount < 3` (`:54`). A product is **stale if**: no summary exists, OR `existing.reviewCount !== product.reviewCount`, OR `Date.now() - existing.generatedAt > 7*24*60*60*1000` (7 days) — `:62-65`.
- Min review count is also re-checked inside the worker: `generateForProduct` returns early if `reviews.length < 3` (`reviewSummaries.ts:200-203`).

**From scratch vs incremental**
- **Always from scratch over the whole corpus.** `generateForProduct` fetches *all* reviews via `getAllReviewsForProduct` (`reviewSummariesHelpers.ts:32-45`, `withIndex("by_product").collect()`), re-embeds all of them (`reviewSummaries.ts:208-211`), and re-runs the full LLM extraction. The summary row is replaced wholesale: `upsertSummary` does `ctx.db.replace(existing._id, args)` (`reviewSummariesHelpers.ts:142-143`). No incremental/delta update path exists. The staleness trigger fires whenever `reviewCount` changes, so a single new review causes a full recompute on the next nightly run.

**Embeddings — what, model, dimensions**
- **Two things get embedded, both with the same model:** (1) every review's text (`reviewSummaries.ts:208-211`), and (2) the LLM-claimed theme labels (`reviewSummaries.ts:135-139`, `themeTexts = themes.map(t => t.theme)`).
- Model: `embeddingModel = openrouter.textEmbeddingModel("google/gemini-embedding-001")` (`ai/models.ts`, last line). Embeddings are produced by `embedMany` from the `ai` SDK.
- Review embeddings are persisted onto each review row via `setReviewEmbeddings` (batches of 25, `reviewSummaries.ts:214-223` → `reviewSummariesHelpers.ts:78-92`). The `reviews` vector index declares `dimensions: 3072` (`schema.ts:72-76`). Note the separate `products.by_embedding` index is `dimensions: 128` (`schema.ts:54-58`) — a different/unrelated embedding space.

**Cosine similarity → theme validation (threshold + min-count)**
- `validateThemesWithEmbeddings` (`reviewSummaries.ts:127-162`). For each theme it embeds the label, then counts reviews with `cosineSimilarity(themeEmb, reviewEmb) > 0.35` (`:149-150`). A theme is "verified" only if `semanticMatches >= 2` (at least 2 reviews semantically match), else "failed" (`:154-158`). `cosineSimilarity` is hand-rolled at `:164-175`. Important nuance: this compares theme embeddings against the **in-memory `reviewEmbeddings` from this same run** (`reviewEmbData`, `reviewSummaries.ts:247-250`), not a DB vector search.
- There is also a separate **quote** validation (`validateQuotes`, `:83-113`): exact case-insensitive substring match, with an 80%-word `fuzzyMatch` fallback (`:116-121`).

**What `validationPassed` gates**
- It is **only a flag, not a hard block.** `validationPassed = quoteValidation.failed <= 1 && themeValidation.failed === 0` (`reviewSummaries.ts:257`). The summary is written regardless (`upsertSummary` at `:271-288`), with `validationPassed` and `validationDetails` stored (`schema.ts:110-118`). Even quotes that fail substring verification are *still kept* in the output — `validateQuotes` pushes them into `cleaned` anyway (`reviewSummaries.ts:105-109`). Nothing downstream reads `validationPassed` to suppress display; the advisor context (below) ignores it entirely.

**Extraction model:** themes come from `selectModel("review_summary")` → `FLASH_LITE = "google/gemini-3.1-flash-lite-preview"` (`ai/models.ts`), via `generateObject` with the Zod schema (`reviewSummaries.ts:234-238`). Stored `modelUsed` string is hardcoded at `:280`.

---

### (B) Advisor context assembly

- **Builder:** `assembleContext` in `ai/advisor.ts:12-114`. **Called on every advice request** — `requestAdvice` invokes it unconditionally at `advisor.ts:133-136`, with the explicit comment "assemble context on every request (not saved to thread)" (`:132`).
- **Not persisted — rebuilt each time.** The assembled system message is passed inline as `messages` to `thread.streamText` (`advisor.ts:147-158`) and is *not* saved to the thread; only the user question + model deltas are saved (`saveStreamDeltas`, `:152-157`). Few-shot examples are prepended only on the first message (`advisor.ts:139-141`).
- **Where it gets built into the model context:** the system message is constructed at `advisor.ts:108-113` (role `"system"`, body `"Current user context (...):\n\n" + contextParts.join`), then injected via the `messages` array at `advisor.ts:147-151`.
- **Fields packed (in order):**
  1. **Current product** — only if `args.productId` present. Fetched `api.products.get` (`advisor.ts:24-26`); packs title, brand, category/subcategory, price (with original/discount), rating, reviewCount, 200-char-truncated description, and first 5 specs (`advisor.ts:27-47`).
  2. **Review themes** — `api.ai.reviewSummariesHelpers.getSummary` (`advisor.ts:50-52`; that query at `reviewSummariesHelpers.ts:7-15`). Packs positives, negatives, conflicts ("divided opinions"), and bestFor (`advisor.ts:53-65`). Does **not** check `validationPassed`.
  3. **Cart contents** — `api.cart.list` (`advisor.ts:73-88`), title/price/qty per line.
  4. **Recently viewed** — only from `args.recentlyViewedIds` (capped to 5), via `api.products.getByIds` (`advisor.ts:91-104`).
- If nothing resolves, returns `[]` (no context message) — `advisor.ts:106`.

---

### (C) Behavior tracking — signals vs advisor context

**Client capture hooks:**
- `use-product-engagement.ts:18-37` aggregates per-product engagement: `dwellTimeMs` (`use-dwell-time.ts`), `scrollDepth` (`use-scroll-depth.ts`), `cursorHoverMs` (set equal to dwell, `use-product-engagement.ts:37`).
- `use-behavior-tracker.ts` holds session state (`productsViewed` map, `currentPage`, `categoryHistory`) and `viewedReviews` flag (`:106-115`). It **flushes to the backend** via `api.behavior.upsertSession` every 5s (`FLUSH_INTERVAL_MS = 5_000`, `:11`; interval `:151-154`), plus on page change (`:157-159`) and on tab hide (`:162-170`). Session id is a `sessionStorage` UUID (`:52-60`).

**Storage:** `behavior.ts upsertSession` (`behavior.ts:5-67`) upserts into `behaviorSessions` (`schema.ts:196-214`), merging `productsViewed` by max/cumulative values (`behavior.ts:30-47`).

**Two separate paths — and a correction to the assumption:**
- **Behavior signals → UI nudges:** correct. `use-readiness-signals.ts` consumes the in-memory `BehaviorTrackerState` (not the DB) to decide `shouldPulseAdvisor` and which chips show — dwell thresholds 5s/15s (`:42-47`), scroll >0.5 (`:50-54`), review engagement chip (`:57-63`), 3+-same-category comparison (`:66-78`), cart deliberation (`:81-87`).
- **Advisor context does NOT read `behaviorSessions`.** This is the part to correct in the script: the persisted session/nav state (`behaviorSessions.currentPage`, `productsViewed`, etc.) is written by the tracker but is **never queried by the advisor** — `assembleContext` (`advisor.ts:12-114`) makes no call to `api.behavior.*`. The advisor's "recently viewed" instead comes from a **separate localStorage hook** `use-recently-viewed.ts` (key `zalem-recently-viewed`, `:5`), passed as `recentlyViewedIds` from `use-advisor.tsx:74-78`. Cart comes from `api.cart.list`, not from `behaviorSessions.cartProductIds` (which the tracker even flushes as an empty array, `use-behavior-tracker.ts:144`).

So the accurate framing: **behavior signals drive UI nudges (client-side, in-memory) and are persisted to `behaviorSessions` for analytics; the advisor context is assembled independently each request from (current product, its review summary, live cart, and localStorage recently-viewed) — it does not consume the behavior-session/nav state.**

---

# EVALUATION

# Evaluation — Defense Deck Extract

Sources: `/Users/mihai/dev/personal/zalem/docs/eval-findings.md`, `thesis/chapters/chapter4_system.tex` (§ Evaluation / Results / Ablation, lines ~778–1140), `packages/eval/` harness (`promptfooconfig.yaml`, `promptfooconfig.ungrounded.yaml`, `src/scorers/factuality.ts`, `src/scorers/groundedness.ts`).

Note on numbers: `eval-findings.md` holds the early "directional" run; the thesis chapter holds the refreshed final numbers. Where they differ (e.g. best-config composite 0.870 vs 0.807, p95) I quote the **thesis chapter** as the faithful final, and flag the delta.

---

## 1. What the evaluation does (harness design)

- **Tool:** Promptfoo v0.119 driving a custom provider shim (`advisorProvider.ts`) that calls the *real* production advisor path in the Convex backend (system prompt + few-shots live in the agent, not in the eval config, so it tests the shipped code path).
- **Dataset:** `shopping-v1.yaml` — 25 questions across 7 categories (simple Q&A, product validation, comparison, recommendation, review summary, multi-turn, edge case). Nine of the 25 have two expected-tool variants, giving **34 test cases** per configuration.
- **Configuration sweep:** **8 configurations** varying 4 axes — model (gpt-oss-120b, gpt-oss-20b, gemini-3.1-flash-lite), reasoning effort (low/medium/high/none), step budget (8/12/15), and prompt variant (current / no-fewshot / be-efficient).
- **Total advisor calls:** 8 × 34 = **272 advisor invocations**, plus roughly **1,100 LLM-judge calls**. Cost ~$3 per full sweep (~half of it the judge).

**Scorers — two layers:**

- **6 programmatic (deterministic) scorers**, applied identically to every row: `hasFinalAnswer`, `groundedness`, `factuality`, `reviewThemeFidelity`, `toolCallEfficiency`, `expectedToolCoverage` (tool-call F1 vs expected tools).
- **5 LLM-as-judge rubrics** (0–5 scale, normalized to 0–1): completeness, helpfulness, tradeoff surfacing, tool appropriateness, tone. Judge model = **Claude Haiku 4.5**, deliberately a *different model family* from the candidates (gpt-oss / Gemini) to avoid self-preference bias. The judge sees only `{question, final answer}` — never the reasoning trace or tool calls — to prevent reward-hacking.

**Ablation setup (grounded vs ungrounded):** a 9th configuration run separately (`promptfooconfig.ungrounded.yaml`). It is identical to `gpt-oss-120b-medium` (same model, medium reasoning, 12-step budget, same few-shots, same system context) **except two things are removed:** (1) the agent gets **no tools** (`disableTools: true`), and (2) the prompt tells it to answer from conversation context and its own knowledge. This is the "chatbot without catalog access" / direct-generation pattern — the Rufus failure mode. Same 34 test cases, same judges, re-scored offline with the same fixed factuality scorer for a fair comparison.

---

## 2. Precise metric definitions (plain-language, one sentence each)

- **Specific claim / specific factual claim:** a concrete price or star-rating literal written in the answer text — e.g. "$299.99" or "4.5/5 stars" — as opposed to vague phrasing like "affordable" or "well-rated". (In code: a regex match for a `$`-price or an `x/5`-style rating.)
- **Claim that fails the DB / unverifiable against the catalog:** a price or rating in the answer that does **not** match the value stored in the store database for that product at the moment the row ran (within tolerance: ±$0.01 for price, ±0.1 for rating) — i.e. a number the store cannot back up. Measured by the `factuality` scorer comparing every claimed number against a database snapshot captured at run time.
- **Factuality:** the share of a response's specific price/rating claims that match the live database — 1.0 means every number checks out, 0.0 means all are fabricated. (`(total claims − fabricated) / total claims`.)
- **Groundedness:** the share of product identifiers cited in the answer that actually exist in the live Convex catalog — it catches invented product IDs, but only verifies *existence*, not whether the product or its price is *correct*.
- **Helpfulness (LLM judge):** how useful the answer is to a shopper making a purchase decision — rewards specific prices, ratings, comparisons, and actionable recommendations; penalizes vague hedging and generic sales-speak. (This is a *subjective reader* judgment, not a database check.)
- **Completeness (LLM judge):** whether the answer directly and fully addresses what was asked, penalizing evasive answers or unnecessary clarifying questions.

Key contrast for the slide: **factuality and groundedness are checked against the real database (objective trust signal); helpfulness and completeness are an LLM's opinion of how the answer reads (subjective, secondary).**

---

## 3. The actual numbers

### Ablation — Grounded vs Ungrounded (same 34 test cases)

| Metric | Grounded | Ungrounded |
|---|---|---|
| Specific price/rating claims | **83** | **162** (~2×) |
| Claims not matching the store DB | **48%** | **67%** |
| Factuality mean | **0.76** | **0.53** |
| Judge helpfulness | **0.57** | **0.78** |
| Judge completeness | **0.70** | **0.89** |
| Latency p50 | 2.4 s | 1.4 s |

The decisive twist: **the LLM judges *prefer* the ungrounded (fabricating) configuration** — helpfulness 0.78 vs 0.57, completeness 0.89 vs 0.70 — because a confident, specific-sounding answer reads better than a careful grounded one. The judges reward exactly the failure the architecture exists to prevent. This is the thesis's strongest argument for the two-layer harness: **the database-backed programmatic checks carry the trust signal; judge scores are secondary and never the gate.**

Flagship example: asked the price of the phone the user is viewing, the ungrounded config produced a confident price table quoting the **Samsung Galaxy S24 Ultra at $1,199** and **iPhone 15 Pro at $999** — both pulled from the few-shot examples, priced from the model's world-memory, none of it in the store. Every claim in that row fails the DB check, and the table format makes it look authoritative.

Note: groundedness (ID-existence) does **not** discriminate here — both score 1.0, because the ungrounded model just repeats the one context ID and invents none; fabrication lives in prices/ratings, not ID syntax.

### Headline sweep results (thesis-final numbers)

- **Best config on composite:** Gemini 3.1 Flash-Lite baseline, composite **0.807** — even though it was originally treated as a cheap fallback. (`eval-findings.md` early run had it at 0.870; thesis chapter is the refreshed final.)
- Flash-Lite loses ~3.9 quality points to the #2 config (`no-fewshot` gpt-oss-120b, raw quality 0.815 vs 0.776) but wins on both penalty axes.
- **Cost/query:** **$0.0003** for Flash-Lite vs $0.0005–$0.0010 for the gpt-oss configs.
- **Latency p95:** **4.2 s** for Flash-Lite vs 4.2–12.1 s across the sweep; worst is gpt-oss-120b high-reasoning at 12.1 s p95.
- **Higher reasoning / looser steps are uniformly worse on composite:** gpt-oss-120b *high* reasoning is the worst at 0.492 (cost doubles, p95 12.1 s); *ms15* loose budget at 0.683 with quality below the ms12 default — disproving "more reasoning is always better".
- **Groundedness held across the whole sweep:** mean **≥ 0.89** (no config hallucinated product IDs at scale). The judge rubrics carry per-metric pass thresholds (completeness 0.6, helpfulness 0.6, tradeoff 0.5, tone 0.7); there is no single "groundedness threshold" gate — groundedness is reported as a mean.
- Every configuration ran well under the consumer-tolerance latency bound and well under one cent per query.

---

## 4. What "2× specific claims" means (plain words)

When you take away the tools and database access, the model does **not** go quiet or hedge — it gets *more* confident. It produced **162 hard price/rating statements versus 83** for the grounded system on the very same 34 questions: roughly **twice as many concrete, checkable claims**. But it has nothing real to base them on, so two-thirds of them (67%) are wrong against the actual store. The headline for the slide: **strip out grounding and the assistant talks twice as confidently and is wrong far more often** — exactly the trap (a fluent, authoritative-sounding answer built on fabricated numbers) the grounded architecture is designed to prevent.

---

# CONCLUSIONS

# Zalem Thesis — Conclusions Chapter (chapter5_conclusions.tex)

## Contributions
The prototype combines five structural components, plus an evaluation harness:

- **Two-stage recommendation pipeline** — classical candidate generation followed by LLM rerank and explanation.
- **Reactive-first advisor surface** — driven by lightweight behavior signals; AI advice is user-initiated, not auto-fired.
- **Review-summarization module** — grounded in real review text, with explicit conflict surfacing.
- **AI-assisted comparison flow** — no winner verdict.
- **Output-validation layer** — strips claims the model could fabricate from free text and checks every cited identifier against the live catalog.
- **Custom evaluation harness** — scores configurations on grounded quality, latency, and cost across a canonical eight-configuration sweep.

Key measured findings supporting the central claim ("trustworthy AI shopping is a problem of integration discipline, not model capability"):
- 7 of 8 configurations stay within p95 latency of 7.5 s (only gpt-oss-120b at high reasoning effort rises to 12.1 s).
- Every configuration costs well under one cent per query and stays grounded (groundedness mean ≥ 0.89 for all).
- An unanticipated finding: within those bounds, the cheaper/lighter configuration is often the right choice — higher reasoning effort and looser step budgets are uniformly worse on composite score, disproving the "more reasoning is always better" assumption.

## Limitations
The chapter states the biggest scope limits explicitly:
- **No human-subject evaluation.**
- **No offline-IR comparison** for the classical recommendation algorithms.
- **Small seeded catalog** — about 200 products and 4,836 AI-generated reviews.
- **Single-deployment replication** — validated against only one production deployment as comparison.

The thesis does not claim to address these; it claims the reported engineering work holds up under measurement within these limits.

## Future Work
- **Within-subjects user study** (perceived usefulness, trust, intrusiveness, purchase confidence) — named the most valuable extension, since engineering-quality metrics do not predict UX outcomes.
- **Offline recommender-quality metrics** (Hit Rate@5, NDCG@10, catalog coverage, intra-list diversity, popularity-bias Gini) against a held-out temporal split of the seeded order data — low-risk, shares the same data pipeline.
- **Extend the harness to multi-category / non-electronics catalogs** to test whether the theme-fidelity scorer and comparison flow generalize.
- **Richer behavior signals** (mouse trajectory, eye tracking, repeated-visit patterns) — cheap to capture, worth evaluating once human-subject data is available.
- **Production hardening** at 10,000+ products and traffic load (documented in `docs/scale-considerations.md`).
- **Turn the eval harness into a CI regression gate** with Pareto comparison against a reference run.

File: /Users/mihai/dev/personal/zalem/thesis/chapters/chapter5_conclusions.tex (final chapter; chapters discovered: 1 intro, 2 background, 3 foundations, 4 system, 5 conclusions).

---

# STORECARD

Everything gathered. Here is the exact structure.

# Product CARD — `/Users/mihai/dev/personal/zalem/apps/web/src/components/product-card.tsx`

This is THE card used in every grid and rail. Grid wrapper: `/Users/mihai/dev/personal/zalem/apps/web/src/components/product-grid.tsx`. Horizontal rail wrapper: `/Users/mihai/dev/personal/zalem/apps/web/src/components/product-row.tsx`.

## Outer container
```jsx
<div className="bg-card group relative flex flex-col overflow-hidden rounded-lg border">
```
- White/`bg-card` surface, `rounded-lg` (0.5rem), 1px default `border` (`border-border`), `overflow-hidden`, NO drop shadow on the card itself. Vertical flex column. `group` enables image hover-zoom.
- In grids: 4 columns at `xl` (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`), `gap-4` (1rem).
- In rails (product-row): each card is wrapped in `w-56 shrink-0` (224px fixed width), `gap-4` between cards.

## Image area
```jsx
<Link href={`/products/${product._id}`} className="bg-muted relative aspect-square overflow-hidden">
  <Image src={product.images[0]} alt={product.title} fill
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
    className="object-cover transition-transform group-hover:scale-105" />
</Link>
```
- Perfectly square (`aspect-square`), `bg-muted` placeholder background, image `object-cover`, zooms to `scale-105` on card hover.

## Badge overlays (top-left, stacked)
```jsx
{product.discountPercent != null && product.discountPercent > 0 && (
  <Badge variant="destructive" className="absolute top-2.5 left-2.5">
    -{product.discountPercent}%
  </Badge>
)}
{product.isDeal && <Badge className="absolute top-2.5 left-2.5 mt-7">Deal</Badge>}
```
- Discount badge: top-left at `top-2.5 left-2.5` (10px inset). `variant="destructive"` = soft red: `bg-destructive/10 text-destructive` (tinted-red pill on light red bg, NOT solid). Text like `-25%`.
- "Deal" badge: same top-left corner but pushed down with `mt-7` (so it sits below the discount badge). Default variant = solid `bg-primary text-primary-foreground`.
- Badge shape (from optics `badge.tsx`): `h-5 rounded-full px-2 py-0.5 text-[0.625rem] font-medium inline-flex items-center` — a tiny fully-rounded pill, 10px text.
- There is NO "new" badge in this codebase. Only discount % and "Deal".

## Wishlist / heart (top-right)
```jsx
<button className={cn(
  "absolute top-2.5 right-2.5 cursor-pointer rounded-full bg-white/80 p-2 shadow-sm transition-colors hover:bg-white dark:bg-black/50 dark:hover:bg-black/70",
  isFavorited ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-red-500",
)}>
  <motion.div animate={{ scale: isFavorited ? [1,1.3,1] : 1, rotate: isFavorited ? [0,-10,10,0] : 0 }} transition={{ duration: 0.3 }}>
    <Heart className="size-[18px]" fill={isFavorited ? "currentColor" : "none"} />
  </motion.div>
</button>
```
- Circular translucent white button `bg-white/80` with `shadow-sm`, `p-2` padding, at `top-2.5 right-2.5`.
- Heart icon 18px. Grey (`text-muted-foreground`) when not favorited; solid red (`text-red-500`, `fill="currentColor"`) when favorited.

## Info block
```jsx
<div className="flex flex-1 flex-col gap-2 p-3.5">
```
- Padding `p-3.5` (14px), vertical stack with `gap-2` (8px), flexes to fill height.

### Title
```jsx
<Link className="line-clamp-2 min-h-[2.5rem] text-[13px] font-medium leading-snug hover:underline">
  {product.title}
</Link>
```
- `line-clamp-2` (max 2 lines), reserves `min-h-[2.5rem]` so cards align. 13px, `font-medium`, `leading-snug`. Underlines on hover.

### NOTE on brand
The card receives `product.brand` in its data type but **does NOT render brand** anywhere. Brand only appears on the detail page. So omit brand from the card illustration.

### Rating
```jsx
<div className="flex items-center gap-1.5">
  <StarRating defaultValue={Math.round(product.rating)} size="sm" disabled />
  <span className="text-muted-foreground text-xs">({product.reviewCount})</span>
</div>
```
- 5 stars, `size="sm"` = each star `h-4 w-4` (16px), `gap-2` between stars, `fill-current stroke-[1.5px]`.
- Filled stars: `text-yellow-400`. Empty stars: `text-muted` (light grey). Rounds rating to nearest whole star (no half-stars).
- Review count in parentheses, `text-xs` grey: e.g. `(128)`.

### Price
```jsx
<div className="mt-auto flex items-baseline gap-2">
  <span className="text-xl font-bold tracking-tight">{product.price.toFixed(2)} lei</span>
  {product.originalPrice && (
    <span className="text-muted-foreground text-sm line-through">
      {product.originalPrice.toFixed(2)}
    </span>
  )}
</div>
```
- `mt-auto` pushes price+button to the bottom.
- Current price: `text-xl` (20px) `font-bold tracking-tight`, format `199.99 lei`.
- Original price (only if discounted): smaller `text-sm`, grey, `line-through`, no "lei" suffix.

### Add-to-cart button
```jsx
<Button size="lg" className="mt-1 w-full text-sm" onClick={handleAddToCart} disabled={product.stock === 0}>
  <ShoppingCart className="mr-1.5 size-4" />
  {product.stock === 0 ? "Out of stock" : "Add to cart"}
</Button>
```
- Full-width primary button, `mt-1` gap above. Cart icon (16px) + label.
- Optics default Button variant = glossy primary: radial/linear gradient `from-primary/70 to-primary/95`, `border-primary`, `inset-shadow-white/25`, `shadow-md`, `rounded-lg`, white text with subtle text-shadow. `size="lg"` = `h-8` height. Disabled state = `opacity-50` with "Out of stock".

## Card visual summary for the illustration
Square photo on top with a small red `-NN%` pill (and optional purple/primary "Deal" pill below it) in the top-left, a circular translucent white heart button top-right. Below the image, 14px padding: a 2-line product title (13px medium), a row of 5 small yellow stars + grey `(count)`, then a bold 20px price `XX.XX lei` with a struck-through grey original price beside it, and a full-width glossy primary "Add to cart" button with a cart icon at the bottom. Whole card is a white rounded-lg panel with a thin grey border and no shadow.

---

# DETAIL page — `/Users/mihai/dev/personal/zalem/apps/web/src/components/product/product-detail-client.tsx`
(route: `app/(store)/products/[id]/page.tsx`)

Layout, top to bottom:
- **Breadcrumb** row: `Home / Category / Title` (`text-sm` grey, last crumb `text-foreground line-clamp-1`).
- **Two-column grid** `grid gap-8 lg:grid-cols-2`:
  - Left = **gallery**: large `aspect-square rounded-xl bg-muted` main image; below it a horizontal thumbnail strip (`size-16` / 64px squares, `rounded-lg border-2`, selected gets `border-primary ring-2 ring-primary/20`; hover previews the image).
  - Right = **info** (`space-y-4`): `h1` title `text-2xl font-bold`; rating row (sm StarRating + `4.5 (128 reviews)`, clickable, scrolls to reviews); price row `text-3xl font-bold` + struck `text-xl` original + `destructive` discount Badge; stock line (`text-green-600` in stock / `text-red-600` out); a `Separator`; actions row = full-width primary "Add to cart" (`h-11`) + square `outline` heart button (`h-11`, turns red when favorited); then **Brand** line `Brand: <bold value>`.
- **Sticky section tab nav** (`sticky top-16`, backdrop blur, bottom border): tabs Description / Specifications / Reviews; active tab `text-primary border-primary` underline.
- **Sections** (`space-y-16`): Description paragraph; Specifications as a striped key/value table (`rounded-lg border`, alternating `bg-muted/20` rows, label `w-44` grey); Reviews section.
- **Below the container, full-width** (`space-y-10 py-10`): `ProductRow` rails for "Frequently bought together", "Similar products", "Recently viewed" — each rail is built from the same `ProductCard`.

Optics primitive source files (for exact class strings): `/Users/mihai/dev/personal/zalem/packages/ui/src/components/optics/badge.tsx`, `button.tsx`, `star-rating.tsx`.