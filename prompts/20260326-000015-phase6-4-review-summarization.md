read the current state of this app read the docs and what phase we are at. i remember we left off at phase 6 we started working at it. research and tell me the current state and what is left to be done

---

reviewed full project state: phases 1-5 done, phase 6 at ~65% (6.1-6.3 done, 6.4-6.6 not started). created detailed implementation plan for 6.4 (review summarization) with gap analysis identifying 9 flaws. biggest blocker: faker-generated reviews are meaningless lorem text — can't test theme extraction against garbage data.

built AI review generation system:

- `generateReviews.ts` — calls Gemini Flash-Lite via OpenRouter to generate 15-50 realistic reviews per product with 4 sentiment profiles (loved/polarizing/mediocre/few)
- migrated from `@ai-sdk/google` to `@openrouter/ai-sdk-provider` to solve Google free-tier rate limiting
- generated 4836 reviews across ~194 products with recurring themes, conflicts, and realistic writing styles

built review summarization pipeline (6.4):

- `reviewSummaries` table with structured themes, conflicts, bestFor, validation metadata
- `embedding` field on reviews + 3072-dim vector index for semantic validation
- `reviewSummaries.generateForProduct` action: embed reviews → Flash-Lite structured extraction → quote verification → embedding-backed theme validation → cached summary
- batch orchestrator with staleness detection + daily cron at 4 AM UTC
- hybrid approach: full-text LLM summarization (works at current scale) + embeddings for validation and future scaling
