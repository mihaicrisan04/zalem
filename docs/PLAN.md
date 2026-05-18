# zalem — master plan

e-commerce store with AI-powered shopping assistant

---

## phases overview

| phase | what                              | depends on                  | status      |
| ----- | --------------------------------- | --------------------------- | ----------- |
| 1     | store UI (pages & components)     | —                           | done        |
| 2     | data layer & seed                 | phase 1 (UI informs schema) | done        |
| 3     | static recommendation engine      | phase 2                     | done        |
| 4     | behavior tracking infrastructure  | phase 1                     | done        |
| 5     | behavior-driven readiness signals | phase 3, 4                  | done        |
| 6     | LLM integration (Gemini 3 Flash)  | phase 3, 5                  | in progress |
| 7     | optimization & extras             | phase 6                     | not started |
| 8     | custom eval system                | phase 6                     | not started |

UI-first approach: design the store experience first, then build the data layer to support it.

**key refinement (from AI integration research):** phase 5 is now "readiness signals" not "trigger system" — the AI is reactive-first with smart proactive indicators. it doesn't auto-fire suggestions. it prepares context and shows subtle indicators, then the user pulls the AI advice when ready.

**AI priorities:** review summarization and AI-assisted comparison are core features, not extras. the assistant should help users validate products by summarizing what buyers actually say and by comparing similar options in a structured, grounded way.

**Rufus-informed principles (from `docs/rufus-research.md`):**

- **the LLM never generates factual product data** — prices, ratings, stock, specs are always hydrated from live Convex data, never from LLM output. Amazon's Rufus has a 28% price hallucination rate; we avoid this entirely
- **output validation layer** — post-generation, verify every productId exists and claimed attributes match. Rufus has 32% accuracy; we can beat this with guardrails
- **review summaries must surface conflicts** — don't just show majority sentiment. explicitly surface divided opinions with counts ("38 love it, 9 report issues after 6 months"). Rufus's biggest criticism is fabricating and oversimplifying review themes
- **formalized model routing** — different query types route to different models (Flash-Lite for batch/simple, Flash for reasoning). inspired by Rufus's multi-model router
- **product enrichment with implicit use cases** — add `useCases` and `goodFor` fields during seed, inspired by Amazon's COSMO knowledge graph (60% relevance improvement)

**auth boundary:** anonymous users can browse, search, and see readiness signals (client-side). cart, favorites, orders, reviews, and LLM advisor calls require Clerk authentication. no anonymous carts. see `docs/data-layer-plan.md` § auth & session model for the full matrix.

---

## direction change (2026-05-13) — no user study

**decision (finalized):** the small user study (8-15 participants, within-subjects A/B comparison, Likert questionnaire on usefulness/trust/intrusiveness/confidence) is dropped. the thesis evaluation is two-layered: offline recommendation quality + system performance/cost. user perception is acknowledged as future work (chapter 8) but is no longer measured by this thesis.

**why:** [rationale to fill in by the author]

### structural change

- chapter 8 (Discussion) deleted; conclusions renumbered from chapter 9 → chapter 8
- chapter 7 (Results) absorbs the closing-interpretation role via `\section{Summary and Discussion}`
- RQs collapsed from 5 → 2 (engineering-only); hypotheses from 7 → 2
- traceability table in §3.4 remapped to the surviving RQs
- abstract rewritten to two-layer framing

### cleanup status — completed 2026-05-13

thesis manuscript: **done**.
- [x] `thesis/main.tex` — abstract + chapter input lines
- [x] `thesis/chapters/chapter1_introduction.tex` — RQs, hypotheses, objectives, contributions, thesis-structure section
- [x] `thesis/chapters/chapter2_background.tex` — three-layer-evaluation phrasing
- [x] `thesis/chapters/chapter3_problem.tex` — system goal, non-goal, traceability table, evaluation criteria, scope and validity-assumption paragraphs
- [x] `thesis/chapters/chapter6_evaluation_methodology.tex` — user-study acknowledgment paragraph + softened external-validity closing
- [x] `thesis/chapters/chapter7_results.tex` — User Study Results section deleted, "Summary and Discussion" section added
- [x] `thesis/chapters/chapter8_conclusions.tex` (renamed from chapter9) — internal cross-refs to former chapter 8 updated, "Larger-Scale Evaluation" subsection rewritten as "Human-Subject Evaluation"
- [x] `thesis/chapters/chapter8_discussion.tex` — deleted

