# CLASSICAL

# Zalem Classical Recommendation Engine — Exact Mechanics

Two files: `recommendationHelpers.ts` (pure algorithms, no Convex), `recommendations.ts` (Convex query/action wrappers + crons). All algorithms are deterministic DB/math — **no LLM calls anywhere in either file**.

## 1. Content similarity (similar products)
`contentSimilarity()` — `recommendationHelpers.ts:53-63`. It is a **weighted sum of 7 attribute signals** (not cosine). Exact weights:

```
0.25 * (category equal ? 1 : 0)          // exact category match
0.20 * jaccard(tags)                      // tag overlap
0.15 * jaccard(useCases)                  // use-case overlap
0.10 * jaccard(goodFor)                   // goodFor overlap
0.10 * (brand equal ? 1 : 0)              // exact brand match
0.10 * priceProximity(price, maxRange)    // price closeness
0.10 * ratingProximity(rating)            // rating closeness
```
Weights sum to 1.0. Attributes compared: **category, tags, useCases, goodFor, brand, price, rating**.

Sub-measures:
- `jaccard(a,b)` = |A∩B| / |A∪B|, returns 0 if both empty — `:30-40`
- `priceProximity(a,b,maxRange)` = `1 - min(|a-b|/maxRange, 1)`; returns 1 if maxRange≤0 — `:44-47`. `maxRange` = max price among same-category candidates (`recommendations.ts:39`).
- `ratingProximity(a,b)` = `1 - |a-b|/4` (4 = full 1–5 star span) — `:49-51`

`rankBySimilarity()` excludes the target, scores all candidates, sorts desc, takes top `limit` — `:65-80`.

## 2. Co-occurrence / frequently bought together
`buildCoOccurrenceMatrix(orders, minSupport)` — `recommendationHelpers.ts:86-131`. **Jaccard over the set of orders containing each product** (order-level co-occurrence, dedup per order at `:96`):

```
score(a,b) = pairCount(a,b) / (orderCount(a) + orderCount(b) - pairCount(a,b))
```
- `pairCount` = number of orders containing both a and b (`:113-120`).
- Threshold: pairs with `count < minSupport` are skipped (`:114`). `minSupport = 2` is passed in the cron (`recommendations.ts:424`) — a pair must appear in ≥2 orders.
- Stored bidirectionally (`:122-128`).
- `getTopCoOccurrences(matrix, topN)` keeps top `topN=20` related products per product (`:133-148`, topN set at `recommendations.ts:425`).

Read paths: `frequentlyBoughtTogether` query reads the precomputed `productCoOccurrences` table by `by_product_and_score` index, top `limit` (default 4) — `recommendations.ts:64-86`.

## 3. Trending (exponential time decay)
`computeTrendingScores(purchases, now, lambda)` — `recommendationHelpers.ts:152-167`:

```
score(product) = Σ over purchases  exp(-lambda * ageDays)
ageDays = (now - purchase.timestamp) / 86_400_000
```
- **lambda = 0.05 per day**, global, applied uniformly (`recommendations.ts:459`). There is no per-category lambda.
- Half-life = ln(2)/0.05 ≈ **13.86 days**.
- Each purchase line item contributes; timestamp = `order.createdAt` (`recommendations.ts:449-457`).
- `trending` query sorts products by `trendingScore`, falling back to raw `purchaseCount` if score missing — `recommendations.ts:106-110`. Optional `category` filter just narrows the product set (`:97-104`); the decay math itself is global.

## 4. "For you" — switching hybrid
`forYou` query — `recommendations.ts:113-245`. Anonymous users → global trending by `purchaseCount` (`:120-121`).

**Warmth tiers (mutually exclusive switch on signal strength):**
- **Tier 1 — purchaseCount ≥ 3** (`:158`): for up to 10 recent purchased IDs, pull top-5 co-occurrences each; accumulate **+= co.score**, skipping already-purchased (`:160-175`).
- **Tier 2 — purchaseCount ≥ 1** (`:176`): for each purchased product, take 20 same-category products; accumulate **+= 0.5** each (`:178-190`).
- **Tier 3 — favorites > 0** (`:191`): for up to 5 favorites, take 20 same-category products; accumulate **+= 0.3** each (`:193-205`).
- Cold fallback: global trending by `purchaseCount` (`:242-243`).

`purchaseCount` = distinct delivered-order product IDs (`:147`).

**Combination is additive accumulation into a `Map`, NOT RRF** — `candidateScores.set(id, (get(id) ?? 0) + score)` at `:169-172, 187, 202`. No rank-reciprocal anywhere.

