# scale considerations

what changes when targeting large stores (10K+ products, 100K+ users, millions of orders).

this document captures what breaks from the original small-scale plan and what the architecture needs to look like for production-grade recommendation at scale.

---

## what broke in the original plan

| original assumption | breaks at scale because | fix |
|---|---|---|
| content-based similarity on-the-fly (1 vs 199 products) | 1 vs 9,999 products per request is too slow for real-time queries | **precompute top-N similar** via batch action using `vectorSearch()` (action-only, cannot be used in queries) |
| co-occurrence precomputed in a single Convex action | millions of orders = millions of pair operations, exceeds action timeout/memory | **batched precomputation** via multiple scheduled actions |
| "similar products" scans all products in category | 5,000+ products per category can't be `.collect()`ed in a query | **precomputed similarity table** + index lookup |
| "for you" scores all products against user profile | can't score 50K products per request | **two-stage: index-driven candidate retrieval → score subset** |
| co-occurrence storage ~3,000 pairs | 10K products = 100K-500K meaningful pairs | still fits in Convex, but precomputation needs batching |
| discount % sort "in memory, only 200 products" | 5,000 per category can't sort in memory | **precompute discountPercent field** + index on it |
| `products.by_category_and_purchaseCount` single index per sort | works fine but complex multi-filter queries (price range + brand + rating + in stock) need thought | **filter after index narrowing** — Convex handles this, but query planning matters |

---

## revised architecture for scale

### 1. content-based similarity → precomputed similarity via vector search

**original:** compute weighted attribute score on-the-fly for all products
**at scale:** use Convex's **vector search index** on product embeddings, but via a precomputation pipeline (not at query time)

**critical constraint:** Convex `vectorSearch()` is only available in actions, not in queries. this means you cannot use it to build a reactive `similarProducts` query that auto-updates when data changes. two approaches:

**approach A — precomputed similarity table (recommended for product detail page):**
- a batch action runs `vectorSearch()` for each product to find its top-N neighbors
- stores results in a `productSimilarity` table (same pattern as `productCoOccurrences`)
- the `similarProducts` query reads from this table — fast, reactive, O(1) per product
- recompute via cron (daily) or on product insert/update

**approach B — action-based retrieval (for AI candidate generation):**
- the AI context assembler runs as an action and can call `vectorSearch()` directly
- useful when reactivity isn't needed (assembling candidates for the LLM)
- loses reactivity but gains real-time similarity without precomputation

```typescript
// schema: embedding on products table (or a separate productEmbeddings table)
products: defineTable({
  // ... existing fields ...
  embedding: v.optional(v.array(v.float64())),
})
  .vectorIndex("by_embedding", {
    vectorField: "embedding",
    dimensions: 128, // or 256, tune for quality vs storage
    filterFields: ["category"],
  })

// precomputed results table (approach A)
productSimilarity: defineTable({
  productId: v.id("products"),
  similarProductId: v.id("products"),
  score: v.number(),
})
  .index("by_product_and_score", ["productId", "score"])
```

**when to generate embeddings:**
- on product insert/update via an internal action
- batch recompute when embedding model changes
- use Google's `gemini-embedding-001` model (not Gemini Flash — use the dedicated embedding model). cost: ~$0.006 per 10K products at ~50 tokens per product

### 2. co-occurrence → batched precomputation with sparse storage

**original:** single action reads all orders, computes all pairs
**at scale:** batched pipeline

```
step 1: _startCoOccurrenceJob()
  → query orders in batches of 1,000 (paginated)
  → for each batch, compute pairwise co-occurrences
  → accumulate in a temporary aggregation table

step 2: _finalizeCoOccurrences()
  → read aggregation table
  → compute Jaccard scores
  → for each product, keep only top-20 co-occurring products (sparse)
  → write to productCoOccurrences table
  → clean up aggregation table
```

key change: **only store top-N per product**, not all pairs. at 10K products with top-20 each, that's 200K rows — manageable.