planning docs: **scrubbed below**, kept with a `[SUPERSEDED]` marker where the original content is mostly about the user study and would otherwise read incoherently.

---

### detailed plans per phase

- `docs/store-ui-spec.md` — emag-inspired store UI spec (phase 1)
- `docs/data-layer-plan.md` — Convex schema, queries, mutations, indexes (phase 2)
- `docs/recommendations-plan.md` — algorithm selection, scoring, cold-start (phase 3)
- `docs/ai-integration-plan.md` — LLM selection, UX, business case, architecture (phases 5-7)
- `docs/eval-system-plan.md` — custom eval harness for ranking models, prompts, and parameters on quality/cost/latency (phase 8)
- `docs/rufus-research.md` — Amazon Rufus deep dive: architecture, features, failures, and actionable lessons for zalem (cross-cutting)
- `docs/scale-considerations.md` — what breaks at 10K+ products and architectural fixes (cross-cutting)
- `docs/architecture-research.md` — Convex components, monorepo strategy, service boundaries (cross-cutting)
- `docs/deployment-plan.md` — Vercel + Convex + Clerk production deployment guide
- `docs/bachelor-thesis-plan.md` — how to position `zalem` as a strong computer science bachelor thesis, including evaluation strategy and alternative thesis directions
- `docs/bachelor-thesis/README.md` — dedicated thesis planning workspace: current direction, thesis outline, title/abstract options, thesis-safe MVP, and alternative 2026 thesis ideas

---

## phase 1 — store UI

build a full emag-style store that works great with zero AI. this is a product on its own.

**pages:**

- **home** — hero section, featured categories, deals of the day, trending products, "recommended for you" (placeholder until phase 3 wires it up)
- **category page** — product grid with filters (price range, brand, rating, subcategory), sort (price, rating, newest, popular)
- **product detail page** — image gallery, title/price/rating, description, specs/attributes, review section with AI summary, compare CTA for similar products, "frequently bought together" section (placeholders until phase 3)
- **search results** — autocomplete dropdown + full results page
- **cart page** — line items, quantities, total, checkout button
- **favorites page** — saved products grid, add to cart directly, remove from favorites
- **order history page** — past orders list with status tabs (all/delivered/cancelled), order detail view
- **checkout page** — fake checkout flow (address form, order confirmation)

**components (built with @zalem/ui):**

- `ProductCard` — image, title, price, rating, discount badge, add-to-cart button, favorite toggle
- `ProductGrid` — responsive grid of ProductCards
- `ProductFilters` — sidebar filters for category pages
- `ProductDetail` — full product view
- `ReviewSection` — list of reviews + aggregate rating
- `SearchBar` — autocomplete search
- `Cart` — cart page with line items
- `CategoryNav` — top-level category navigation with mega menu

**key details:**

- responsive design (mobile-first)
- optimistic UI for add-to-cart and favorite toggle
- URL-based filter state (so filters survive page refresh)
- skeleton loaders for product grids

---

## phase 2 — data layer & seed

the foundation. schema design + realistic seed data so everything after this has something to work with.

**schema tables:**

- `categories` — category tree with slug, icon, parent/child relationships, display order
- `products` — catalog with title, description, categoryId, category (denormalized), subcategory, price, originalPrice, brand, tags, rating, reviewCount, images, specifications, stock, isDeal, purchaseCount
- `reviews` — per-product user reviews with rating + text
- `orders` — purchase history with snapshotted line items (price at time of purchase)
- `userPreferences` — derived from purchase history: favorite categories, price range, brands, interest tags
- `cartItems` — one row per cart item per user (avoids OCC conflicts when adding different products)
- `favorites` — user-product pairs with timestamp
- `productCoOccurrences` — precomputed co-purchase scores (populated in phase 3 but schema defined here)
- `behaviorSessions` — aggregated behavior signals (populated in phase 4 but schema defined here)
- `suggestions` — AI suggestions (populated in phase 6 but schema defined here)