**Category boost:** if user has `userPreferences`, any candidate whose category is in `favoriteCategories` is **multiplied by 1.3** (`:211-218`).

**MMR rerank:** sort accumulated scores desc, take `limit*2`, then `applyMMR(withMeta, 0.7, limit)` (`:221-237`).

`applyMMR(candidates, lambda, limit)` — `recommendationHelpers.ts:240-273`. Greedy MMR, **lambda = 0.7**:
```
mmrScore = lambda * relevance - (1 - lambda) * maxSim(candidate, alreadySelected)
```
where `itemSimilarity` is categorical (`:231-238`): **same brand = 1.0, else same category = 0.5, else 0.0**. First item = highest relevance; then iteratively pick max `mmrScore` (`:254-270`). Same MMR (lambda 0.7) is also used by `similarProducts` at `recommendations.ts:58`.

## 5. UI placement (all LLM-free)
- **Home** (`apps/web/src/app/(store)/page.tsx:13-14`): `trending` rail + `forYou` rail.
- **Product detail** (`apps/web/src/components/product/product-detail-client.tsx:35-39`): `similarProducts` (content+MMR) and `frequentlyBoughtTogether` (co-occurrence) rails.
- **Cart** (`apps/web/src/app/(store)/cart/page.tsx:25`): `forCart` — aggregates top-10 co-occurrences per cart item, additive `+= co.score`, excludes items already in cart, sorts desc (`recommendations.ts:247-289`).

All five are Convex `query`/DB reads + the pure math above. No `ctx.runAction`, no `ai.*` import, no model call in either file.

## 6. Crons (`packages/backend/convex/crons.ts`)
- `"recompute co-occurrences"` — `0 3 * * *` (daily 03:00 UTC) → `recommendations.recomputeCoOccurrences`. Clears `productCoOccurrences`, rebuilds matrix (minSupport 2, topN 20), reinserts in batches of 200 (`recommendations.ts:415-442`). Writes the `productCoOccurrences` table.
- `"recompute trending scores"` — `15 3 * * *` (daily 03:15 UTC) → `recommendations.recomputeTrendingScores`. Computes decay (lambda 0.05), rounds to 3 decimals, patches `products.trendingScore` in batches of 100 (`:444-476`).
- (Related, not a recommendation rail: `"generate review summaries"` `0 4 * * *` → `ai.reviewSummariesHelpers.generateAll` — this is the only LLM cron, separate from the classical engine.)
- `deriveAllUserPreferences` / `initialize` exist (`:478-505`) but `deriveAllUserPreferences` is **not** on a cron — only run via the one-shot public `initialize` action after seeding. User preferences (favoriteCategories top-3, priceRange, favoriteBrands top-5, interestTags top-10) come from `derivePreferences()` (`recommendationHelpers.ts:181-227`).

---

# BEHAVIOR

# Zalem behavior-tracking & context-assembly — defense Q&A reference

## 1. Client hooks (each: action, mechanism, returns)

### `use-dwell-time.ts` — cursor hover time on an element
- **Action recorded:** how long the cursor hovers over a product element.
- **Mechanism:** `mouseenter`/`mouseleave` listeners (`L31-32`); `setInterval` ticking `+100ms` while hovered (`TICK_INTERVAL_MS = 100`, `L5`, `L42-44`). On leave, `currentMs` folds into `cumulativeMs` and resets (`L23-29`).
- **Returns:** `{ ref, isHovered, dwellTimeMs }` where `dwellTimeMs = cumulativeMs + currentMs` (`L48`).

### `use-scroll-depth.ts` — max scroll depth on the page
- **Action recorded:** deepest fraction of the page the user scrolled (0–1).
- **Mechanism:** `window` `scroll` listener, passive (`L40`), throttled via `requestAnimationFrame` + `ticking` flag (`L18-38`). Computes `scrollY / (scrollHeight - innerHeight)`, clamps 0–1, keeps the running max in `maxRef` (`L25-36`). Resets to 0 on `pathname` change (`L12-15`).
- **Returns:** `{ scrollDepth }` (max so far) (`L44`).

### `use-viewport-tracking.ts` — time element is visible in viewport
- **Action recorded:** cumulative ms the element is at least `threshold` visible (default `0.5`).
- **Mechanism:** `react-intersection-observer` `useInView({ threshold })` (`L9`); `setInterval` `+100ms` while `inView` (`TICK_INTERVAL_MS = 100`, `L6`, `L14-16`).
- **Returns:** `{ ref, isInView, viewTimeMs }` (`L20`).

