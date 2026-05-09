# eval datasets

each file in this directory is a versioned, hand-curated YAML dataset. one row
= one test case; Promptfoo runs every row against every provider in the sweep.

## versioning rule

**never edit a dataset in place after results have been published.** changing a
row invalidates all prior runs against it. instead:

1. copy `shopping-v1.yaml` to `shopping-v2.yaml`
2. make changes there
3. update `promptfooconfig.yaml` to point at the new filename
4. note the bump in `docs/eval-system-plan.md`

results files in `../../results/` carry the dataset version in their filename
so historical comparisons stay honest.

## adding a row

every row needs:

- `description` — short label used in the dashboard
- `vars.question` — the actual user message
- `vars.expectedTools` — tools that **must** be called (drives `tool-call-f1`)
- `vars.maxAcceptableToolCalls` — budget cap for `toolCallEfficiency`
- `vars.category` — one of: simple_qa, product_validation, comparison,
  recommendation, review_summary, multi_turn, edge_case

optional but recommended:

- `vars.productId` — simulates "user is viewing this product" context
- `vars.recentlyViewedIds` — recently-viewed list passed to the advisor
- `vars.expectedProductIds` — IDs the answer is expected to reference
- `vars.checkReviewFidelity: true` — opts into the embedding-based theme check
- per-row `assert:` block — additional row-specific assertions

## v1 distribution (actual)

| category           | count  | notes                                                |
| ------------------ | ------ | ---------------------------------------------------- |
| simple_qa          | 6      |                                                      |
| product_validation | 5      |                                                      |
| comparison         | 5      |                                                      |
| recommendation     | 5      |                                                      |
| review_summary     | 3      |                                                      |
| multi_turn         | 0      | deferred to v2 — needs Promptfoo conversation wiring |
| edge_case          | 1      |                                                      |
| **total**          | **25** |                                                      |

the spec doc targets 4 simple_qa + 4 product_validation + 3 multi_turn = 11.
v1 drops multi_turn (3 rows) and reallocates them to simple_qa (+2) and
product_validation (+1) so the row count stays 25 without depending on
infrastructure we haven't built yet. when v2 lands, restore the spec
distribution.

## product IDs

every `productId` must exist in the seeded dev DB. dump fresh IDs with:

```bash
cd packages/backend && bunx convex run products:listByCategory \
  '{"category":"Smartphones","sort":"popular","paginationOpts":{"cursor":null,"numItems":10}}' \
  | jq -c '.page[] | {id: ._id, title, brand, price, rating}'
```

repeat for "Laptops", "Tablets", "Beauty", etc. shopping-v1 was seeded from a
snapshot taken on 2026-05-09 — if the dev DB is reseeded the IDs will change
and the dataset will need a refresh (bump to shopping-v2.yaml).
