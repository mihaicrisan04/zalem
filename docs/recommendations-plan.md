# recommendations engine plan

algorithms, data requirements, architecture, and implementation strategy for the zalem store.

**scale target:** 5K-10K products, 10K-100K users, 100K-500K orders. see `docs/scale-considerations.md` for the full analysis of what breaks at scale and the architectural fixes.

---

## algorithm selection

**seed data:** ~200 products, ~50 users, ~500 orders. **scale target:** 5K-10K products, 100K+ orders.

the algorithms need to be:
- implementable in pure TS (no native modules, runs in Convex runtime)
- effective with sparse data at launch, scalable to 10K+ products
- cheap to compute (serverless, no persistent process)

### algorithm comparison

#### 1. frequently bought together

| algorithm | how it works | pros | cons | verdict |
|-----------|-------------|------|------|---------|
| **simple co-occurrence count** | count orders containing both A and B | dead simple, fast | biased toward bestsellers — a popular item co-occurs with everything | skip |
| **Jaccard similarity** | `\|A∩B\| / \|A∪B\|` — co-occurrence normalized by union | normalizes for popularity, 0-1 range, intuitive | can overweight rare pairs (2 items bought once together = Jaccard 1.0) | **use this** + min support filter |
| **Lift** | `P(A,B) / (P(A) × P(B))` — surprisingness of co-occurrence | finds genuinely surprising associations, controls for popularity of both items | very noisy with small counts, undefined if either has 0 purchases | good backup, but Jaccard + min support achieves similar results more simply |
| **Log-Likelihood Ratio** | statistical test comparing observed vs expected co-occurrence | most statistically sound, handles sparse data best | more complex (2x2 contingency table), harder to interpret, overkill for 200 products | skip — marginal improvement over Jaccard at this scale |

**decision: Jaccard with minimum support threshold of 2-3 co-occurrences.**

at 500 orders with avg 3 items per order, building the co-occurrence matrix is ~4,500 pair operations. trivial. storage: ~2,000-5,000 nonzero pairs.

**at scale (100K+ orders):** millions of pair operations exceed a single Convex action timeout/memory. fix: batched pipeline — process orders in batches of 1,000 via chained scheduled actions, accumulate in a temporary aggregation table, then finalize top-20 per product. see `docs/scale-considerations.md` §2.

#### 2. similar products

| approach | how it works | pros | cons | verdict |
|----------|-------------|------|------|---------|
| **weighted attribute scoring** | same_category(+0.35) + shared_tags_jaccard(+0.25) + same_brand(+0.15) + price_proximity(+0.15) + rating_proximity(+0.10) | pure JS, no libraries, tunable weights, works from day zero | limited by attribute quality, needs manual weight tuning | **use this** — best simplicity/quality ratio |
| **TF-IDF on descriptions** | tokenize descriptions, compute TF-IDF vectors, cosine similarity | captures semantic similarity beyond attributes | 100-200 lines of code, needs `natural` npm package, marginal improvement over attribute scoring at 200 products | skip for now |
| **embedding similarity** | embed descriptions via LLM API, cosine similarity | best semantic quality | requires external API call, vector storage (~1536 floats per product), adds latency | skip — can add in phase 6 when LLM is integrated |

**decision: weighted attribute scoring at small scale, precomputed similarity table at scale.**

at ~200 products, computing 1 vs 199 with simple arithmetic takes <1ms. at 10K+ products, this becomes 1 vs 9,999 per request — too slow.

**important Convex constraint:** `vectorSearch()` is only available in actions, not queries. this means it cannot back reactive queries like `similarProducts()` directly. the scale path has two options:
1. **precomputed similarity table** — a batch action uses `vectorSearch()` to find top-N similar products per product, stores results in a `productSimilarity` table, and a query reads from that table (same pattern as `productCoOccurrences`). recompute via cron or on product insert/update.
2. **action-based retrieval** — the `similarProducts` function becomes an action that calls `vectorSearch()` and then `ctx.runQuery()` to hydrate results. this loses reactivity but gains real-time similarity. best for the AI advisor context assembly where reactivity isn't needed.

**implementation plan:** start with weighted attribute scoring (works from day zero, no embedding generation needed). at scale, use option 1 (precomputed table) for product detail page "similar products" (needs reactivity) and option 2 (action-based) for AI candidate generation (no reactivity needed). see `docs/scale-considerations.md` §1 for details.

**similarity formula:**
```
similarity(A, B) =
    0.35 × sameCategory(A, B)                    // 1 or 0
  + 0.25 × jaccardTags(A, B)                     // |shared| / |union|, 0-1
  + 0.15 × sameBrand(A, B)                       // 1 or 0
  + 0.15 × priceProximity(A, B)                  // 1 - min(|pA-pB| / maxRange, 1)
  + 0.10 × ratingProximity(A, B)                 // 1 - |rA-rB| / 4
```