### `use-product-engagement.ts` — composes the three above per product
- **Action recorded:** combined per-product engagement.
- **Mechanism:** merges `dwellRef` + `viewRef` into one callback ref (`L23-29`); pulls `scrollDepth` from page-level hook.
- **Returns:** `{ ref, engagement }` where `engagement: ProductEngagement = { productId, dwellTimeMs, scrollDepth, cursorHoverMs (= dwellTimeMs, L37), viewTimeMs, isInView }` (`L31-41`).

### `use-behavior-tracker.ts` — session aggregator (see §2)
- **Action recorded:** aggregates products viewed, current page, category history; flushes to backend.
- **Returns:** `{ state, trackProduct, setViewedReviews, addCategoryView }` (`L172-177`). `trackProduct` merges by `Math.max` per metric (`L89-104`); `setViewedReviews` flips a per-product flag (`L106-115`); `addCategoryView` keeps last 20 categories (`L117-122`).

### `use-readiness-signals.ts` — UI nudge engine (see §3)
- **Returns:** `{ shouldPulseAdvisor, activeChips, dismissChip }` (`L89`).

### `use-recently-viewed.ts` — recently viewed list (see §4)
- **Returns:** `{ recentlyViewedIds, addToRecentlyViewed }` (`L33`).

## 2. Session aggregator: batching & flush (`use-behavior-tracker.ts`)

- **Mutation called:** `api.behavior.upsertSession` (`L67`, invoked `L139`).
- **Flush triggers:**
  - **Interval:** every `5_000ms` — `FLUSH_INTERVAL_MS = 5_000` (`L11`), `setInterval(flush, …)` (`L151-154`).
  - **On page change:** `useEffect` on `[pathname]` (`L157-159`).
  - **On tab hide/close:** `visibilitychange` → `hidden` (`L162-170`).
- **Guards:** no-op if `productsViewed.size === 0` or session id still `"ssr"` (`L127-128`). Errors silently swallowed (`L145-147`).
- **Session id:** `crypto.randomUUID()` in `sessionStorage` key `"zalem-session-id"` (`SESSION_KEY`, `L50-60`).
- **Payload written** (`L139-144`): `sessionId`, `clerkUserId` (optional), `currentPage`, `productsViewed[]` (`productId, dwellTimeMs, scrollDepth, cursorHoverMs, viewedReviews, timestamp`), `cartProductIds: []` (always empty from client — `L144`).

**Backend mutation `behavior.ts upsertSession`** (`L5-67`): looks up by `by_session` index (`L23-26`); if exists, **merges** `productsViewed` per product using `Math.max` for dwell/scroll/cursor/timestamp and OR for `viewedReviews` (`L36-43`), else pushes new (`L44-46`), then `patch` (`L49-55`); otherwise `insert` (`L57-64`).

**`behaviorSessions` table fields** (`schema.ts L196-214`): `clerkUserId?`, `sessionId`, `productsViewed[] {productId, dwellTimeMs, scrollDepth, cursorHoverMs, viewedReviews, timestamp}`, `currentPage`, `cartProductIds[]`, `updatedAt`. Indexes: `by_session` (`sessionId`), `by_user` (`clerkUserId`).

## 3. Readiness signals — exact rules (`use-readiness-signals.ts`)

`shouldPulseAdvisor` fires (any of):
- **Dwell:** current product `dwellTimeMs > 15000` on detail page, `> 5000` otherwise (`L42-47`).
- **Deep scroll:** detail page AND current product `scrollDepth > 0.5` (`L50-54`).
- **Comparison:** any category with `>= 3` products viewed (`L65-78`).

Suggestion chips (each suppressible once via `dismissChip`, dismissed set is session-permanent, `L26-31`):
- **`review_engagement`** — `"What do buyers think?"` — detail page AND `currentProduct.viewedReviews === true` (`L57-64`).
- **`comparison_behavior`** — `"Compare these products?"` — a category with `>= 3` viewed products; also sets pulse (`L72-78`).
- **`cart_deliberation`** — `"Need help deciding?"` — `hasCartItems` AND NOT on a product detail page (`L81-87`).

## 4. Recently viewed (`use-recently-viewed.ts`)

- **Storage:** `localStorage`, key `"zalem-recently-viewed"` (`STORAGE_KEY`, `L5`).
- **Cap:** `MAX_ITEMS = 10` (`L6`); dedupes then prepends, `.slice(0, 10)` (`L22-23`).

