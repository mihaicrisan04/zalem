# zalem — master plan

e-commerce store with AI-powered shopping assistant

---

## phases overview

| phase | what | depends on | status |
|-------|------|------------|--------|
| 1 | store UI (pages & components) | — | not started |
| 2 | data layer & seed | phase 1 (UI informs schema) | not started |
| 3 | static recommendation engine | phase 2 | not started |
| 4 | behavior tracking infrastructure | phase 1 | not started |
| 5 | behavior-driven readiness signals | phase 3, 4 | not started |
| 6 | LLM integration (Gemini 3 Flash) | phase 3, 5 | not started |
| 7 | optimization & extras | phase 6 | not started |

UI-first approach: design the store experience first, then build the data layer to support it.

**key refinement (from AI integration research):** phase 5 is now "readiness signals" not "trigger system" — the AI is reactive-first with smart proactive indicators. it doesn't auto-fire suggestions. it prepares context and shows subtle indicators, then the user pulls the AI advice when ready.

**AI priorities:** review summarization and AI-assisted comparison are core features, not extras. the assistant should help users validate products by summarizing what buyers actually say and by comparing similar options in a structured, grounded way.

**auth boundary:** anonymous users can browse, search, and see readiness signals (client-side). cart, favorites, orders, reviews, and LLM advisor calls require Clerk authentication. no anonymous carts. see `docs/data-layer-plan.md` § auth & session model for the full matrix.

### detailed plans per phase
- `docs/store-ui-spec.md` — emag-inspired store UI spec (phase 1)
- `docs/data-layer-plan.md` — Convex schema, queries, mutations, indexes (phase 2)
- `docs/recommendations-plan.md` — algorithm selection, scoring, cold-start (phase 3)
- `docs/ai-integration-plan.md` — LLM selection, UX, business case, architecture (phases 5-7)
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

| signal | condition | what happens |
|--------|-----------|--------------|
| product dwell | cursor on a product card >5s, or >15s on product detail | subtle pulse on advisor button |
| deep scroll | >50% of product detail page scrolled | show contextual question chips |
| review engagement | >5s viewing review section | show "What do buyers think?" chip |
| comparison behavior | 3+ products viewed in same category, no add-to-cart | show "Compare these?" chip |
| cart deliberation | items in cart, navigating away | show non-intrusive "Need help deciding?" nudge |

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

## key architectural decisions

1. **store first, AI second** — the store should be a great product with zero AI. recommendations come from algorithms, AI enhances them.
2. **two-stage recommendations** — static algorithms generate candidates fast, LLM re-ranks and adds personality. this keeps costs low and latency acceptable.
3. **aggregate behavior client-side** — never send raw mousemove events to the backend. compute dwell times and scroll depths in the browser, flush summaries.
4. **readiness signals are client-side, LLM calls are user-initiated** — the decision to show an indicator or question chip happens in the browser (no round-trip). the LLM call only fires when the user actively engages (clicks a chip, opens the advisor sidebar).
5. **modular recommendation engine** — clean interfaces so the AI layer consumes the same functions as the store UI. easy to swap algorithms later.
6. **`useHover` + `useDwellTime` over `useMousePosition`** — hover state + duration tells us what we need (which product, how long). raw cursor position is overhead we don't need for readiness signals. keep `useMousePosition` available for future analytics/heatmaps.
7. **reactive-first AI UX** — the advisor is always available but rarely interrupts. behavior signals prepare context and show subtle indicators; the user pulls advice when ready. based on research showing 41-55% of shoppers distrust proactive AI suggestions.
8. **`@convex-dev/agent` for AI backbone** — persistent conversation threads, delta-based streaming via Convex subscriptions, built-in tool calling, rate limiting, and usage tracking. replaces a custom suggestion pipeline.