#### 3. trending / popular

| algorithm | formula | pros | cons | verdict |
|-----------|---------|------|------|---------|
| **simple purchase count** | `purchaseCount` | trivial | no recency, stale results | use for "bestsellers" only |
| **exponential time decay** | `Σ e^(-λ × age_in_days)` | surfaces recent trends, tunable via λ | choosing λ is arbitrary, needs timestamp data | **use this** for "trending" |
| **time-windowed count** | purchases in last N days | simple, clear semantics | hard cutoff at window boundary | simpler alternative, but decay is smoother |
| **Bayesian average** | `(C×m + Σratings) / (C + n)` | handles few-review products well | only for ratings, not purchases | **use this** for "top rated" |
| **Wilson score** | lower bound of Wilson confidence interval | most statistically sound for ratings | wide intervals with few reviews | overkill at this scale |

**decision:**
- "bestsellers" → simple `purchaseCount` desc (already on product doc)
- "trending" → exponential decay with λ=0.05 (half-life ~14 days), recomputed daily via cron
- "top rated" → Bayesian average with C=5, m=global_mean_rating

#### 4. recommended for you (personalized)

| approach | data requirements | quality at our scale | verdict |
|----------|-------------------|---------------------|---------|
| **user-based collaborative filtering** | needs significant user overlap, poor with 50 users | poor — matrix is ~0.5% dense | skip |
| **item-based collaborative filtering** | needs item purchase overlap, handles sparsity better | marginal — essentially the same as co-occurrence (which we already have) | redundant with co-occurrence |
| **matrix factorization (SVD/ALS)** | needs dense-enough user-item matrix | poor — adds complexity without quality gain at 50 users | skip until 500+ users |
| **switching hybrid** | varies by user state | good — uses the best signal available for each user | **use this** |

**decision: switching hybrid based on user purchase count.**

```
if user has 3+ purchases:
  → co-occurrence of purchased items + content similarity to favorites + category preference

if user has 1-2 purchases:
  → content-based similar to purchased items + category trending

if new user (0 purchases but has favorites):
  → content-based similar to favorited items + trending

if anonymous / zero activity:
  → global trending + top rated per category
```

**at scale (50K+ products):** can't score all products per request. two-stage approach:
1. **candidate generation** (fast, index-driven): co-occurrence top-10 per recent purchase (~200), vector similarity (~50), category trending (~60) → merge + dedupe ~200-300 candidates
2. **scoring + ranking**: RRF across signals, MMR diversity, return top 10-20

see `docs/scale-considerations.md` §3 for full two-stage architecture.

---

## data flow: what reads what

```mermaid
graph TD
    subgraph "data sources"
        ORDERS[orders table]
        PRODUCTS[products table]
        FAVORITES[favorites table]
        CART[cartItems table]
        PREFS[userPreferences table]
    end

    subgraph "precomputed (cron)"
        COOC[productCoOccurrences<br/>Jaccard scores]
        TREND[products.trendingScore<br/>exponential decay]
    end

    subgraph "on-the-fly (query time)"
        CONTENT[content-based similarity<br/>weighted attribute scoring]
        PERSONAL[personalized "for you"<br/>switching hybrid]
        FORCART[cart recommendations<br/>aggregated co-occurrences]
    end

    subgraph "recommendation slots"
        FBT["frequently bought together<br/>(product detail page)"]
        SIMILAR["similar products<br/>(product detail page)"]
        TRENDING["trending<br/>(homepage)"]
        FORYOU["recommended for you<br/>(homepage)"]
        CARTREK["you might also like<br/>(cart page)"]
    end

    ORDERS -->|all orders, pairwise| COOC
    ORDERS -->|recent orders, decay| TREND
    PRODUCTS -->|attributes| CONTENT

    COOC --> FBT
    CONTENT --> SIMILAR
    TREND --> TRENDING

    COOC --> PERSONAL
    CONTENT --> PERSONAL
    PREFS --> PERSONAL
    FAVORITES --> PERSONAL
    TREND --> PERSONAL
    PERSONAL --> FORYOU

    COOC --> FORCART
    CART --> FORCART
    FORCART --> CARTREK
```

---

## cold-start strategy

### new users (no purchase history)

note: cart, favorites, orders, and reviews require Clerk authentication. anonymous users only get global recommendations. see `docs/data-layer-plan.md` § auth & session model.