**seed script:**

- pull ~200 products from DummyJSON API, map to our schema
- supplement with faker.js if we need more products or variety
- generate ~50 users with persona clusters (tech enthusiast, home & living, fashion, etc.)
- generate ~500 orders with realistic patterns:
  - purchases clustered by persona (tech users buy electronics + accessories)
  - power-law distribution (few heavy buyers, many casual)
  - timestamps spanning 3 months
  - 2-4 items per order on average
- generate ~300 reviews tied to purchased products
- derive `userPreferences` from order history
- use `faker.seed(42)` for reproducible runs

**queries to implement:**

- list products (paginated, by category, by search term)
- get product by ID with reviews
- get user's order history
- get user's cart
- search products (Convex search index on title)

**deliverable:** a working backend with data you can query. no UI yet, but you can verify everything via Convex dashboard.

---

## phase 3 — static recommendation engine

classic recommendation algorithms. no AI, pure data. these serve two purposes: (1) make the store smarter on its own, (2) generate candidates for the AI layer later.

**algorithms:**

1. **co-occurrence ("frequently bought together")**
   - iterate all orders, count product pair co-purchases
   - Jaccard similarity: |A∩B| / |A∪B| with minimum support threshold of 2-3 co-occurrences
   - store top 20 related products per product in `productCoOccurrences`
   - recompute via Convex cron (daily) or on-demand after seed

2. **content-based similarity**
   - score: same_category(+3) + overlapping_tags(+1 each) + same_brand(+2) + price_within_20%(+1)
   - computed on-the-fly per product query (no precomputation needed)
   - used for "similar products" on product detail page

3. **trending with time decay**
   - score = purchase_count × e^(-0.05 × age_in_hours)
   - query recent orders, aggregate by product, apply decay
   - segment by category for "trending in electronics" etc.

4. **"recommended for you" (personalized)**
   - based on `userPreferences`: favorite categories + brands + price range
   - weight recent purchases higher
   - exclude already-purchased products
   - for anonymous users: fall back to global trending

**where recommendations appear:**

- home page: "trending", "recommended for you", "deals"
- product detail: "frequently bought together", "similar products"
- cart: "you might also like" (based on cart contents)
- category page: sort by "recommended" option

**module design:**

- all recommendation logic lives in `packages/backend/convex/recommendations/`
- clean function interface: `getFrequentlyBoughtTogether(productId)`, `getSimilarProducts(productId)`, `getTrending(category?)`, `getPersonalized(userId)`
- the AI layer in phase 6 calls these same functions to get candidates

---

## phase 4 — behavior tracking infrastructure

client-side signal collection → aggregation → storage. no AI yet, just building the data pipeline.

**hooks:**

- `useHover` (already installed) — boolean hover state per element, used to know which product the cursor is on
- `useDwellTime(ref)` — new hook, wraps `useHover` + timer. returns `{ isHovered, dwellTimeMs }`. resets on mouse leave.
- `useViewportTracking(ref)` — wraps `react-intersection-observer`. tracks which products are in viewport and for how long.
- `useScrollDepth()` — tracks how far user has scrolled on the current page (0-1)
- `useProductEngagement(productId, ref)` — composite hook combining dwell + viewport + scroll into a single engagement object per product

note: `useMousePosition` stays available but won't be used for tracking in the initial implementation — `useHover` + `useDwellTime` cover the same intent more efficiently. raw cursor position is useful later for heatmaps/analytics.

**event buffer:**

- client-side array accumulating engagement snapshots
- flush to Convex via single mutation every 3-5 seconds
- also flush on page navigation and via `navigator.sendBeacon` on tab close
- the mutation upserts `behaviorSessions` — always aggregated, never raw events

**`behaviorSessions` stores per product:**

- productId
- dwellTimeMs (cumulative)
- scrollDepth (max reached)
- cursorHoverMs (cumulative)
- viewedReviews (boolean)
- timestamp (last interaction)

**composite interest score:**

```
interestScore =
    (dwellTimeMs / 1000) × 0.35
  + scrollDepth × 0.25
  + (cursorHoverMs / 1000) × 0.15
  + (viewedReviews ? 1 : 0) × 0.25
```

