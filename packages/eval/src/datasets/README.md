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

## category targets for v1

| category           | count  |
| ------------------ | ------ |
| simple_qa          | 4      |
| product_validation | 4      |
| comparison         | 5      |
| recommendation     | 5      |
| review_summary     | 3      |
| multi_turn         | 3      |
| edge_case          | 1      |
| **total**          | **25** |

## product IDs

every `productId` must exist in the seeded dev DB. dump real IDs with:

```bash
bun --filter @zalem/backend convex run products:listAll | jq -r '.[].id' | head
```

then paste them into the `REPLACE_WITH_REAL_PRODUCT_ID` placeholders.