schedule: daily cron, but the job itself runs as multiple chained actions (each processes a batch, schedules the next).

### 3. personalized "for you" → two-stage retrieval

**original:** read user's purchases, look up co-occurrences, score all candidates on-the-fly
**at scale:** can't score 50K products. need candidate generation first.

```
stage 1: candidate generation (fast, index-driven)
  → co-occurrence candidates: read user's last 20 purchases,
    look up top-10 co-occurring products each = ~200 candidates
  → vector similarity candidates: use user's purchase embeddings
    to query vector index = ~50 candidates
  → category preference candidates: query products in user's
    top 3 categories, sorted by trending = ~60 candidates
  → merge + deduplicate = ~200-300 candidates

stage 2: scoring + ranking (on the candidate set only)
  → compute RRF across co-occurrence rank, similarity rank, trending rank
  → apply MMR diversity
  → return top 10-20
```

this is the same two-stage pattern from the AI integration plan, but applied to the static algorithm layer too. the key insight: **candidate generation uses indexes, scoring operates on a small subset**.

### 4. category page queries at scale

the existing index strategy actually works well for most sorts:

| sort | index | scales? |
|------|-------|---------|
| popular | `by_category_and_purchaseCount` | yes — index scan |
| newest | `by_category` (by _creationTime) | yes — index scan |
| price asc/desc | `by_category_and_price` | yes — index scan |
| rating | `by_category_and_rating` | yes — index scan |
| review count | `by_category_and_reviewCount` | yes — index scan |
| discount % | was "in-memory sort" | **no** — fix below |

**fix for discount sort:** precompute a `discountPercent` field on the product document. update it when price or originalPrice changes. add index:

```typescript
.index("by_category_and_discountPercent", ["category", "discountPercent"])
```

**multi-filter queries:** Convex doesn't support multiple inequality filters in a single index. for complex filter combos (price range + min rating + brand), the strategy is:
1. use the most selective index (usually category + sort field)
2. apply remaining filters via `.filter()` on the narrowed result set
3. for paginated queries, this means the server may need to scan past some non-matching documents to fill a page — acceptable as long as the index narrows sufficiently

at extreme scale (100K+ products in a single category with tight filters), this could become slow. the fix is **faceted search** via Convex search indexes or a dedicated filtering table. but for 10K total products, the basic approach works.

### 5. seed data at scale

**original:** fetch ~200 products from DummyJSON
**at scale target:** 5,000-10,000 products across 15-20 categories

sources for realistic product data:
- **DummyJSON** — 194 products (use as a base, multiply with variations)
- **Faker.js** — generate product variations (different colors, sizes, models)
- **Open product datasets:**
  - Amazon Product Dataset (Kaggle) — millions of products with reviews
  - Best Buy Product API (developer access)
  - Google Shopping dataset snippets
- **generation strategy:** seed 200 base products from DummyJSON, then generate 10-50 variations each using Faker.js (different specs, prices, brands within the same category)

for orders: generate 50K-100K orders across 5K-10K users with realistic patterns (power-law distribution, category clustering by persona).

for reviews: 3-10 reviews per product = 15K-100K reviews.

---

## revised precomputation vs on-the-fly

| data | small scale (<500 products) | large scale (5K-50K products) |
|------|---------------------------|-------------------------------|
| co-occurrence | single action, all pairs | batched pipeline, top-N per product |
| content similarity | on-the-fly (score all) | **precomputed `productSimilarity` table** (batch action uses `vectorSearch()`, stores top-N per product) |
| trending | field on product doc | field on product doc (same) |
| discount % | computed in memory | **precomputed field + index** |
| "for you" | score all candidates | **two-stage: candidate generation → scoring** |
| "similar products" | score all in category | **read from `productSimilarity` table** (reactive query) or action-based `vectorSearch()` for AI context |

note: Convex `vectorSearch()` is action-only. all query-time similarity lookups at scale must read from precomputed tables, not call `vectorSearch()` directly.

---

## what stays the same at scale

not everything changes. these parts of the original plan scale fine:

- **Jaccard similarity as the co-occurrence metric** — the math is the same, just the computation pipeline changes
- **exponential time decay for trending** — precomputed on product doc, scales to any catalog size
- **Bayesian average for ratings** — updated per review, O(1) per update
- **RRF for combining ranked lists** — works on any number of input signals
- **MMR for diversity** — applied to the final top-N, not the full catalog
- **switching hybrid strategy** — the fallback logic (purchases → favorites → trending) is independent of scale
- **cold-start approach** — same progressive enhancement, same signals
- **the AI integration layer** — the LLM always operates on a pre-filtered candidate set (20-30 products), regardless of total catalog size

---

## schema additions for scale

```typescript
// add to products table
discountPercent: v.optional(v.number()),  // precomputed: (originalPrice - price) / originalPrice * 100
embedding: v.optional(v.array(v.float64())), // for vector similarity

// add index
.index("by_category_and_discountPercent", ["category", "discountPercent"])
.vectorIndex("by_embedding", {
  vectorField: "embedding",
  dimensions: 128,
  filterFields: ["category"],
})
```

```typescript
// new table for batched co-occurrence computation
coOccurrenceAggregation: defineTable({
  productIdA: v.id("products"),
  productIdB: v.id("products"),
  count: v.number(),
  batchId: v.string(),
})
  .index("by_batch", ["batchId"])
  .index("by_product_pair", ["productIdA", "productIdB"])
```

```typescript
// new table for precomputed product similarity (replaces query-time vector search)
// populated by a batch action that calls vectorSearch() and stores top-N per product
productSimilarity: defineTable({
  productId: v.id("products"),
  similarProductId: v.id("products"),
  score: v.number(),
})
  .index("by_product_and_score", ["productId", "score"])
```

---

## revised data volume estimates

| table | small (200 products) | large (10K products) | notes |
|-------|---------------------|---------------------|-------|
| products | 200 | 10,000 | +embedding field (~1KB each) |
| reviews | 600 | 50,000-100,000 | |
| orders | 500 | 100,000-500,000 | |
| productCoOccurrences | 3,000 | 200,000 (top-20 per product) | |
| cartItems | ~100 | ~50,000 concurrent | |
| favorites | ~200 | ~200,000 | |
| userPreferences | 50 | 10,000-100,000 | |

all well within Convex's capacity. the main concern isn't storage — it's **query scan width** (how many documents a single query needs to read). the index + precomputed table strategy keeps scans narrow at any scale.

---

## implementation impact

what changes in the implementation phases:

### phase 2 (data layer)
- add `discountPercent` field to products schema
- add `embedding` field to products schema (optional initially)
- add vector search index definition
- expand seed script to generate 5K-10K products

### phase 3 (recommendations)
- co-occurrence: implement batched pipeline instead of single action
- similar products: implement precomputed `productSimilarity` table populated by batch action using `vectorSearch()` (Convex vector search is action-only, cannot be used in reactive queries)
- "for you": implement two-stage candidate generation
- add embedding generation action (uses `gemini-embedding-001` or computes from attributes)
- add `productSimilarity` table to schema

### phases 4-7 (unchanged)
- behavior tracking, triggers, AI integration — all operate on the pre-filtered candidate set, so they're scale-independent

---

## the bottom line

the algorithms don't change. the math is the same. what changes is **how we retrieve candidates**:

| approach | small scale | large scale |
|----------|-----------|------------|
| find similar products | scan all, score, sort | precomputed `productSimilarity` table (batch action uses `vectorSearch()`) |
| find co-occurring products | precomputed table (all pairs) | precomputed table (top-N per product) |
| personalized recommendations | score all candidates | two-stage: index retrieval → score subset |
| category page sorts | index works | index works + precompute discount field |

the key principle: **indexes and precomputation replace in-memory scanning.** Convex `vectorSearch()` is action-only, so query-time similarity requires reading from a precomputed table. the action-based path is available for non-reactive use cases (AI context assembly).