this score drives triggers in phase 5.

---

## phase 5 — behavior-driven readiness signals

decides WHEN the AI advisor is ready to help — not when to interrupt. based on CHI 2024 research and consumer trust data: the user pulls advice when ready, the system just shows subtle indicators that advice is available.

**readiness conditions (client-side evaluation):**

| signal              | condition                                               | what happens                                   |
| ------------------- | ------------------------------------------------------- | ---------------------------------------------- |
| product dwell       | cursor on a product card >5s, or >15s on product detail | subtle pulse on advisor button                 |
| deep scroll         | >50% of product detail page scrolled                    | show contextual question chips                 |
| review engagement   | >5s viewing review section                              | show "What do buyers think?" chip              |
| comparison behavior | 3+ products viewed in same category, no add-to-cart     | show "Compare these?" chip                     |
| cart deliberation   | items in cart, navigating away                          | show non-intrusive "Need help deciding?" nudge |

**key distinction from the old "trigger system" approach:**

- these signals do NOT auto-fire LLM calls — they only change UI state (show indicator, show chips)
- the LLM call only happens when the user clicks a chip or opens the advisor sidebar
- this keeps LLM costs tied to user intent, not page views

**readiness evaluator:**

- runs client-side (no backend round-trip)
- checks composite interest score against threshold
- controls which question chips are shown and whether the advisor button pulses
- respects cooldowns: don't re-show dismissed indicators for 60s

---

## phase 6 — LLM integration (Gemini Flash)

the AI layer. sits on top of everything built so far. uses `@convex-dev/agent` for conversation management, streaming, and tool calling.

**sub-phase progress:**

| sub-phase | what                                                                  | status      |
| --------- | --------------------------------------------------------------------- | ----------- |
| 6.1       | agent infrastructure (Gemini 3 Flash, system prompt, model router)    | done        |
| 6.2       | advisor sidebar UI (push-content, resizable, prompt-kit components)   | done        |
| 6.3       | agent tools (product details, search, recommendations, cart, reviews) | done        |
| 6.4       | review summarization (batch, Flash-Lite, conflict surfacing)          | done        |
| 6.5       | AI comparison mode + chat experience upgrade                          | in progress |
| 6.6       | polish & safety (rate limiting, feedback, output validation)          | not started |

**two-stage architecture:**

```
stage 1: candidate generation (static, <50ms)
  co-occurrence → top 20
  content similarity → top 20
  trending → top 10
  merge + dedupe → ~30 candidates

stage 2: LLM re-ranking + messaging (Gemini Flash, 300-500ms)
  candidates + user context → Gemini via agent
  returns top 3-5 + natural language message
```

**context sent to Gemini:**

- current product (title, category, price, rating, key attributes)
- user behavior (dwell time bucket, scroll depth, which products viewed)
- user profile (favorite categories, avg spend, recent purchases)
- cart contents
- selected comparison products (when compare mode is active)
- review summary / key review themes (when available)
- candidate products (id, title, price, category, rating, recommendation score)
- keep total prompt under 2-4K tokens

**Convex flow (via `@convex-dev/agent`):**

1. user clicks a question chip or opens the advisor sidebar
2. agent creates or continues a thread, assembles context via tools
3. agent calls Gemini, streams response via delta chunks saved to DB
4. all connected clients get real-time updates via Convex subscriptions
5. structured product suggestions extracted from the agent's response

**Gemini config:**

- model: Gemini 3 Flash (`@ai-sdk/google`) for conversational advice
- model: Gemini 3.1 Flash-Lite for simple re-ranking slots (homepage hero)
- model: Gemini 3.1 Flash-Lite or `gemini-embedding-001`-adjacent batch flow for review summarization and other offline enrichment tasks
- output: structured JSON (native JSON mode, >99% schema adherence)
- system prompt sets persona as helpful shopping advisor (not salesperson)
- few-shot examples in prompt for consistent output format
- context caching for system prompt + few-shot examples (90% cost reduction on cached tokens)

**core AI surfaces in phase 6:**

- advisor sidebar for user-initiated product guidance
- review summarization at the top of the reviews tab
- AI-assisted comparison for 2-3 similar products in the same category

**output format:**