| signal | available when | action |
|--------|---------------|--------|
| nothing (anonymous) | immediately | show global trending + top rated per category |
| category browsing (anonymous) | after first page view | weight trending items from visited categories (client-side only, no backend needed) |
| favorites | after sign-in + first favorite | content-based similar to favorited items |
| cart adds | after sign-in + first add-to-cart | treat like a purchase for co-occurrence lookup |
| first purchase | after first order | full recommendation pipeline kicks in |

**progressive enhancement:** start with trending, layer in signals as they appear. each signal upgrades quality incrementally. the sign-in prompt at "add to cart" is the natural boundary where anonymous users become authenticated users with personalization.

### new products (no purchase data)

content-based similarity handles this automatically — a new product immediately appears as "similar" to products with matching category/brand/tags. no special handling needed.

optionally: add a time-decaying "new arrival" boost for products less than 14 days old.

---

## precomputation vs on-the-fly

| data | strategy (small scale) | strategy (large scale) | notes |
|------|----------------------|----------------------|-------|
| co-occurrence matrix | **precomputed** — single action reads all orders, writes to `productCoOccurrences` | **batched pipeline** — multiple chained actions, top-N per product | see scale-considerations §2 |
| trending scores | **precomputed** — daily cron | same | unchanged at scale |
| content-based similarity | **on-the-fly** — score all products in category | **precomputed table** — batch action uses `vectorSearch()` to find top-N per product, stores in `productSimilarity` table | Convex vector search is action-only, can't be used in reactive queries directly. see scale-considerations §1 |
| discount % sort | **in-memory** — collect + sort | **precomputed field** — `discountPercent` + index | see scale-considerations §4 |
| personalized "for you" | **on-the-fly** — score ~30 candidates | **two-stage** — index-driven candidate retrieval (~300) → score subset | see scale-considerations §3 |
| cart recommendations | **on-the-fly** — aggregate co-occurrences | same (cart is small, co-occurrences are precomputed) | unchanged at scale |

### precomputation storage cost

| table | small scale (~200 products) | large scale (~10K products) |
|-------|---------------------------|---------------------------|
| productCoOccurrences (Jaccard pairs) | ~3,000 rows | ~200,000 (top-20 per product) |
| trendingScore on products | 200 (inline field) | 10,000 (inline field) |
| embedding on products | — | 10,000 × ~1KB each |
| coOccurrenceAggregation (temp, during batch) | — | up to ~500K during recomputation |

all well within Convex's capacity. the main concern isn't storage — it's query scan width.

### recomputation frequency

| data | frequency | trigger |
|------|-----------|---------|
| co-occurrence matrix | daily | Convex cron job |
| trending scores | daily | same cron job |
| Bayesian avg rating | on review add/remove | already handled by `reviews._updateProductRating()` |

---

## scoring & ranking

### normalizing scores to 0-1

all algorithms produce scores in different ranges. normalize before combining:

| signal | raw range | normalization |
|--------|-----------|---------------|
| Jaccard co-occurrence | 0-1 | already normalized |
| content-based similarity | 0-1 | already normalized (weights sum to 1) |
| trending score | 0-∞ | min-max: `(score - min) / (max - min)` |
| Bayesian avg rating | 1-5 | `(score - 1) / 4` → 0-1 |
| purchase count | 0-∞ | min-max within result set |

### combining signals: Reciprocal Rank Fusion (RRF)

for merging ranked lists from different algorithms without needing to normalize raw scores:

```
RRF_score(item) = Σ weight_i / (k + rank_in_list_i)
```

where k=60 (standard constant from the 2009 Cormack paper).

**advantage:** ignores raw scores entirely, only uses rank positions. no normalization headaches. items ranked highly by multiple signals bubble to the top.

**weights for our signals:**

| signal | weight | rationale |
|--------|--------|-----------|
| purchase co-occurrence | 1.0 | highest intent signal |
| content similarity | 0.5 | good baseline, no behavioral data needed |
| trending/popularity | 0.3 | weak personalization, but safe |

### diversity: MMR (Maximal Marginal Relevance)

prevents recommending 5 products from the same brand:

```
next_item = argmax[ λ × relevance(item) - (1-λ) × max_similarity(item, already_selected) ]
```

- λ=0.7 (relevance-leaning, some diversity)
- similarity = 1.0 if same brand, 0.5 if same category, 0.0 otherwise
- greedy: pick best item, then pick next best with diversity penalty
- ~20 lines of code, no library needed

---

## data requirements — when each algorithm becomes useful

