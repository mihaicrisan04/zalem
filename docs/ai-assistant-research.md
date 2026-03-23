# AI Shopping Assistant — Research & Architecture

research compiled 2026-03-14

> **note:** this is the initial research compilation. the phase numbering, schema draft, and trigger system described here have been superseded by later planning documents. for the canonical versions, see:
> - `docs/PLAN.md` — authoritative phase ordering (7 phases, UI-first)
> - `docs/data-layer-plan.md` — authoritative schema
> - `docs/ai-integration-plan.md` — authoritative AI architecture (reactive-first model, `@convex-dev/agent`)
> - `docs/recommendations-plan.md` — authoritative algorithm choices (Jaccard, not confidence)
>
> this document is retained for its research references, papers, and the reasoning that informed the later decisions.

---

## table of contents

1. [project overview](#project-overview)
2. [papers to read](#papers-to-read)
3. [implementation phases](#implementation-phases)
4. [architecture overview](#architecture-overview)
5. [convex schema (draft)](#convex-schema-draft)
6. [client-side tracking approach](#client-side-tracking-approach)
7. [trigger system — when to activate the AI](#trigger-system)
8. [LLM integration strategy](#llm-integration-strategy)
9. [static recommendation algorithms (baseline)](#static-recommendation-algorithms)
10. [fake store & seed data approach](#fake-store--seed-data)
11. [key libraries & tools](#key-libraries--tools)
12. [sources & references](#sources--references)

---

## project overview

build a context-aware AI shopping assistant that:
- tracks user behavior (cursor, dwell time, scroll, viewport focus)
- combines behavior signals with user purchase history and preferences
- uses a fast multimodal LLM (Gemini Flash) to generate contextual suggestions
- activates intelligently — not on every interaction, only at the right moments
- provides purchase encouragement, deal suggestions, and related product recommendations

core principle: **it's all about the context.** the AI should know what's on the page, understand the user, and be aware of related products before it speaks.

---

## papers to read

### essential (start here)

| paper | why it matters |
|---|---|
| **"No Clicks, No Problem: Using Cursor Movements to Understand and Improve Search"** — Huang et al., CHI 2011 ([pdf](https://jeffhuang.com/papers/CursorBehavior_CHI11.pdf)) | foundational paper proving cursor hover features correlate better with relevance than click-through rates. directly relevant to our tracking approach |
| **"Learning Efficient Representations of Mouse Movements to Predict User Attention"** — Arapakis & Leiva, SIGIR 2020 ([arxiv](https://arxiv.org/abs/2006.01644)) | neural networks trained on cursor movement representations predict user attention effectively — validates our approach of using cursor data as an attention proxy |
| **"Actions Speak Louder than Words: Trillion-Parameter Sequential Transducers for Generative Recommendations"** — Meta, 2024 ([arxiv](https://arxiv.org/pdf/2402.17152)) | Meta's HSTU architecture that Shopify adopted. state of the art in generative recommendation. good to understand the direction the field is heading |
| **"Enhancing UX Evaluation Through Collaboration with Conversational AI Assistants: Effects of Proactive Dialogue and Timing"** — CHI 2024 ([acm](https://dl.acm.org/doi/10.1145/3613904.3642168)) | tested when to show proactive AI suggestions. finding: suggestions **after** a user pause are preferred over synchronous or preemptive ones. directly informs our trigger system |

### surveys (for deeper understanding)

| paper | topic |
|---|---|
| **"A Survey on User Behavior Modeling in Recommender Systems"** — IJCAI 2023 ([pdf](https://www.ijcai.org/proceedings/2023/0746.pdf)) | comprehensive analysis of how behavior signals feed into recommendations |
| **"Large Language Model Enhanced Recommender Systems: A Survey"** — arXiv 2412.13432, Dec 2024 | categorizes LLM+RecSys approaches: knowledge enhancement, interaction enhancement, model enhancement |
| **"A Survey on Session-based Recommender Systems"** — Wang et al., ACM Computing Surveys 2021 | foundational survey on session-based recommendations (what we're doing) |
| **"A Comprehensive Review of Recommender Systems"** — arXiv 2407.13699, 2024 | covers context-aware, review-based, and fairness-aware systems |
| **"LLM4Rec: A Comprehensive Survey"** — Future Internet journal, 2025 | reviews 150+ papers on LLMs for recommendations (2018-2024) |

### practical reads

- [Shopify: The Generative Recommender Behind Shopify's Commerce Engine](https://shopify.engineering/generative-recommendations)
- [Eugene Yan: Improving Recommendation Systems in the Age of LLMs](https://eugeneyan.com/writing/recsys-llm/) — highly practical engineering guide
- [Elastic Security Labs: Using LLMs to Summarize User Sessions](https://www.elastic.co/security-labs/using-llms-to-summarize-user-sessions) — pattern for aggregating behavior before sending to LLM
- [JetBrains: Cutting Through the Noise — Smarter Context Management for LLMs](https://blog.jetbrains.com/research/2025/12/efficient-context-management/)

---

## implementation phases

### phase 1 — fake store foundation
- seed a product catalog (~200 products across 6-8 categories) using faker.js or DummyJSON data
- build product listing page, product detail page, category browsing
- implement cart, basic checkout flow (no real payments)
- seed fake user purchase history and preferences (for logged-in users via Clerk)
- use existing `@zalem/ui` components for the store UI

### phase 2 — static recommendation engine
- implement co-occurrence algorithm: "customers who bought X also bought Y"
- implement content-based similarity: same category, overlapping tags, similar price range
- implement trending/popular items with time decay
- add "recommended for you" section on product pages and home
- add "frequently bought together" on product detail pages
- this is the baseline — no AI yet, just classic algorithms

### phase 3 — behavior tracking system
- add viewport tracking with `react-intersection-observer` (which products are visible)
- add dwell time tracking (how long each product stays in view)
- add scroll depth tracking on product detail pages
- add cursor proximity tracking (which product card the cursor is near)
- implement client-side event batching (buffer events, flush every 3-5 seconds)
- store behavior summaries in Convex (not raw events — aggregate first)
- implement composite "interest score" from combined signals

### phase 4 — intelligent trigger system
- define trigger conditions:
  - user dwells on a product card for >3 seconds
  - user scrolls past 50% of a product description
  - user views review section for >5 seconds
  - user is idle on a product page for >8 seconds
  - user has viewed 3+ products in the same category without adding to cart
- implement trigger debouncing (don't fire multiple suggestions in quick succession)
- build non-intrusive suggestion UI (slide-in panel, not a modal)

### phase 5 — LLM integration (Gemini Flash)
- set up Gemini API access via Convex actions
- build context assembly pipeline:
  1. current product details
  2. user's behavior summary (what they've been looking at, for how long)
  3. user's purchase history and preferences
  4. related products from the static recommendation engine (pre-filtered candidates)
  5. current cart contents
- implement the two-stage architecture: static algorithms generate candidates, LLM re-ranks and explains
- LLM returns structured JSON: suggested products + natural language message
- stream AI responses back to client via Convex reactive queries

### phase 6 — polish & optimization
- tune trigger thresholds based on testing
- add context caching for repeated product contexts (Gemini supports this, up to 75% cost reduction)
- add rate limiting per user session
- optimize prompt to stay under 2-4K tokens for sub-500ms responses
- (optional) experiment with WebGazer.js eye tracking as a supplementary signal

---

## architecture overview

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Next.js)                     │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  product UI  │  │  behavior    │  │  suggestion   │  │
│  │  (store)     │  │  tracker     │  │  panel (AI)   │  │
│  └──────┬───────┘  └──────┬───────┘  └───────▲───────┘  │
│         │                 │                   │          │
│         │          ┌──────▼───────┐           │          │
│         │          │  event       │           │          │
│         │          │  buffer      │           │          │
│         │          │  (client)    │           │          │
│         │          └──────┬───────┘           │          │
│         │                 │                   │          │
│         │          ┌──────▼───────┐           │          │
│         │          │  trigger     │           │          │
│         │          │  evaluator   │           │          │
│         │          └──────┬───────┘           │          │
└─────────┼─────────────────┼───────────────────┼──────────┘
          │                 │                   │
          │            flush events        reactive query
          │            + trigger signal    (auto-updates)
          │                 │                   │
┌─────────▼─────────────────▼───────────────────┼──────────┐
│                    CONVEX BACKEND                         │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  products     │  │  behavior    │  │  suggestions  │  │
│  │  queries      │  │  mutations   │  │  queries      │  │
│  └──────────────┘  └──────┬───────┘  └───────▲───────┘  │
│                           │                   │          │
│                    ┌──────▼───────┐           │          │
│                    │  static      │           │          │
│                    │  recommender │           │          │
│                    │  (phase 2)   │           │          │
│                    └──────┬───────┘           │          │
│                           │                   │          │
│                    ┌──────▼───────┐           │          │
│                    │  context     │           │          │
│                    │  assembler   │           │          │
│                    └──────┬───────┘           │          │
│                           │                   │          │
│                    ┌──────▼───────┐    ┌──────┴───────┐  │
│                    │  Gemini      │───▶│  write       │  │
│                    │  action      │    │  suggestion  │  │
│                    │  (phase 5)   │    │  mutation    │  │
│                    └──────────────┘    └──────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**data flow:**
1. user browses the store → behavior tracker collects signals (viewport, dwell, cursor, scroll)
2. events buffer client-side, flushed every 3-5s via Convex mutation
3. trigger evaluator checks composite interest score — if threshold met, fires a trigger
4. trigger calls a Convex mutation that schedules a Gemini action via `ctx.scheduler.runAfter`
5. Gemini action assembles context (product + behavior + history + static recommendations), calls Gemini API
6. Gemini returns structured suggestion → written to DB via internal mutation
7. client's reactive query auto-updates → suggestion panel appears

---

## convex schema (draft)

```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ── product catalog ──
  products: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.string(),
    subcategory: v.optional(v.string()),
    price: v.number(),
    discountPrice: v.optional(v.number()),
    brand: v.string(),
    tags: v.array(v.string()),
    rating: v.number(),
    reviewCount: v.number(),
    images: v.array(v.string()),       // convex storage IDs or URLs
    attributes: v.object({             // flexible product attributes
      color: v.optional(v.string()),
      size: v.optional(v.string()),
      material: v.optional(v.string()),
    }),
    stock: v.number(),
  })
    .index("by_category", ["category"])
    .index("by_brand", ["brand"])
    .searchIndex("search_title", { searchField: "title" }),

  // ── product reviews (for AI context) ──
  reviews: defineTable({
    productId: v.id("products"),
    userId: v.string(),                // Clerk user ID
    rating: v.number(),
    text: v.string(),
    createdAt: v.number(),
  })
    .index("by_product", ["productId"])
    .index("by_user", ["userId"]),

  // ── orders & purchase history ──
  orders: defineTable({
    userId: v.string(),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
      priceAtPurchase: v.number(),
    })),
    total: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_date", ["userId", "createdAt"]),

  // ── user preferences (built from purchase history + explicit signals) ──
  userPreferences: defineTable({
    userId: v.string(),
    favoriteCategories: v.array(v.string()),
    priceRange: v.object({
      min: v.number(),
      max: v.number(),
    }),
    favoriteBrands: v.array(v.string()),
    tags: v.array(v.string()),         // accumulated interest tags
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"]),

  // ── co-occurrence matrix (precomputed, phase 2) ──
  productCoOccurrences: defineTable({
    productId: v.id("products"),
    relatedProductId: v.id("products"),
    score: v.number(),                 // co-purchase frequency / confidence
  })
    .index("by_product", ["productId"])
    .index("by_product_score", ["productId", "score"]),

  // ── behavior tracking (aggregated, not raw events) ──
  behaviorSessions: defineTable({
    userId: v.optional(v.string()),    // optional for anonymous users
    sessionId: v.string(),
    productsViewed: v.array(v.object({
      productId: v.id("products"),
      dwellTimeMs: v.number(),
      scrollDepth: v.number(),         // 0-1
      cursorHoverMs: v.number(),
      viewedReviews: v.boolean(),
      timestamp: v.number(),
    })),
    currentPage: v.string(),           // URL or route
    cartProductIds: v.array(v.id("products")),
    updatedAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"]),

  // ── AI suggestions ──
  suggestions: defineTable({
    userId: v.optional(v.string()),
    sessionId: v.string(),
    triggerType: v.string(),           // "dwell", "scroll", "idle", "review_view", etc.
    triggerProductId: v.id("products"),
    suggestedProducts: v.array(v.object({
      productId: v.id("products"),
      reason: v.string(),
    })),
    message: v.string(),               // natural language from LLM
    status: v.string(),                // "pending", "shown", "dismissed", "clicked"
    createdAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_session_status", ["sessionId", "status"]),

  // ── cart ──
  carts: defineTable({
    userId: v.optional(v.string()),
    sessionId: v.string(),
    items: v.array(v.object({
      productId: v.id("products"),
      quantity: v.number(),
    })),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_session", ["sessionId"]),
});
```

---

## client-side tracking approach

### libraries to use

| signal | tool | notes |
|---|---|---|
| viewport / in-view | `react-intersection-observer` | `useInView` hook, gold standard for detecting visible products |
| dwell time | custom hook + IntersectionObserver | start timer on enter viewport, stop on exit |
| scroll depth | `react-scroll-percentage` or custom | percentage of product page scrolled |
| cursor proximity | custom `mousemove` hook, throttled 150ms | which product card is nearest to cursor |
| idle detection | `react-idle-timer` | detect when user stops interacting |
| eye tracking | WebGazer.js (optional, phase 6) | requires webcam consent, supplementary signal only |

### event batching strategy

```
client-side buffer (array of behavior events)
  ↓
flush every 3-5 seconds OR on 20+ events OR on page navigation
  ↓
single Convex mutation: upsert behaviorSession with aggregated data
```

- use `navigator.sendBeacon` on page unload to flush remaining events
- throttle mousemove to 150ms intervals
- debounce dwell time (only record after 500ms of continuous viewing)
- compute aggregates client-side (total dwell time, max scroll depth) — don't send raw events

### composite interest score

```
interestScore =
    (dwellTimeMs / 1000) * 0.35
  + scrollDepth * 0.25
  + (cursorHoverMs / 1000) * 0.15
  + (viewedReviews ? 1 : 0) * 0.25
```

when `interestScore > threshold` (tunable, start with 2.0) → fire trigger

---

## trigger system

### when to activate

based on CHI 2024 research: suggestions shown **after** a natural pause are preferred. never interrupt mid-action.

| trigger | condition | cooldown |
|---|---|---|
| product dwell | >3s on a single product card in list view | 30s per product |
| deep scroll | >50% scroll on product detail page | once per page view |
| review engagement | >5s viewing review section | once per page view |
| idle on product | >8s idle on product detail page | once per page view |
| comparison behavior | 3+ products viewed in same category, no add-to-cart | 60s |

### global rules

- max 1 suggestion per 45 seconds (avoid annoyance)
- max 3 suggestions per session before requiring user interaction
- don't trigger if user is actively scrolling or typing
- dismiss suggestion after 15 seconds if not interacted with
- never show suggestion for a product already in cart

---

## LLM integration strategy

### two-stage architecture (recommended by all research)

```
stage 1: candidate generation (static algorithms, fast, <50ms)
  → collaborative filtering: top 20 co-purchased products
  → content-based: top 20 similar products (category, tags, price)
  → trending: top 10 in category
  → merge + deduplicate → ~30 candidates

stage 2: LLM re-ranking & messaging (Gemini Flash, 300-500ms)
  → send candidates + user context
  → LLM picks top 3-5 and generates explanation
  → returns structured JSON
```

### context sent to Gemini

```json
{
  "current_product": { "title": "...", "category": "...", "price": 99, "rating": 4.5 },
  "user_behavior": {
    "dwell_time_seconds": 8,
    "scroll_depth": 0.72,
    "viewed_reviews": true,
    "trigger": "deep_scroll"
  },
  "user_profile": {
    "favorite_categories": ["electronics", "accessories"],
    "avg_spend": 85,
    "recent_purchases": ["Wireless Mouse", "USB-C Hub"]
  },
  "cart": ["Mechanical Keyboard"],
  "candidates": [
    { "id": "...", "title": "...", "price": 49, "category": "...", "rating": 4.2, "co_purchase_score": 0.8 },
    ...
  ]
}
```

keep total prompt under **2-4K tokens** for sub-500ms responses. use Gemini's `thinking_level: "minimal"` for speed.

### expected LLM output

```json
{
  "suggestions": [
    { "product_id": "...", "reason": "pairs well with the keyboard in your cart" },
    { "product_id": "...", "reason": "better deal — same specs, 30% off" }
  ],
  "message": "great pick on the keyboard — here's a wrist rest that pairs perfectly with it, and a monitor stand that other buyers loved."
}
```

### Gemini Flash specifics

- **Gemini 2.0 Flash**: ~300ms TTFT, $0.10/M input tokens, $0.40/M output — cheapest option
- **Gemini 3.0 Flash**: purpose-built for real-time, has `thinking_level` param, $0.50/M input
- context caching can cut costs by 75% for repeated product contexts
- native JSON mode with >99% schema adherence

### Convex integration pattern

1. trigger fires → mutation writes to `suggestions` table with `status: "pending"`
2. mutation schedules `internalAction` via `ctx.scheduler.runAfter(0, ...)`
3. action assembles context, calls Gemini API
4. action calls `internalMutation` to update suggestion with LLM response, set `status: "ready"`
5. client subscribes to `suggestions` query filtered by sessionId + status — auto-updates when ready

---

## static recommendation algorithms

these run in phase 2, before any AI, and continue to serve as the candidate generation layer in phase 5.

### co-occurrence ("frequently bought together")

```
for each order:
  for each pair (product_a, product_b) in order.items:
    co_occurrence[a][b] += 1

confidence(a → b) = co_occurrence[a][b] / total_orders_containing(a)
```

precompute and store in `productCoOccurrences` table. recompute periodically (e.g., daily via Convex cron).

### content-based similarity

```
similarity(a, b) =
    (same_category ? 3 : 0)
  + (overlapping_tags * 1)
  + (same_brand ? 2 : 0)
  + (price_within_20% ? 1 : 0)
```

computed on-the-fly since it's just attribute comparison.

### trending with time decay

```
score = purchase_count * e^(-0.05 * age_in_hours)
```

query recent orders, aggregate by product, apply decay. segment by category.

---

## fake store & seed data

### product data

use **DummyJSON** (`dummyjson.com`) as the base — 194 products across 24 categories with rich schema (title, description, price, discount, rating, stock, brand, category, images). supplement with `@faker-js/faker` for additional products if needed.

### seed script approach

1. fetch products from DummyJSON API, transform to match our schema, insert into Convex
2. generate ~50 fake users with `faker.js` (names, preferences)
3. generate ~500 orders with realistic patterns:
   - cluster purchases by user "persona" (tech enthusiast, home decor, fashion)
   - power-law distribution (few heavy buyers, many light buyers)
   - timestamps spanning 3 months
4. precompute co-occurrence matrix from seeded orders
5. compute user preferences from purchase history

use `faker.seed(42)` for reproducible data across runs.

### product schema mapping (DummyJSON → Convex)

```
DummyJSON field    → Convex field
title              → title
description        → description
category           → category
price              → price
discountPercentage → discountPrice (computed)
rating             → rating
stock              → stock
brand              → brand
tags               → tags
images             → images
```

---

## key libraries & tools

| library | purpose | phase |
|---|---|---|
| `@faker-js/faker` | seed data generation | 1 |
| `react-intersection-observer` | viewport/in-view tracking | 3 |
| `react-scroll-percentage` | scroll depth tracking | 3 |
| `react-idle-timer` | idle detection | 3 |
| `@google/generative-ai` | Gemini API client | 5 |
| `@convex-dev/ratelimiter` | rate limiting per user | 5 |
| `webgazer` | browser eye tracking (optional) | 6 |

---

## sources & references

### academic papers

- Huang et al. "No Clicks, No Problem: Using Cursor Movements" — CHI 2011 ([pdf](https://jeffhuang.com/papers/CursorBehavior_CHI11.pdf))
- Arapakis & Leiva "Learning Efficient Representations of Mouse Movements" — SIGIR 2020 ([arxiv](https://arxiv.org/abs/2006.01644))
- Meta "Actions Speak Louder than Words" (HSTU) — 2024 ([arxiv](https://arxiv.org/pdf/2402.17152))
- "Enhancing UX with Proactive AI: Effects of Timing" — CHI 2024 ([acm](https://dl.acm.org/doi/10.1145/3613904.3642168))
- "A Survey on User Behavior Modeling in Recommender Systems" — IJCAI 2023 ([pdf](https://www.ijcai.org/proceedings/2023/0746.pdf))
- "Large Language Model Enhanced Recommender Systems" — arXiv 2412.13432
- "A Survey on Session-based Recommender Systems" — ACM Computing Surveys 2021
- "A Comprehensive Review of Recommender Systems" — arXiv 2407.13699
- "LLM4Rec: A Comprehensive Survey" — Future Internet, 2025
- "Quantifying Attention via Dwell Time and Engagement" — arXiv 2022 ([pdf](https://arxiv.org/pdf/2209.10464))
- "CoLLM: Integrating Collaborative Embeddings into LLMs for Recommendation" — TKDE 2025
- "Enabling Explainable Recommendation with LLM-powered Knowledge Graph" — arXiv 2412.01837
- "The Application of Large Language Models in Recommendation Systems" — arXiv 2501.02178

### engineering blogs & guides

- [Shopify: The Generative Recommender](https://shopify.engineering/generative-recommendations)
- [Eugene Yan: Improving RecSys in the Age of LLMs](https://eugeneyan.com/writing/recsys-llm/)
- [Elastic: Using LLMs to Summarize User Sessions](https://www.elastic.co/security-labs/using-llms-to-summarize-user-sessions)
- [JetBrains: Smarter Context Management for LLMs](https://blog.jetbrains.com/research/2025/12/efficient-context-management/)
- [Google: USER-LLM Contextualization with User Embeddings](https://research.google/blog/user-llm-efficient-llm-contextualization-with-user-embeddings/)
- [Redis: Guide to E-commerce Recommendation Engines](https://redis.io/blog/ecommerce-product-recommendation-engine/)
- [Smashing Magazine: Design is All About Good Timing](https://www.smashingmagazine.com/2022/03/design-is-all-about-good-timing/)

### Convex-specific patterns

- [Convex Actions docs](https://docs.convex.dev/functions/actions)
- [Convex AI Agents](https://docs.convex.dev/agents)
- [Convex rate limiting](https://stack.convex.dev/rate-limiting)
- [Convex single-flighting](https://stack.convex.dev/throttling-requests-by-single-flighting)
- [Convex high-throughput mutations](https://stack.convex.dev/high-throughput-mutations-via-precise-queries)
- [Convex streaming chat component](https://stack.convex.dev/build-streaming-chat-app-with-persistent-text-streaming-component)

### APIs & tools

- [DummyJSON — fake product API](https://dummyjson.com/docs/products) (194 products, 24 categories)
- [FakeStoreAPI](https://fakestoreapi.com/) (simpler alternative, 20 products)
- [Faker.js Commerce module](https://fakerjs.dev/api/commerce)
- [WebGazer.js — browser eye tracking](https://webgazer.cs.brown.edu/)
- [react-intersection-observer](https://github.com/thebuilder/react-intersection-observer)
- [react-idle-timer](https://idletimer.dev/)
- [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [Gemini prompt strategies](https://ai.google.dev/gemini-api/docs/prompting-strategies)

### industry stats

- 35% of Amazon's revenue (~$70B/year) comes from recommendations
- shoppers engaging with AI assistants convert at 12.3% vs 3.1% without (4x uplift)
- 70%+ of AI shopping queries are about **product validation** (sizing, compatibility), not discovery
- Bloomreach reports 9% conversion increase + 20% AOV increase from AI assistants
- conversational commerce hit $290B globally in 2025