```json
{
  "suggestions": [
    { "productId": "...", "reason": "pairs well with the keyboard in your cart" },
    { "productId": "...", "reason": "same specs, 30% cheaper" }
  ],
  "message": "great pick — here's a wrist rest that pairs perfectly with it"
}
```

**phase 6.5 sub-phases:**

| sub-phase | what                                                                                 | status      |
| --------- | ------------------------------------------------------------------------------------ | ----------- |
| 6.5.1     | richer first-message context (product, cart, recent views — hidden from chat UI)     | not started |
| 6.5.2     | tool call step indicators (inline "Looking up..." labels from message stream)        | not started |
| 6.5.3     | compareProducts tool (structured JSON with specs, reviews, pricing for 2-3 items)    | not started |
| 6.5.4     | custom chat UI components (comparison table, inline product cards, no bubbles on AI) | not started |
| 6.5.5     | speed optimizations (reduce tool calls via pre-fetched context, trim few-shots)      | not started |
| 6.5.6     | system prompt tuning for comparison + few-shot example                               | not started |
| 6.5.7     | polish + docs                                                                        | not started |

**key design decisions for 6.5:**

- **assistant messages have no bubble** — plain markdown text, no bg-muted container. only user messages stay in bubbles.
- **richer context is invisible in chat** — first message sends product/cart/behavior context to the AI but the chat UI only shows the user's actual question text.
- **tool calls render as step indicators** — "Looking up product..." / "Comparing products..." as muted inline labels, using `Loader` variant="text-shimmer" while active.
- **comparison results render as custom UI** — `ComparisonTable` component with product thumbnails, side-by-side specs, review themes, pricing. not markdown.
- **prompt-kit components used:** `Message`, `MessageContent` (text only), `Loader` (text-shimmer for steps), `PromptInput` + `PromptInputTextarea` + `PromptInputActions`, `ChatContainerRoot` for auto-scroll, `ScrollButton`.

---

## phase 7 — optimization & extras

polish, performance, and experimental features.

- **Gemini context caching** — cache repeated product/category contexts, up to 75% cost reduction
- **rate limiting** — `@convex-dev/rate-limiter` per user session to prevent abuse
- **suggestion feedback loop** — track click-through rate on suggestions, use to tune trigger thresholds
- **A/B testing** — compare conversion with/without AI suggestions
- **prompt tuning** — iterate on prompt based on real suggestion quality
- **performance** — profile behavior tracking overhead, tune throttle/debounce intervals
- **(optional) WebGazer.js** — eye tracking experiment as supplementary signal, requires webcam consent
- **(optional) heatmaps** — use `useMousePosition` data to generate product page heatmaps for analytics

---

## phase 8 — custom eval system

a purpose-built eval harness for monitoring and ranking LLM configurations (model, reasoning effort, step budget, system prompt variants) on cost, latency, and quality. turns model selection into a data-driven process and produces thesis-quality evidence for chapter 6.2 (system evaluation).

**direction change (2026-05-09):** the original plan was to build the entire harness in-house (own Convex tables, own runner, own admin webapp). the new plan uses **Promptfoo** (MIT, open-source) as the runner / dataset manager / dashboard, and ships only the parts that don't exist off-the-shelf — a custom provider that wraps the Convex `shoppingAdvisor` agent, plus 5 shopping-domain scorers (groundedness against live Convex, factuality vs DB snapshot, embedding-based theme fidelity, etc.). reasoning: re-implementing generic eval infrastructure has poor thesis ROI; the novel contribution is the domain-specific scoring layer. see `docs/eval-system-plan.md` § "direction change (2026-05-09)" for the full rationale.

**sub-phase progress:**

| sub-phase | what                                                                                                             | status      |
| --------- | ---------------------------------------------------------------------------------------------------------------- | ----------- |
| 8.1       | `packages/eval/` workspace scaffold (Promptfoo + custom provider + 5 scorer skeletons + dataset skeleton)        | scaffolded  |
| 8.2       | `ai/evals/runOnce` Convex action (eval-only, auth-bypass via env secret, returns parts/usage/timings/dbSnapshot) | not started |
| 8.3       | wire the 5 programmatic scorers + fill `shopping-v1.yaml` to 25 rows                                             | not started |
| 8.4       | LLM-as-judge rubrics (judge = Claude Haiku 4.5, cross-family) + 9-config sweep matrix                            | not started |
| 8.5       | `thesisExport.ts` — JSON results → LaTeX tables + pareto plots into `thesis/figures/`                            | not started |
| 8.6       | (optional) self-hosted Langfuse layer for trace storage + shareable dashboard                                    | deferred    |