| algorithm | minimum data | our seeded data | status |
|-----------|-------------|-----------------|--------|
| content-based similarity | 0 orders (just product attributes) | 200 products with category, brand, tags | ready from day zero |
| co-occurrence (Jaccard) | ~200 orders for popular items, ~500 for decent catalog coverage | 500 seeded orders | ready |
| trending (exponential decay) | ~50 recent orders | 500 orders spanning 3 months | ready |
| Bayesian avg rating | ~5 reviews per product for meaningful scores | 600 seeded reviews (~3 per product) | ready |
| item-item collaborative filtering | ~500 orders, 100+ users | 500 orders, 50 users | marginal — redundant with co-occurrence |
| user-based collaborative filtering | ~300+ users with 3+ purchases each | 50 users | not enough data, skip |
| matrix factorization | ~500+ users | 50 users | not enough data, skip |

**key insight:** with our seeded data, the first 4 algorithms are all viable. collaborative filtering beyond basic co-occurrence isn't worth it until we have 10x more users.

---

## npm packages (pure JS, Convex-safe)

| package | what | native deps | worth using? |
|---------|------|-------------|-------------|
| `node-fpgrowth` | FPGrowth frequent itemset mining | none | maybe — if we want more sophisticated association rules beyond simple pairwise co-occurrence |
| `collaborative-filter` | item-item CF with Jaccard | only `mathjs` | no — we're implementing Jaccard ourselves, it's trivial |
| `simple-statistics` | Bayesian average, Wilson score | none | maybe — saves 10 lines of boilerplate |
| `ml-distance` | Jaccard, cosine, euclidean distances | none | maybe — saves 5 lines per distance function |

**recommendation: skip all libraries.** the algorithms are 10-30 lines each in pure TS. zero dependencies = zero risk of breaking in Convex runtime.

---

## recommendation slots — what shows where

| slot | page | algorithm | data source | computation |
|------|------|-----------|-------------|-------------|
| "frequently bought together" | product detail | Jaccard co-occurrence | `productCoOccurrences` table | precomputed, read top 4 by score |
| "similar products" | product detail | weighted attribute scoring (small) / precomputed similarity table (at scale) | `products` table / `productSimilarity` table | on-the-fly at small scale, precomputed via batch action at scale |
| "trending" | homepage | exponential time decay | `products.trendingScore` field | precomputed daily |
| "bestsellers" | homepage / category | simple purchase count | `products.purchaseCount` field | already stored |
| "top rated" | homepage / category | Bayesian average | `products.rating` + `products.reviewCount` | on-the-fly, cheap math |
| "recommended for you" | homepage | switching hybrid (co-occ + content + prefs) | multiple tables | on-the-fly |
| "you might also like" | cart page | aggregated co-occurrences of cart items | `productCoOccurrences` + `cartItems` | on-the-fly |

---

## implementation order

| priority | what | why first |
|----------|------|-----------|
| 1 | **content-based similarity** | works from day zero, no behavioral data needed, serves as cold-start fallback for everything else |
| 2 | **co-occurrence precomputation + cron** | highest value feature ("frequently bought together"), needs the seed data pipeline |
| 3 | **trending + Bayesian rating** | cheap to add once cron infrastructure exists, fills homepage slots |
| 4 | **personalized "for you" hybrid** | requires 1-3 to be working, combines their outputs |
| 5 | **cart recommendations** | requires co-occurrence + cart data, lowest priority because fewer users reach the cart |
| 6 | **diversity reranking (MMR)** | polish — apply across all recommendation slots |

---

## Convex function map for recommendations

```
packages/backend/convex/recommendations.ts

queries:
  frequentlyBoughtTogether(productId) → reads productCoOccurrences, joins product data
  similarProducts(productId)          → reads current product + all in same category, scores on-the-fly
  trending(category?)                 → reads products sorted by trendingScore or purchaseCount
  topRated(category?)                 → reads products, computes Bayesian avg, sorts
  forYou()                            → switching hybrid: reads user prefs/orders/favorites, combines signals
  forCart()                            → reads cart items, aggregates co-occurrences, deduplicates

internal mutations:
  _recomputeCoOccurrences()           → reads all orders, computes Jaccard, writes productCoOccurrences
  _recomputeTrendingScores()          → reads recent orders, computes decay scores, patches products

cron (in convex/crons.ts):
  daily → _recomputeCoOccurrences + _recomputeTrendingScores
```

---

## evaluation (offline, no A/B test needed)

once the store has real interactions (or with seeded data), measure:

| metric | what it tells you | target |
|--------|-------------------|--------|
| **Hit Rate@5** | % of users who got at least 1 relevant rec in top 5 | > 0.2 |
| **Catalog Coverage** | % of products that appear in at least one recommendation | > 50% |
| **Diversity** | avg number of unique categories in a top-5 list | > 2 |
| **Popularity Bias** | are we just recommending bestsellers? | Gini < 0.5 |

method: take last 20% of orders as holdout, hide one item per order, check if recommender surfaces it.
