# architecture research

Convex components, monorepo strategy, and whether to split services.

---

## verdict

**stay pure Convex monorepo.** the scale (5K-10K products, 100K+ orders) is well within Convex's comfort zone. splitting services adds operational complexity without meaningful benefit. one tactical escape hatch: product search (typo tolerance) — revisit only if users struggle.

---

## Convex components to use

### 1. `@convex-dev/agent` — AI shopping assistant backbone

the most important component. full framework for building AI agents with persistent chat history, thread management, tool calling, and streaming. wraps Vercel AI SDK — use `@ai-sdk/google` for Gemini Flash.

**why it matters for us:**
- persistent conversation threads per user/session — exactly what the sidebar needs
- **streaming via database deltas** (not HTTP) — pass `{ saveStreamDeltas: true }` and all connected clients get real-time updates via Convex subscriptions. no HTTP streaming endpoint needed
- built-in tool calling — the assistant can call `searchProducts`, `addToCart`, `getRecommendations` as Convex functions
- automatic context management — previous messages included in LLM calls
- built-in rate limiting integration (wraps `@convex-dev/rate-limiter`)
- usage tracking per user/model for cost monitoring

**phase:** 6 (AI integration). this replaces our manual `requestAdvice → _generateAdvice → _saveAdvice` flow with a much more elegant pattern. the agent handles conversation state, streaming, tool use, and persistence automatically.

**implication for advisor sidebar:** the sidebar's `AdvisorProvider` can subscribe to the agent's thread — conversation history, streaming state, and pending responses all come from the agent component. no need to build custom conversation management.

**gotcha:** uses Vercel AI SDK, so install `@ai-sdk/google` alongside it. streaming uses delta chunks saved to DB with configurable chunking ("word", "line", regex) — not raw websocket streaming. this is actually better for our use case since multiple clients can subscribe to the same stream.

### 2. `@convex-dev/rate-limiter` — AI call throttling

database-backed rate limiting with token bucket and fixed window algorithms. stores only 2 numbers per limit. supports sharding for high throughput.

**why it matters for us:**
- rate limit AI calls per user (10 requests/minute token bucket with burst allowance)
- rate limit against Gemini API quotas (fixed window matching their limits)
- reserved capacity — if a user exceeds the limit, schedule the call for when tokens are available with jitter
- transactional — if a mutation throws after consuming a token, consumption is rolled back

**phase:** 6 (AI integration), applied from day one.

### 3. `@convex-dev/aggregate` — sharded counters + efficient aggregation (deferred)

maintains denormalized counts, sums, min/max in O(log n) time. acts as both an aggregate engine and a sharded counter.

**what it would give us:**
- **purchase counts per product** — no more manual `patch(productId, { purchaseCount: count + 1 })` with OCC conflicts
- **review counts + average ratings** — sum values with namespacing by product, compute avg automatically
- **trending scores** — aggregate purchase/view counts over time windows
- **offset-based pagination** for product listings ("page 3 of 50")

**decision: deferred.** this project is research/study-focused and won't hit the OCC contention levels that justify adding another component. simple `patch()` denormalization is sufficient for the initial scale target (~200 products, ~50 users). revisit if hot-product write conflicts become measurable at larger scale.

**if adopted later:** use `convex-helpers` triggers to automatically sync writes to the aggregate component on `orders` and `reviews` table mutations.

### 4. `@convex-dev/workpool` — job queue with parallelism control

managed job queue with parallel execution limits, retries with exponential backoff, completion callbacks, batch enqueuing.

**why it matters for us:**
- **batch embedding generation** — enqueue embedding jobs for product descriptions with `maxParallelism: 10` to avoid overwhelming the Gemini API
- **batch co-occurrence computation** — enqueue matrix updates with controlled parallelism
- **separate pools for different workloads** — AI pool, embedding pool, each with independent limits
- **pause/resume** — set `maxParallelism: 0` to pause during maintenance

**phase:** 3 (recommendations) and 6 (AI). use for all batch processing that calls external APIs.

**gotcha:** free tier max 20 concurrent actions across all pools, pro tier max 100.

### 5. `@convex-dev/workflow` — durable multi-step workflows

orchestrates long-running workflows that survive server restarts. each step can be a query, mutation, action, or nested workflow with independent retry config. supports parallel steps.

**why it matters for us:**
- **order processing workflow**: validate cart → snapshot products → create order → update purchase counts → clear cart → schedule confirmation. with per-step retries, if Gemini is down for the post-purchase recommendation, the order still completes
- **batch recommendation recomputation**: fetch purchases (paginated) → compute co-occurrence → update trending → generate embeddings for new products. durable across restarts
- **embedding recomputation**: fan out in batches of 50 products per step, each calling Gemini. 200 steps for 10K products, each independent, with retry

**phase:** 2 (order processing) and 3 (batch recommendations).

**gotcha:** handlers must be deterministic — no `Math.random()`, `Date.now()`, or `fetch()` inside the handler itself (those go in steps).

### 6. `convex-helpers` triggers — event-driven side effects

fires when documents are created, updated, or deleted. you register trigger functions on specific tables.

**why it matters for us:**
- **aggregate sync** — trigger on `orders` to automatically call `aggregate.insert()` for purchase counts
- **review denormalization** — trigger on `reviews` to update product's average rating via aggregate component
- **recommendation invalidation** — trigger on `orders` to flag stale co-occurrences
- **discountPercent precomputation** — trigger on `products` when price or originalPrice changes