**key motivation:** the `maxSteps: 5 → 12` fix we shipped was a reactive patch, not a measured decision. for the thesis, every model/prompt/parameter choice needs to be defended with numbers. see `docs/eval-system-plan.md` for the full architecture, dataset design, scoring pipeline, and dashboard plan.

**what this is NOT:**

- engineering-only: user perception (trust, intrusiveness, control) is acknowledged as future work, see the 2026-05-13 direction change above
- not a general-purpose eval framework — scoped strictly to the shopping-advisor use case
- not a CI gate — runs are triggered manually

**thesis fit:** the harness is both an engineering contribution (chapter 5) and the measurement instrument for chapter 6 system evaluation. it produces the latency/cost/quality tables that go into chapter 7 and the pareto plots that justify the final shipped configuration. (user perception is out of scope per the 2026-05-13 direction change above.)

---

## key architectural decisions

1. **store first, AI second** — the store should be a great product with zero AI. recommendations come from algorithms, AI enhances them.
2. **two-stage recommendations** — static algorithms generate candidates fast, LLM re-ranks and adds personality. this keeps costs low and latency acceptable.
3. **aggregate behavior client-side** — never send raw mousemove events to the backend. compute dwell times and scroll depths in the browser, flush summaries.
4. **readiness signals are client-side, LLM calls are user-initiated** — the decision to show an indicator or question chip happens in the browser (no round-trip). the LLM call only fires when the user actively engages (clicks a chip, opens the advisor sidebar).
5. **modular recommendation engine** — clean interfaces so the AI layer consumes the same functions as the store UI. easy to swap algorithms later.
6. **`useHover` + `useDwellTime` over `useMousePosition`** — hover state + duration tells us what we need (which product, how long). raw cursor position is overhead we don't need for readiness signals. keep `useMousePosition` available for future analytics/heatmaps.
7. **reactive-first AI UX** — the advisor is always available but rarely interrupts. behavior signals prepare context and show subtle indicators; the user pulls advice when ready. based on research showing 41-55% of shoppers distrust proactive AI suggestions.
8. **`@convex-dev/agent` for AI backbone** — persistent conversation threads, delta-based streaming via Convex subscriptions, built-in tool calling, rate limiting, and usage tracking. replaces a custom suggestion pipeline.

---

## thesis compaction plan (2026-05-13, revised 2026-05-13)

**goal:** trim the manuscript from the current **94 pages** (content-complete: chapters 1–8 all drafted, build clean, zero undefined refs) down to **~60 pages total**. roughly 36% reduction, ~34p to cut.

**target choice:** 60p was picked over the original 50p draft. 60p preserves the substantive engineering content (TikZ figures, code listings, evidence tables, Rufus case study) and avoids gutting chapters 4 and 5 down to summary level; 50p would have required cutting load-bearing material. supervisor / faculty hard limit not confirmed — if a hard cap is later imposed, the more-aggressive 50p plan in git history can be revived.

### current page distribution (post chapters 7 + 8)

| chapter                          | pages | % of total |
| -------------------------------- | ----- | ---------- |
| front matter (abstract, TOC)     | 5     | 5%         |
| ch 1 introduction                | 6     | 6%         |
| ch 2 background                  | 10    | 11%        |
| ch 3 problem                     | 7     | 7%         |
| **ch 4 design**                  | **23**| **24%**    |
| **ch 5 implementation**          | **23**| **24%**    |
| ch 6 methodology                 | 6     | 6%         |
| ch 7 results                     | 7     | 7%         |
| ch 8 conclusions & future work   | 4     | 4%         |
| references                       | 6     | 6%         |
| **total**                        | **94**| —          |

bulk still lives in chapters 4 and 5: together 46p = 49% of the manuscript. chapters 7 and 8 are already tight at 7p + 4p.