## 5. assembleContext (`ai/advisor.ts`)

- **Runs on every request:** called unconditionally inside `requestAdvice` handler, `L133-136` (function defined `L12-114`, comment "runs on every request" `L10`).
- **NOT persisted:** built as ephemeral `role: "system"` messages passed inline to `thread.streamText` via `messages` (`L139-151`); the action uses `saveStreamDeltas` only for the assistant reply, not these context messages. Comment confirms "assemble context on every request (not saved to thread)" (`L132`).
- **Fields packed** (into one system message, `L108-113`):
  1. **Current product** (`L22-48`) — `api.products.get`: title, brand, category/subcategory, price (+discount), rating, reviewCount, 200-char description, up to 5 specs.
  2. **Review themes** (`L50-66`) — `api.ai.reviewSummariesHelpers.getSummary`: positives, negatives, conflicts/"divided opinions", bestFor.
  3. **Cart contents** (`L73-88`) — `api.cart.list` (server-side, not the client's empty `cartProductIds`).
  4. **Recently viewed** (`L91-104`) — `api.products.getByIds` over client-passed `recentlyViewedIds`, capped to first 5 (`L93`).
- **Inputs** come from the request args `{ productId, recentlyViewedIds }` (`L119-124`), NOT from stored behavior.

**Honest point for defense:** `assembleContext` does **NOT** read the `behaviorSessions` table. There is no query against `behaviorSessions` anywhere in `advisor.ts`. The advisor context is assembled fresh per request from (a) the request's `productId`/`recentlyViewedIds` (current nav state) and (b) live server queries (`products.get`, `reviewSummariesHelpers.getSummary`, `cart.list`, `products.getByIds`). The behavior-tracking pipeline (`useBehaviorTracker` → `upsertSession` → `behaviorSessions`) feeds only the **client-side UI nudges** in `useReadinessSignals` (advisor pulse + suggestion chips) and is persisted for analytics — it does not flow into the LLM prompt. So: behavior signals drive UI nudges; the LLM context is session/nav state assembled fresh and thrown away after the call.

### Quick "which functions" map
- Record actions: `useDwellTime`, `useScrollDepth`, `useViewportTracking` → `useProductEngagement` → `useBehaviorTracker.trackProduct/setViewedReviews/addCategoryView` → `flush()` → `api.behavior.upsertSession` → `behaviorSessions`.
- Nudges: `useReadinessSignals(state, options)`.
- Generate context: `assembleContext()` inside `requestAdvice` action (`ai/advisor.ts`).

---

# EVAL

# Zalem evaluation harness — precise reference for defense Q&A

## 1. The harness

**Tool.** Promptfoo **v0.119** (`docs/eval-findings.md:56`), run via `bun --filter @zalem/eval eval` / `eval:sweep` / `eval:ablation`. Single canonical config `packages/eval/promptfooconfig.yaml`. Promptfoo runs the cartesian product of dataset rows × provider configs (`promptfooconfig.yaml:18`).

**How the provider calls the REAL advisor.** The provider is a custom JS shim, NOT a model call:
- `packages/eval/src/providers/advisorProvider.ts:86-119` — `callApi()` calls a Convex **action** `ai.evals.runOnce.runOnce` over `ConvexHttpClient` (`src/lib/convexClient.ts:30`), authenticated by `CONVEX_EVAL_SECRET` (auth bypass, `runOnce.ts:73-82`).
- `runOnce.ts:97-115` builds a **fresh `@convex-dev/agent` Agent per call** with the same production tools (`getProductDetails, searchProducts, getRecommendations, getCartContents, getReviewsSummary` from `../tools`) and the production system prompt + few-shots (`resolvePromptVariant`, `promptVariants.ts:43`). It mirrors `advisor.ts assembleContext` for the system context (`runOnce.ts:121-189`), then `generateText` non-streaming with `maxOutputTokens: 2048` (`runOnce.ts:198-206`). So the eval exercises the real production agent code path, just parameterized per-row.
- Returns a full blob: `finalText, parts[], usage, timings, dbSnapshot, toolCalls, stepsUsed, finishReason` (`runOnce.ts:282-315`), surfaced to scorers via `providerResponse.metadata` (`advisorProvider.ts:130-140`).

**Dataset size.** `src/datasets/shopping-v1.yaml` = **25 rows** across 6 categories (header `shopping-v1.yaml:5-7`: 6 simple_qa + 5 product_validation + 5 comparison + 5 recommendation + 3 review_summary + 1 edge_case). Thesis states **34 test cases per configuration** because 9 rows appear twice with different expected-tools (`chapter4_system.tex:748-749, 878-880`). (Note the thesis category table at `chapter4_system.tex:758-772` lists a slightly different 7-category breakdown including "multi-turn" — the YAML header at `shopping-v1.yaml:5` says multi-turn was deferred to v2; minor doc drift.)

**8-config sweep, 4 axes** (`promptfooconfig.yaml:23-117`, table `chapter4_system.tex:778-816`). Axes: **modelId, reasoningEffort, maxSteps (step budget), promptVariant.** The 8: baseline-flash-lite, gpt-oss-120b-low/medium/high, gpt-oss-20b-medium, oss-120b-tight (ms8, be-efficient), oss-120b-loose (ms15), oss-120b-no-fewshot. (Config file also defines a 9th provider `oss-120b-ungrounded` for the ablation, and `gpt-oss-120b-medium-no-fewshot`.)

**Call/cost totals.** Thesis: 8 × 34 = **272 advisor invocations + ~1,100 LLM-judge calls** (`chapter4_system.tex:783-784`). Findings log: a full sweep ≈ **419k tokens (180k advisor + 240k judge), ~$0.40** at the A/B scale (`eval-findings.md:187-189`); full 8-config + judge run ≈ **$3.00, of which the Haiku judge is ~50% (~$1.50)** because rubric calls multiply per-config × per-rubric (`eval-findings.md:394-398`).

## 2. The 6 deterministic scorers

Registered in `promptfooconfig.yaml:154-172` as `type: javascript`, `metric: programmatic`.

1. **`hasFinalAnswer`** (`src/scorers/hasFinalAnswer.ts:11-25`). Pass/1 if any `parts[]` entry is a non-empty `text` part OR `output.trim().length>0`; else 0. Catches the maxSteps-cutoff bug (agent burns budget on tool calls, emits no final text).

2. **`groundedness`** (`src/scorers/groundedness.ts:27-61`). Regex extracts cited product IDs `PRODUCT_ID_REGEX = /\bk[0-9a-z]{31}\b/g` (`:16`). Each unique cited ID is **looked up live** via `convex.query(products.get)` (`:41`). Score = `grounded / cited` = existing IDs ÷ cited IDs (`:51`); pass iff zero missing. No citations → vacuously 1.0 (`:30-35`). This is the scorer aimed at the Rufus hallucination failure (`:1-3`).

3. **`factuality`** (`src/scorers/factuality.ts`). **Regex for $/rating literals vs the run-time DB snapshot.** Price regex `/\$\s?(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/g` (handles thousands separators, `:14`); rating regex `/(\d(?:\.\d)?)\s*(?:\/\s*5|stars?|★)/gi` (`:15`). Truth set = `metadata.dbSnapshot` (`{id:{price,rating}}` captured pre+post run in `runOnce.ts:35-46, 91, 224`). **Tolerances: PRICE_TOLERANCE = $0.01, RATING_TOLERANCE = 0.1** (`:16-17`); a claim matches if `|truth − claim| ≤ tol` against ANY snapshot value (`:37-42`). Score = `(totalClaims − fabricated) / totalClaims` (`:53`); pass iff `fabricated===0`. No claims → 1.0 (`:29-35`).

4. **`reviewThemeFidelity`** (`src/scorers/reviewThemeFidelity.ts`). Only runs if row sets `checkReviewFidelity: true` + `productId` (`:53-60`). Regex `THEME_SIGNAL`/`REVIEW_SIGNAL` extract up to 8 reviewer-claim sentences (`:22-34`). Calls Convex action `ai.evals.checkThemes` to **embed each theme and count semantic matches against the product's review corpus** (`:72-76`). A theme is grounded if `semanticMatches ≥ MIN_MATCHING_REVIEWS = 2` (`:51, 86`). Score = `grounded / themes` (`:87`); pass iff none fabricated.

5. **`toolCallEfficiency`** (`src/scorers/toolCallEfficiency.ts`). Operates on `metadata.parts` tool-call entries. `dedupeRatio = unique / total` (dedupe by `toolName::JSON(args)`, `:27-33`); budget: `cap = vars.maxAcceptableToolCalls ?? 6`, `budgetScore = 1` if within cap else `max(0, 1 − overBudget/cap)` (`:35-37`). **Score = 0.6·dedupeRatio + 0.4·budgetScore** (`:40`); pass iff dedupeRatio≥0.8 and not over budget. Not a hard gate — contributes to composite.

6. **`expectedToolCoverage` (F1)** (`src/scorers/expectedToolCoverage.ts`). Replaces Promptfoo's built-in tool-call-f1 because the trace shape is custom (`:1-5`). `precision = |called∩expected|/|called|`, `recall = |called∩expected|/|expected|`, `F1 = 2PR/(P+R)` (`:67-70`). Score = F1; pass iff `F1 ≥ F1_THRESHOLD = 0.8` AND no forbidden tools (forbidden = hard 0, `:38-45`). Empty-expected edge cases score 1.0 (`:48-65`).

## 3. The LLM-judge rubrics

Defined in `defaultTest.assert` as `type: llm-rubric` (`promptfooconfig.yaml:181-219`). **The config defines 4 rubrics**: `judge_completeness` (thr 0.6), `judge_helpfulness` (0.6), `judge_tradeoff_surfacing` (0.5), `judge_tone` (0.7). The thesis text claims **5** by adding "tool appropriateness" (`chapter3_foundations.tex:416`, `chapter4_system.tex:860-861`) — but the config comment explicitly states tool-appropriateness is **intentionally NOT** judged by an LLM; it is covered by the programmatic `expectedToolCoverage` scorer instead (`promptfooconfig.yaml:177-179`). This is a known thesis/code discrepancy worth flagging if asked.

**Judge model:** `openrouter:anthropic/claude-haiku-4-5` (`promptfooconfig.yaml:151`). **Cross-family** deliberately — Haiku (Anthropic) judges gpt-oss (OpenAI lineage) + Gemini candidates to avoid **self-preference / within-family bias** (`promptfooconfig.yaml:148-149`; `chapter3_foundations.tex:417-422` cites `LLMJudgeSurvey2024`).

**What the judge sees:** **only `{question, final output}`** — never the reasoning trace or tool calls, to prevent reward-hacking via long reasoning and prestige bias (`promptfooconfig.yaml:175-176`; `chapter3_foundations.tex:422-424`; `eval-findings.md:158-160`).

## 4. The composite score

Weights live in code (`src/reports/thesisExport.ts:24-30`), applied at `:225-231`:

```
composite = 0.30·quality + 0.25·correctness + 0.20·(1−costPenalty)
          + 0.15·(1−latencyPenalty) + 0.10·efficiency
```

- **quality** = mean of the LLM-judge (llm-rubric) scores (`:156`).
- **correctness** = mean of the programmatic non-efficiency scorers (`:158`).
- **efficiency** = mean of F1/dedupe scorers (`:154-157`).
- **Penalty axes:** `costPenalty` and `latencyPenalty` are **min-max normalized linearly across the sweep** — `(a.avg − min)/(max − min)` over `avgCostUsd` and `avgLatencyMs` (`:216-224`). So cost/latency enter with effective negative weight and the composite stays in [0,1]. Cost is computed from token usage × per-model OpenRouter pricing (`MODEL_PRICING`, `:34-40, 97-105`). p95 latency via `:86-91`. Formula mirrored in `chapter3_foundations.tex:446-457` (eq. composite) and `chapter4_system.tex:873-877`.

## 5. The grounding ablation config

`packages/eval/promptfooconfig.ungrounded.yaml` (run `bun run eval:ablation` → `results/ungrounded.json`). Single provider `oss-120b-ungrounded` (`:15-24`), **identical model/reasoning/maxSteps to gpt-oss-120b-medium**. What is removed:
- **`disableTools: true`** → `runOnce.ts:105-113` gives the Agent `tools: {}` (no catalog/reviews/cart access).
- **`promptVariant: ungrounded`** → swaps the system prompt to `UNGROUNDED_SYSTEM_PROMPT` (`promptVariants.ts:18-34, 54-57`): same persona/format/rules but "You do not have tools… answer from conversation context and your own knowledge." **Few-shots are kept** so tool access + tool instructions are the only changed variables (`promptVariants.ts:55-57`).
- **Same dataset (`shopping-v1.yaml`), same judges, same thresholds** as the main sweep (`promptfooconfig.ungrounded.yaml:29-93`), so rows are directly comparable to `results/latest.json`. Tool metrics (expectedToolCoverage, toolCallEfficiency) are structurally inapplicable and excluded from comparison (`promptfooconfig.yaml:104-108`).

## 6. The numbers

**Ablation** (`eval-findings.md:444-466`, table `chapter4_system.tex:1047-1067`): grounded vs ungrounded —
- specific price/rating claims: **83 vs 162**
- claims failing the store DB: **48.2% vs 67.3%**
- factuality mean (comma-fixed scorer): **0.760 vs 0.533** (thesis rounds 0.76/0.53)
- judge helpfulness: **0.572 vs 0.776**; judge completeness: **0.702 vs 0.885**
- latency p50/p95: **2.4s/5.3s vs 1.4s/3.3s** (grounding costs ~1s p50).
- Key reading: ungrounded model fabricates a confident price table (Galaxy S24 Ultra $1,199, iPhone 15 Pro $999 — few-shot products from world memory). **Judges prefer the fabricator** → validates the harness split: programmatic DB checks carry the trust signal, judges are secondary (`eval-findings.md:459-460`; `chapter4_system.tex:1091-1098`).

**Sweep** (`eval-findings.md:269-278` raw, refreshed numbers in `chapter4_system.tex:897-916`):
- **Flash-Lite composite #1 = 0.807, $0.0003/query, p95 4.2s** (`chapter4_system.tex:898-903`). (The earlier credit-limited run in eval-findings showed 0.870 / p95 4934ms — superseded.)
- no-fewshot gpt-oss-120b: highest raw quality **0.815**, composite #3 = 0.774; Flash-Lite loses quality by 3.9 pts (0.776 vs 0.815) but wins both penalty axes (`chapter4_system.tex:900-906`).
- gpt-oss-120b low reasoning #2 = 0.795.
- **Worst: gpt-oss-120b high-reasoning composite 0.492, p95 12.1s, ~2× cost** (`chapter4_system.tex:911-914`). ms15 loose budget = 0.683.
- **Groundedness ≥ 0.89** across the sweep — near-zero hallucinated IDs; all configs essentially saturate groundedness because context pre-feeds real IDs (`chapter4_system.tex:1086, 1115-1121`; ablation caveat `eval-findings.md:462, 464`).

**Caveat to volunteer:** the May canonical sweep shows near-zero live tool calls — the system context pre-feeds the agent the product data, so the grounded advantage comes mainly from DB-fed context + grounding rules rather than live tool round-trips (`eval-findings.md:464`).

Key files: `/Users/mihai/dev/personal/zalem/packages/eval/promptfooconfig.yaml`, `.../promptfooconfig.ungrounded.yaml`, `.../src/datasets/shopping-v1.yaml`, `.../src/providers/advisorProvider.ts`, `.../src/scorers/{hasFinalAnswer,groundedness,factuality,reviewThemeFidelity,toolCallEfficiency,expectedToolCoverage}.ts`, `.../src/reports/thesisExport.ts`, `/Users/mihai/dev/personal/zalem/packages/backend/convex/ai/evals/{runOnce,evalModel,promptVariants}.ts`, `/Users/mihai/dev/personal/zalem/thesis/chapters/chapter4_system.tex:718-1121`, `/Users/mihai/dev/personal/zalem/thesis/chapters/chapter3_foundations.tex:380-463`, `/Users/mihai/dev/personal/zalem/docs/eval-findings.md`.

---

# RUFUS

## (a) What's factually known about Rufus 2025–2026

**Scale / commercial success (well documented, Amazon-reported):**
- 300M+ customers have used Rufus; Amazon reported ~149% YoY growth in monthly active users and ~$12B in incremental annualized sales (Q4 2025), exceeding the ~$10B pace CEO Andy Jassy projected. Rufus-engaged shoppers are ~60% more likely to complete a purchase. ([about.amazon.com](https://www.aboutamazon.com/news/retail/amazon-rufus-ai-assistant-personalized-shopping-features), [Yahoo Finance](https://finance.yahoo.com/news/amazon-says-ai-shopping-assistant-152500992.html))
- Early-2026 analyst estimates put Rufus-mediated sessions at ~13.7% of searches — growing but still a minority. ([Retail Tech Innovation Hub, Jan 5 2026](https://retailtechinnovationhub.com/home/2026/1/5/rufus-and-the-ai-shopping-war-why-amazons-assistant-reveals-the-battle-for-customer-intent))

**Architecture / feature changes since 2024:**
- COSMO knowledge graph is now integrated as a core RAG source. Amazon's own SIGMOD 2024 numbers: ~60% improvement in search relevance (macro-F1) and 0.7% sales uplift in A/B testing — but these are *retrieval-relevance* metrics, not factual-accuracy or price-hallucination metrics. ([Amazon Science](https://www.amazon.science/blog/the-technology-behind-amazons-genai-powered-shopping-assistant-rufus), [ZonGuru COSMO](https://www.zonguru.com/blog/what-is-amazon-cosmo))
- New grounding source added: **Amazon Nova Web Grounding** (external-source retrieval), plus six RAG sources (reviews/Q&A, COSMO, listing/A+ text, image OCR/CV). ([eva.guru](https://eva.guru/blog/amazon-rufus-cosmo-ai-impact/))
- **"Help Me Decide"** feature launched Oct 2025 — side-by-side comparison summaries drawn from listings, reviews, A+ content. ([about.amazon.com](https://www.aboutamazon.com/news/retail/amazon-rufus-ai-assistant-personalized-shopping-features))
- **Rebrand:** As of May 13 2026, Rufus was renamed **"Alexa for Shopping"** in the US; sources, touchpoints and recommendation logic reported unchanged. ([Amalytix](https://www.amalytix.com/en/knowledge/ai/amazon-rufus-guide-2026/), [Perpetua](https://perpetua.io/blog-alexa-for-shopping-amazon-rufus-the-complete-guide-for-brands-and-sellers/))

## (b) Has anyone independently re-measured accuracy / price-hallucination since 2024?

**No formal independent re-benchmark of the original metrics has been published.** What exists in 2025–2026:
- The "32% accurate / 83% self-serving / 28% price hallucination" figures still circulate, but they trace back to the 2024 ConsumerAffairs/Marketplace Pulse reporting and aggregated AI-shopping-assistant studies — they are *re-cited*, not *re-measured*. (Honest caveat: the 28% price figure is sometimes attributed to *ChatGPT Shopping*, and the 32%/83% to pooled "AI shopping assistant" studies — worth citing carefully so the committee can't poke at attribution.) ([ConsumerAffairs](https://www.consumeraffairs.com/news/amazons-ai-shopping-assistant-rufus-is-often-wrong-110724.html), [Marketplace Pulse](https://www.marketplacepulse.com/articles/amazons-shopping-ai-is-confidently-wrong))
- The same **failure modes are still reported in 2026** — qualitatively, not as a controlled study: Amazon Seller Central threads document Rufus giving *false compatibility data driving returns* and *hallucinated/absent features causing negative reviews* into 2026; analyst write-ups still list "hallucinates specs, invents prices, recommends out-of-stock as available." ([Seller Central forum](https://sellercentral.amazon.com/seller-forums/discussions/t/ad79306c-37ca-4b4e-a995-4dd047fbb4cf), [ecomclips 2026](https://ecomclips.com/blog/amazon-rufus-ai-2026/))

**Bottom line:** there is no published 2025/2026 study showing the original error rates have been fixed, *and* there is ongoing (anecdotal) evidence the same hallucination class persists. Either way, the thesis doesn't depend on the live number.

## Ready-to-say answer to "your numbers are stale"

> "You're right that those specific figures are from 2024, and I cite them as 2024 sources. Three points on why the thesis still holds:
>
> **1. They're a design target, not a live benchmark.** I use the documented 2024 failures — hallucinated specs, invented prices, own-brand bias, fabricated review themes — as the *motivation* that defines what my architecture must avoid. My contribution is the system design and my *own* evaluation of it, which stands regardless of what Rufus does today. I am not benchmarking against the current Rufus; I'm benchmarking against my own ablations.
>
> **2. The failure mode is inherent to the model class, not to Rufus's 2024 build.** An ungrounded LLM fabricating product facts is a property of generative models, not a bug in one release. I demonstrate this directly in my own ablation: when I remove the grounding/retrieval layer, *my* assistant produces the same category of fabrication. So the problem I'm solving is structural, and my evidence for it comes from my own controlled experiment — not from Rufus's age.
>
> **3. As far as I can determine, the numbers haven't been superseded.** Amazon has reported commercial growth (300M+ users, ~$12B incremental sales) and added COSMO, Nova Web Grounding, and 'Help Me Decide' — and rebranded Rufus to 'Alexa for Shopping' in May 2026 — but those are *relevance and revenue* metrics. No independent party has published a re-measurement of factual accuracy or price-hallucination since 2024, and 2026 seller reports still describe the same hallucination failures. So even on a live reading the failure mode persists; but critically, my thesis doesn't rise or fall on that — it rises or falls on whether my grounded architecture beats my ungrounded baseline, which I show it does."

If pressed on whether Rufus may have improved: concede it plausibly has on relevance (COSMO data supports that), but note that (i) improvement on retrieval relevance is orthogonal to factual grounding, and (ii) the absence of any published accuracy re-measurement means "Rufus is fixed" is itself an unsupported claim — the burden cuts both ways, and your own ablation is the only controlled evidence in the room.