**phase:** all phases — foundational utility that makes the aggregate component much less error-prone.

---

## components to skip

| component | why skip |
|---|---|
| `@convex-dev/persistent-text-streaming` | `@convex-dev/agent` already has built-in delta streaming — using both is redundant |
| `@convex-dev/action-retrier` | `@convex-dev/workpool` is a superset (has retries + parallelism + batching) |
| custom sharded counters | `@convex-dev/aggregate` covers this if we need it later (deferred for now) |

---

## component summary

| need | component | phase |
|---|---|---|
| AI shopping assistant | `@convex-dev/agent` + `@ai-sdk/google` | 6 |
| streaming AI responses | agent's built-in delta streaming | 6 |
| rate limiting AI calls | `@convex-dev/rate-limiter` | 6 |
| batch embedding / co-occurrence | `@convex-dev/workpool` | 3 |
| order + recommendation pipelines | `@convex-dev/workflow` | 2, 3 |
| table write side-effects | `convex-helpers` triggers | all |
| scheduled recomputation | built-in cron jobs (no component) | 3 |
| client query caching | `convex-helpers` `ConvexQueryCacheProvider` | 2 |

note: `@convex-dev/aggregate` is covered in section 3 above — evaluated and deferred for now.

---

## monorepo package structure

the current structure is solid. recommended additions:

### keep inside `packages/backend/convex/`

```
packages/backend/convex/
├── model/                    # pure logic helpers (testable, no ctx dependency)
│   ├── recommendations.ts    # Jaccard, RRF, MMR, similarity scoring
│   ├── trending.ts           # exponential decay math
│   └── similarity.ts         # weighted attribute scoring
├── functions/                # Convex function wrappers (thin, call into model/)
│   ├── products.ts
│   ├── orders.ts
│   ├── recommendations.ts
│   └── tracking.ts
├── jobs/                     # batch actions + cron definitions
│   ├── computeCooccurrence.ts
│   ├── computeEmbeddings.ts
│   └── computeTrending.ts
└── schema.ts
```

follows Convex best practice: "most of your code should live in `convex/model/`, and your public API should have very short functions that mostly just call into `convex/model/`."

the recommendation engine should **not** be a separate package — it's tightly coupled to database reads via `ctx.db`. extracting it would mean duplicating Convex function wrappers or creating awkward indirection.

### new package: `packages/tracking`

client-side behavior tracking hooks. pure React, no Convex server dependency, reusable:

```
packages/tracking/
├── src/
│   ├── use-dwell-time.ts
│   ├── use-viewport-tracking.ts
│   ├── use-scroll-depth.ts
│   ├── use-product-engagement.ts    # composite hook
│   └── event-buffer.ts              # batched flush to Convex
└── package.json
```

this is a clean separation — hooks emit events, the backend processes them.

---

## should any part be a separate service?

### embedding generation: no

10K products × 50 per batch = 200 steps. each step takes ~2-5s for the Gemini call. the `@convex-dev/workflow` component handles this with retry and durability, and each step stays under the 10-minute action limit.

### co-occurrence batch computation: no

the key constraint is the 32,000 document scan limit per transaction, not the timeout. pattern: action reads orders in paginated batches (multiple `runQuery` calls), accumulates in memory (512MB is plenty for a 10K × 10K sparse matrix), writes results via batched mutations. if it exceeds 10 minutes, use the workflow component with checkpointing.

### LLM calls: no

Convex actions call Gemini directly. the `@convex-dev/agent` component handles streaming, conversation state, and tool calling. a separate API service would mean managing a separate deployment, losing Convex's reactive guarantees, and gaining nothing at this scale.

### product search: maybe, later

Convex's built-in full-text search (BM25 scoring, prefix matching) is adequate for 5K-10K products. **but** fuzzy matching was deprecated (Jan 2025) — "sneaker" won't match "sneakers" unless you handle stemming yourself. this is the one area where an external service (Typesense — lightweight, great typo tolerance) would genuinely improve UX.

**recommendation:** start with Convex built-in search. add Typesense only if users actually struggle with search quality.

### vector search: no

Convex has built-in vector search supporting millions of vectors and up to 4096 dimensions. 10K product embeddings at 128 dimensions is trivially within capacity.

---

## why staying pure Convex is the elegant choice

1. **single deployment** — no infra management, no service mesh, no inter-service auth
2. **reactive everything** — cart, favorites, order status, AI streaming, recommendation updates all live with zero extra code
3. **ACID transactions** — inventory/order consistency guaranteed, no eventual consistency headaches
4. **the component ecosystem fills the gaps** — agent for AI, workpool for batching, workflow for orchestration, aggregate for counters. these are first-party, well-integrated, and solve real problems
5. **the monorepo keeps types aligned** — end-to-end type safety from UI components through Convex functions to schema. a separate service breaks this chain

the principle: **don't split until staying together hurts.** at 10K products and 100K orders, nothing hurts yet. the components handle the complexity that would otherwise push you toward microservices.

---

## the one thing to watch

**search quality.** Convex's lack of fuzzy/typo tolerance is a real UX gap for e-commerce. if users search "hphones" expecting "headphones" and get nothing, that's a conversion killer. monitor search miss rates and consider Typesense if they're high. the integration pattern is simple: trigger on product writes → push to Typesense via action → query Typesense from search endpoint → return Convex IDs.