### target distribution for 60 pages

| chapter                          | now  | target | cut    |
| -------------------------------- | ---- | ------ | ------ |
| front matter                     | 5    | 4      | 1p     |
| ch 1                             | 6    | 4      | 2p     |
| ch 2                             | 10   | 6      | 4p     |
| ch 3                             | 7    | 5      | 2p     |
| **ch 4**                         | **23**| **16**| **7p** |
| **ch 5**                         | **23**| **15**| **8p** |
| ch 6                             | 6    | 5      | 1p     |
| ch 7                             | 7    | 6      | 1p     |
| ch 8                             | 4    | 3      | 1p     |
| references                       | 6    | 4      | 2p     |
| margin                           | —    | —      | ~5p slack |
| **total**                        | **94**| **~63** (aim ~60) | —      |

less aggressive than the 50p plan: ~7p saved each on chapters 4 and 5 instead of 12p. that means preserving most subsections rather than collapsing them. tightening at the sentence/paragraph level, not deletion of structure.

### concrete cut list per chapter

#### chapter 4 — design (cut ~7p)

| action                                                                                                            | savings |
| ----------------------------------------------------------------------------------------------------------------- | ------- |
| drop §4.2 codebase structure (one paragraph or absorb a sentence into §4.1; monorepo-graph figure → kill or move) | 1.5p    |
| compress §4.13 end-to-end advisor request (its job is partly done by §4.1; halve the trace)                      | 1p      |
| compress §4.12 eval harness — keep the architecture figure, fold lifecycle into chapter 6                        | 0.5p    |
| merge §4.10 auth into a paragraph in §4.11 data model                                                            | 0.5p    |
| line-level tightening of §4.4–§4.9 (transitional sentences, redundant framings, recapping)                       | 2.5p    |
| trim opening of every section by 1–2 sentences                                                                   | 1p      |
| **keep:** every TikZ figure, two-stage-pipeline, ER diagram, all the mermaid PDFs                                 | —       |

#### chapter 5 — implementation (cut ~8p)

| action                                                                                                            | savings |
| ----------------------------------------------------------------------------------------------------------------- | ------- |
| compress §5.1 tech stack to a tight paragraph + one figure (drop the version-by-version walkthrough)             | 1p      |
| §5.3 convex data layer — drop the schema code listing (duplicates §4.11), keep prose                              | 0.5p    |
| §5.4 recommendation engine — keep the `contentSimilarity` listing only, summarize the other three algorithms      | 1p      |
| §5.5 behavior tracking — keep `useDwellTime` listing only, drop the second listing                                | 0.5p    |
| §5.6 LLM advisor — keep `selectModel` listing, compress the agent-construction subsection to prose                | 1p      |
| §5.7–§5.11 (review summaries, comparison, validation, instrumentation) — each section tightened 30%               | 2p      |
| §5.13 engineering challenges — convert from prose paragraphs into a compact bullet list                            | 1p      |
| trim cross-references and transitions across the whole chapter                                                    | 1p      |
| **keep:** UI walkthrough screenshots, deployment figure, `contentSimilarity`, `useDwellTime`, `selectModel`        | —       |

#### chapter 2 — background (cut 4p)

| action                                                                                         | savings |
| ---------------------------------------------------------------------------------------------- | ------- |
| collapse the four LLM-in-RecSys subsections into one (or at most two)                          | 1.5p    |
| trim UX/timing literature section by half                                                      | 1p      |
| compress "Positioning of This Thesis" to one short paragraph                                   | 0.5p    |
| line-level tightening of remaining sections                                                    | 1p      |
| **keep:** the Rufus case study at full strength — most-cited evidence in the thesis            | —       |

#### chapter 3 — problem (cut 2p)

| action                                                                                         | savings |
| ---------------------------------------------------------------------------------------------- | ------- |
| compress the F1–F10 functional-requirements list to one-line entries                           | 0.5p    |
| tighten the NFR paragraphs (each currently 4–5 sentences → 2–3)                                | 0.75p   |
| merge §3.3 non-goals into §3.7 constraints                                                     | 0.5p    |
| line-level tightening                                                                          | 0.25p   |

