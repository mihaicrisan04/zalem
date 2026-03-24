# phase 3: static recommendation engine — dev journal

## overview

implementing classical recommendation algorithms to replace placeholder data in all recommendation slots. no AI — pure data-driven algorithms that will later serve as candidate generators for the LLM layer.

---

## 2026-03-24 — initial implementation

### what was built

**new files:**

- `packages/backend/convex/recommendationHelpers.ts` — pure TS algorithm functions (no Convex imports, independently testable):
  - `jaccard()` — set intersection/union for tags, useCases, goodFor
  - `contentSimilarity()` — weighted 7-factor scoring (category, tags, useCases, goodFor, brand, price, rating)
  - `buildCoOccurrenceMatrix()` — Jaccard similarity from order co-purchases with min support filter
  - `computeTrendingScores()` — exponential decay (λ=0.05, half-life ~14 days)
  - `derivePreferences()` — extract user preferences from order history (top categories, brands, price range, tags)
  - `applyMMR()` — Maximal Marginal Relevance for diversity (λ=0.7, penalizes same brand/category)

- `packages/backend/convex/recommendations.ts` — Convex queries + internal functions:
  - public queries: `similarProducts`, `frequentlyBoughtTogether`, `trending`, `forYou`, `forCart`
  - internal actions: `recomputeCoOccurrences`, `recomputeTrendingScores`, `deriveAllUserPreferences`
  - internal mutations: `clearCoOccurrences`, `insertCoOccurrencesBatch`, `patchTrendingScoresBatch`, `deriveUserPreferencesForUser`
  - public action: `initialize` (run once after seeding to populate all precomputed data)

- `packages/backend/convex/crons.ts` — daily cron jobs at 3:00 and 3:15 AM UTC

### architecture decisions

1. **helper functions separated from Convex functions** — `recommendationHelpers.ts` has zero Convex imports. this means the algorithms are testable without the Convex runtime and reusable from any Convex function type (query, mutation, action).

2. **actions for orchestration, mutations for writes** — the recomputation functions are `internalAction`s that read data via `runQuery`, compute in memory, and write via `runMutation`. this follows Convex best practices (actions can't write directly).

3. **batched writes** — co-occurrence pairs inserted in batches of 200, trending scores patched in batches of 100. at ~200 products and ~500 orders this is overkill, but it's ready for scale.

4. **no `trendingScore` index** — at ~200 products, reading all and sorting in memory is fine. adding a compound index with an optional field causes sorting issues (undefined sorts before numbers in Convex).

5. **MMR applied selectively** — `similarProducts` and `forYou` use MMR for diversity. `frequentlyBoughtTogether` and `trending` don't — purchase patterns and popularity should be shown as-is.

6. **switching hybrid for personalization** — four tiers based on user state:
   - 3+ purchases → co-occurrence + category preference boost
   - 1-2 purchases → content-similar to purchased + category trending
   - favorites only → similar to favorited + trending
   - anonymous → global trending fallback

### UI wiring

- home page: "Trending" → `api.recommendations.trending`, "Recommended for you" → `api.recommendations.forYou`
- product detail: added "Frequently bought together" row (from co-occurrences), "Similar products" → `api.recommendations.similarProducts`
- cart page: added "You might also like" row → `api.recommendations.forCart`
- checkout: `orders.checkout` now schedules `deriveUserPreferencesForUser` after order creation

### known limitations

- `useCases` and `goodFor` fields are not yet populated on products (seed enrichment with LLM is deferred)
- content similarity falls back gracefully — those Jaccard terms just contribute 0 when arrays are empty
- type errors on `internal.recommendations.*` until `convex dev` regenerates types (expected, not a bug)
- co-occurrence data only exists after running `recommendations.initialize` — not auto-populated by seed

### how to initialize recommendation data

after seeding the database:

```
cd packages/backend && bunx convex run recommendations:initialize
```

or from the Convex dashboard → Functions → `recommendations:initialize` → Run

---