#### chapter 1 — introduction (cut 2p)

| action                                                                                         | savings |
| ---------------------------------------------------------------------------------------------- | ------- |
| compress the contributions list (currently multi-line bullets → tight one-liners)              | 1p      |
| compress the thesis-structure section from one paragraph per chapter to a single short paragraph | 1p     |

#### chapter 6 — methodology (cut 1p)

| action                                                                                         | savings |
| ---------------------------------------------------------------------------------------------- | ------- |
| tighten the bias-mitigations paragraph from four points to three                               | 0.5p    |
| compress §6.3 validity threats from three full paragraphs to three short ones                  | 0.5p    |
| **chapter is already lean at 6p; very small headroom here**                                    | —       |

#### chapter 7 — results (cut 1p)

| action                                                                                         | savings |
| ---------------------------------------------------------------------------------------------- | ------- |
| compress §7.4 prompt-variant comparison — keep the Vivo V9 quote, tighten the contamination-mechanism paragraph | 0.5p |
| tighten the §7.5 per-RQ summary paragraphs                                                     | 0.5p    |

#### chapter 8 — conclusions (cut 1p)

| action                                                                                         | savings |
| ---------------------------------------------------------------------------------------------- | ------- |
| compress the §8.4 contributions-revisited list (one line each instead of two)                  | 0.5p    |
| compress the future-work subsections (one tight paragraph each instead of 2–3 sentences expanded) | 0.5p |

#### bibliography (cut 2p)

| action                                                                                         | savings |
| ---------------------------------------------------------------------------------------------- | ------- |
| switch from `alpha` (the institutional default) to `abbrv` or `unsrt` if faculty rules permit  | 1–2p    |
| audit for unused `\cite` entries — every `references.bib` entry not actually `\cite`d in the manuscript can be removed | 0.5p |
| **verify with UBB submission rules before changing bib style**                                  | —       |

### order of operations (highest cut-per-effort first)

1. **chapter 4** pilot pass — recover ~7p; let it set the editorial bar for the rest
2. **chapter 5** — same approach, recover ~8p
3. **chapter 2** — straightforward subsection collapse, 4p
4. **chapter 1 + 3** — sentence-level work, 4p combined
5. **bibliography style swap + unused-citation audit** — if faculty rules allow, ~2p
6. **chapters 6, 7, 8** — small tightening passes, ~3p combined

### what NOT to cut

- the rufus case study in chapter 2 (most-cited evidence in the thesis)
- the canonical TikZ figures (architecture overview, two-stage pipeline, ER diagram)
- the eval-architecture figure (the harness is a load-bearing contribution)
- the two UI screenshots (they ground the thesis in a working artifact)
- the abstract (already tight)
- the ranked-configs table, both pareto plots, and the per-category breakdown in chapter 7 (the results)
- the few-shot contamination paired-output quote in §7.4 (concrete evidence the harness pays for itself)

### approach

a single big-bang rewrite is faster but higher risk. a chapter-by-chapter checkpoint pass (start with chapter 4, ship, review, then chapter 5, etc.) preserves intermediate state and lets the author course-correct mid-trim. recommended: **chapter 4 first as a pilot pass**, then re-evaluate the per-chapter targets against the result before continuing. with the looser 60p target, the trim is at the sentence and paragraph level rather than at the structural level — the chapter outlines all stay intact.

### figures and code listings affected

- figures to drop or move: monorepo-graph (§4.2 — strong candidate for cut), eval-run-lifecycle (§4.12 — merge into chapter 6 architecture figure)
- figures to keep: architecture-overview, two-stage-pipeline (TikZ), validation-pipeline, model-routing, advisor-request, deployment-topology, ER diagram (TikZ), eval-architecture, readiness-loop, behavior-flush, two UI screenshots, the two pareto plots
- code listings to drop: schema-products (duplicates ER), one of the two behavior listings, agent-construction listing
- code listings to keep: `contentSimilarity`, `useDwellTime`, `selectModel`, `getProductDetails` tool (the validation example), `groundedness` scorer

### status

- **not started.** chapters 1–8 are now content-complete (build clean at 94p, zero undefined refs). next step is the chapter-4 pilot pass.
