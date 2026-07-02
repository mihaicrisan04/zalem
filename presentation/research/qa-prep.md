# Defense Q&A — defend every word + committee questions

> Built from a deep pass over the **actual code** (+ a web check on Rufus). Use alongside `script.md` (per-slide speaker notes) and `defense-plan.md`. Exact formulas/file:line are in `code-mechanics.md`.

## ⚠️ Known thesis/code discrepancies to own (memorize — committees ask from the code)
- **Tools count:** there are **5** advisor tools — 4 read the catalog directly (`getProductDetails`, `searchProducts`, `getCartContents`, `getReviewsSummary`) + `getRecommendations` which bridges to the classical engine. The slide diagram says "4 read-only tools" + the `getRecommendations` bridge separately; if asked a number, say **five** (all read-only). Consider making the slide/notes consistent.
- **RRF:** the thesis says `forYou` uses "Reciprocal Rank Fusion, k=60". The code uses plain **additive score accumulation** (no RRF anywhere). Own it; offer to correct the thesis text.
- **LLM judges:** thesis says **5** rubrics; code has **4** (tool-appropriateness is checked programmatically by `expectedToolCoverage`, not by an LLM judge).
- **Dataset:** thesis says **7** categories; code has **6** ("multi-turn" deferred to v2). **34 test cases** = 25 rows with 9 duplicated for tool-variants.
- **"3-stage validation":** `validationPassed` is a stored **flag/telemetry, not a hard pre-send block**. So it's *measured & flagged*, not enforced interception. A blocking re-generation loop is future work.
- **Rufus stats provenance:** the **28%** price-error figure is sometimes attributed to ChatGPT Shopping; the **32%/83%** come from pooled 2024 AI-assistant trade reporting (ConsumerAffairs / Marketplace Pulse), not Rufus-only peer-reviewed studies. Frame them as a *documented design target*, not a precise live benchmark.
- **Rufus in 2026:** per recent reporting it was rebranded around "Alexa for Shopping" (≈May 2026), 300M+ users, COSMO KG + Nova grounding, a "Help Me Decide" feature — but **no published factual-accuracy re-measurement since 2024**. (Verify the rebrand detail yourself before stating it.)
- **Tool calls at runtime:** in the canonical sweep the agent rarely makes live tool round-trips because `assembleContext` already pre-feeds product data — grounding comes mostly from **DB-fed context + the rules**, with tools as a fallback/expansion channel.

---

## Part 0 — Defending the abstract (the highest-traffic paragraph)

> The abstract is the one paragraph every examiner reads, and the most likely source of the opening question. It makes **4 numeric claims + 3 architectural claims**. Three are fully code-backed — defend them flatly. Two **oversell the shipped build** and need the honest framings below. Verified against the code 2026-07-01.

**The abstract, as printed (key sentences):**
> *"…a hybrid LLM-augmented shopping recommender with grounded output. …Amazon's Rufus is credited with roughly \$12 billion of incremental revenue in 2025, yet independent investigations report 32% recommendation accuracy, 28% price hallucination, 83% self-serving recommendations, and routine fabrication of review themes. …these failures are not built into the AI-shopping problem but follow from specific integration choices.*
> *The prototype combines three structural decisions. First, a reactive-first interaction model: behavior signals prepare context, but the user always starts an LLM call. Second, a two-stage recommendation pipeline: classical algorithms generate candidates, and the LLM only re-ranks and explains. Third, a hydration-over-generation principle: the LLM emits product identifiers, the client renders live catalog data, and an output-validation layer verifies every cited identifier, strips factual claims from free text, and checks review themes against the source corpus.*
> *…An ungrounded baseline with the same model and no tool access… makes twice as many specific claims, two thirds of them fail the database check, and the LLM judges still score it higher…"*

### Claim map — defend vs. frame

| Abstract claim | Status | Stance in one line |
|---|---|---|
| reactive-first, user always starts the call | ✅ code-backed | defend flatly |
| eval harness · 8-config sweep · tradeoff curves · composite | ✅ code-backed | defend flatly |
| ablation: 2× claims, ⅔ fail DB, judges still prefer it | ✅ code-backed | **lead with this — your strongest evidence** |
| "two-stage pipeline: classical generates, LLM re-ranks" | ⚠️ oversells | two independent lanes + one optional bridge; LLM **selects & explains**, no numeric re-rank |
| "the client renders live catalog data" (hydration) | ⚠️ aspirational | ID-first output is real; **in-chat card rendering is not shipped** — chat is text/markdown |
| "output-validation layer… strips factual claims from free text" | ⚠️ oversells | grounding is enforced at the **tool + pipeline boundaries** and **measured** in the harness; there is **no runtime per-answer strip filter** |
| Rufus 2024–25 figures (32/28/83/\$12B) | ⚠️ stale + soft-sourced | a **design target**, not a live benchmark; decouple your thesis from Amazon's changelog |

### Q0.1 — "Summarize your contribution" / "Walk us through your abstract."
Very common opener. Use the 90-second version in `script.md` → **Opening move**. It leads with the ablation, states the three design decisions pre-phrased ("select-and-explain", "ID-first", "validated at the boundaries and measured"), so the three landmines are defused before anyone can ask.

### Q0.2 — "Two-stage pipeline: classical generates candidates and the LLM re-ranks. Show me where the LLM re-ranks."
The one-pipeline phrasing in the abstract is a compression. In the code it's **two independent paths around one catalog**: the store rails (`recommendations.ts`) are pure classical + MMR and **never call the LLM**; the advisor reads the catalog directly and, when it needs candidates, calls the classical engine through the single optional `getRecommendations` tool, then **selects among and explains** them. There is **no numeric LLM re-rank** — if they open `recommendations.ts` they'll see additive scoring + MMR, no RRF. *Say:* "'Classical generates, LLM re-ranks' describes the advisor path; I'd phrase the LLM step as select-and-explain rather than a numeric re-rank, and the store's own rails are that same classical engine standalone." Don't defend an RRF/LLM-rerank that isn't there. (See also discrepancy list + Part 4 "RRF k=60".)

### Q0.3 — "The client renders live catalog data — show me the chat rendering product cards."
The advisor output is **ID-first by design** precisely so the client *can* hydrate live data instead of trusting generated prose — that principle is real and is why the model emits identifiers. In the current build the live-data rendering lives on the **store surfaces**; the advisor returns grounded **text/markdown**, and wiring identifiers into inline chat cards is the natural next step (and the reason the output is ID-first). *Frame the gap as forward-looking, not a miss.* Do not claim the chat renders cards today — it doesn't.

### Q0.4 — "Your abstract says an output-validation layer strips factual claims from free text. Where is that code?"
Grounding is enforced at **three points**, not as one post-response filter: (1) the advisor tools can only ever return **real catalog rows** — the model has no fact-authoring tool; (2) the **review-summary pipeline validates every theme** against the source reviews (exact-quote check + embedding cosine ≥0.35, ≥2 matching reviews) **before anything is stored**; (3) the **evaluation harness** verifies identifier validity, price/rating factuality, and theme fidelity on every run. *Say:* "The abstract describes that as a validation layer; it's enforced at the tool and pipeline boundaries and measured in the harness, rather than a single runtime regex that strips claims from each answer." **Do not** claim a live per-answer strip filter — `requestAdvice` just streams the model output; there's no such code, and "show me" would be a trap. (Ties to the `validationPassed` = flag-not-gate discrepancy.)

### Q0.5 — "It's mid-2026; those 2024 Rufus numbers are stale — Rufus has surely improved."
Three moves: **(1)** they're a *design target*, not a live benchmark — I use the documented failures to define what my architecture must avoid; my contribution is my design and my own evaluation, which stand regardless of Rufus today. **(2)** the failure mode is inherent to *ungrounded* integration, not one Rufus build — my ablation reproduces it from scratch (2× claims, ⅔ fail the DB) with the same model. **(3)** no one has published a factual-accuracy re-measurement since 2024; Amazon reports relevance/revenue gains, but relevance is orthogonal to factual grounding, and "Rufus is fixed" is itself unsupported. My ablation is the only controlled evidence in the room. (Full version: Part 2(d).)

### Q0.6 — "\$12B in revenue but you call it a failure — reconcile that."
That tension *is* the motivation: commercial success and factual trustworthiness are separate axes. Huge revenue with 83% self-serving recommendations is a trust problem, not a business one — and trust is exactly what grounding targets. (Quotable; also on slide 4 notes.)

### Q0.7 — "Your central claim is that failures 'follow from integration choices, not the problem.' How do you *prove* that rather than assert it?"
The ablation is the proof: hold the model, catalog, and few-shots fixed and toggle **only** grounding (tools on/off). Grounding off → the failures reappear (factuality 0.76→0.53, DB-fail 48%→67%, 2× claims). That isolation — same model, one variable changed — is what turns the assertion into evidence for *integration* as the cause. This is the intellectual core; rehearse until automatic.

---

## Part 1 — Defend every word (slide by slide)

### S1 — Title slide

**Q: What does "Architectural Proposal" mean — isn't a thesis supposed to build something, not propose?**
I built a working prototype (Zalem) end-to-end, but my framing is deliberately modest: the contribution is the *architecture* — how a classical recommender, an LLM advisor, and a live catalog are wired together so the model never sources a fact. I call it a proposal because I don't claim it's the only or optimal design, and I haven't validated it with real users yet. The word keeps me honest about scope: I'm contributing a design pattern plus an evaluation of it, not a deployed product.

**Q: "Hybrid" in what sense?**
Two senses. First, the system combines a deterministic classical recommendation engine (similarity, co-occurrence, trending, for-you) with a generative LLM advisor. Second, the "for-you" rail is itself a *switching hybrid* recommender in the classical sense — it switches between co-occurrence, category, and favourites strategies depending on how much signal a user has.

**Q: "LLM-Augmented" — augmenting what?**
The store. The classical engine and catalog are the base e-commerce experience; the LLM advisor is an augmentation layered on top that explains, summarizes, and compares — it doesn't replace the recommender, it sits beside it and is bridged through one tool (`getRecommendations`).

**Q: "Grounded Output" — define grounded.**
Grounded means every concrete fact in the advisor's answer (price, rating, spec, review theme) traces to a read from the live catalog database, not to the model's parametric memory. I enforce it structurally (the model is told to source facts only from tools/context) and I measure it (groundedness and factuality scorers in the eval). It is the opposite of the Rufus failure where prices and reviews are invented.

**Q: "Prototype: Zalem — a working e-commerce store" — is it actually working?**
Yes. It's a Next.js 16 storefront on Convex with home/product/cart pages, real classical recommendation rails, a streaming AI advisor chat, a reviews→summary pipeline, and behavior tracking. "Prototype" signals it's seeded with ~200 products and synthetic reviews, not a production catalog.

### S2 — Contents

**Q: "classical recommenders" — which ones do you cover?**
Content-based similarity, item co-occurrence (frequently-bought-together), time-decayed trending, and a switching-hybrid personalization rail. These are the four families I implemented and the ones I survey in background.

**Q: "the Rufus case" — why a whole sub-section on one product?**
Rufus is the largest deployed LLM shopping assistant and the clearest documented example of the exact failure my architecture targets — hallucinated prices, specs and reviews at massive scale. It's my motivating real-world benchmark of *what to avoid*, not a system I benchmark against numerically.

**Q: "grounded generation / two-stage retrieve-and-rerank / evaluation" as foundations — define each.**
Grounded generation is the principle that the model selects/explains over retrieved facts rather than generating them. Two-stage retrieve-and-rerank is the standard IR pattern: cheaply retrieve a candidate set, then apply a more expensive reranker (in my classical engine, retrieve top candidates then MMR-rerank for diversity). Evaluation is my promptfoo-based harness that scores the advisor on groundedness, factuality, and judge rubrics.

**Q: "an 8-configuration sweep" — what is swept?**
Four axes: model id, reasoning effort, step budget (maxSteps), and prompt variant — yielding 8 named configurations I run the full dataset against.

**Q: "the grounding test" — separate from the sweep?**
Yes. It's a controlled ablation: one fixed configuration run with catalog tools removed vs. with them, to isolate the causal effect of grounding.

### S3 — Domain: "Two tools, opposite weaknesses"

**Q: "+ narrow a huge catalog accurately" — accurately how?**
Classical recommenders rank deterministically over structured signals (co-purchase counts, attribute overlap, decayed popularity), so they don't invent items — every recommended product is a real catalog row pulled by ID. That's the "accurate" claim: no fabrication, just ranking.

**Q: "− opaque, never say why" — is that fair? Your similarity score has named weights.**
Fair at the user-facing level. Internally I know the weighted-sum reasoning, but the rail just shows products with no natural-language justification. The point of the slide is that classical engines don't *explain* to the shopper — which is precisely the gap the LLM fills.

**Q: "hallucinate prices, specs, even reviews" — "even reviews" why the emphasis?**
Because fabricating a review theme is more insidious than a wrong price: a user can sanity-check a price, but an invented "buyers love the battery" claim is presented as social proof and is hard to detect. Rufus is documented doing exactly this, and my own ablation reproduces it.

### S4 — Rufus: "The benchmark and its documented failures"

**Q: "32% picks the right product" — source and definition?**
It comes from 2024 trade reporting (ConsumerAffairs / Marketplace Pulse) aggregating AI-shopping-assistant evaluations; "right product" means the assistant's top recommendation matched the user's stated need. I cite it as a 2024 trade figure, and I'm careful that some of these pooled numbers span "AI shopping assistants" generally, not Rufus exclusively — which the footnote flags.

**Q: "28% prices are wrong" — same caveat?**
Yes, and I'll volunteer it: the 28% price-error figure is sometimes attributed to ChatGPT Shopping rather than Rufus specifically in the pooled reporting. I present it as illustrative of the model-class failure, not a precise Rufus-only measurement. My footnote explicitly labels these as trade reports, not peer-reviewed.

**Q: "83% favor its own brand" — meaning?**
In the reported evaluations, in 83% of cases Rufus surfaced or preferred Amazon's own-brand products. It's an own-brand bias / conflict-of-interest signal, relevant because it shows an assistant's incentives can corrupt recommendations independent of hallucination.

**Q: "fabricated review themes" — documented where?**
2024 reporting plus ongoing 2026 Amazon Seller Central threads describing Rufus stating features/compatibility that products don't have, driving returns and negative reviews. It's qualitative evidence, not a controlled study — I say so.

**Q: "300M+ users, ~$12B sales, yet confidently wrong" — reconcile the contradiction.**
That's the whole point of the slide: commercial success and factual reliability are orthogonal. Amazon's reported scale (300M+ users, ~149% YoY MAU growth, ~$12B incremental sales, Rufus shoppers ~60% more likely to purchase) measures engagement and revenue, not factual accuracy. A system can be hugely successful and still hallucinate.

**Q: Footnote "trade reports, not peer-reviewed" — why include numbers you admit are weak?**
Because they're the best public evidence of a real, at-scale failure, and intellectual honesty requires labeling their provenance. My thesis doesn't *depend* on these numbers being precise — they motivate the design; my own controlled ablation provides the rigorous evidence.

### S5 — Approach: "Grounded by construction: hydration over generation"

**Q: "hydration over generation" — define and isn't this just RAG?**
Hydration means the model is handed real catalog records and its job is to *select and phrase* them; generation would mean producing the facts itself. It's RAG-adjacent — retrieval-augmented — but I use "hydration" to stress that even the *selection* set comes from deterministic tools and the model is forbidden from authoring facts, not merely encouraged to cite. (See Part 4 for the full "isn't this just RAG" answer.)

**Q: "it never sources a fact" — can you actually guarantee that?**
I enforce it three ways: the system prompt forbids sourcing facts; all facts are pre-fed via `assembleContext`/tools reading the live DB; and the eval's groundedness/factuality scorers catch violations. I can't *prove* the model never emits an unsourced token, but I measure the rate — factuality 0.76 grounded — and the architecture makes fabrication the exception, not the default.

**Q: "on every request" — literally every request?**
Yes. `assembleContext` in `packages/backend/convex/ai/advisor.ts` is called unconditionally inside the `requestAdvice` handler (defined ~L12–114, invoked ~L133–136, comment "runs on every request"). Nothing is cached across turns; the catalog is re-read each call.

**Q: "single source of truth" — what is it, technically?**
The Convex database — `products`, `reviews`, `cart` tables. Both the classical engine and the advisor read from it; there's no second copy of prices or specs in the prompt or a vector store that could drift. The advisor's facts and the rail's facts come from the same rows.

**Q: "Classical engine (similar · frequently-bought · trending · for-you)" — map each to code.**
`similarProducts` (content similarity + MMR), `frequentlyBoughtTogether` (co-occurrence), `trending` (time decay), `forYou` (switching hybrid) — all in `packages/backend/convex/recommendations.ts` with pure math in `recommendationHelpers.ts`. No LLM call in either file.

**Q: "assembleContext + 4 read-only tools" — name the tools.**
The advisor's tools are `getProductDetails`, `searchProducts`, `getRecommendations`, `getCartContents`, `getReviewsSummary`. The slide says "4 read-only tools" alongside `assembleContext`; in code there are 5 production tools (`../tools`). I should fix the slide to "5" or phrase it as "assembleContext plus read-only tools" — that's a real slide/code discrepancy I'll own.

**Q: "select & explain only" — enforced or just prompted?**
Prompted via the system prompt and structurally reinforced because the tools only return real rows. The model has no tool that writes or invents; the worst it can do is misread context, which the factuality scorer catches.

**Q: "getRecommendations = on-demand bridge" — bridge between what?**
It's the one advisor tool that calls into the classical engine, so when a user asks "what else would go with this," the LLM invokes the deterministic recommender rather than guessing. It's the only coupling point between the two subsystems — the rest of the classical engine renders directly in the store UI.

**Q: "a 3-stage validation" — what are the three stages?**
This maps to my output-validation pipeline. In the eval/runtime the structural checks are: groundedness (cited product IDs exist in the DB), factuality (price/rating literals match the DB snapshot within tolerance), and review-theme fidelity (claimed themes embed-match the real review corpus). Honest caveat: at runtime `validationPassed` is recorded as a flag/telemetry, not a hard pre-send block — see Part 4.

**Q: "user-pulled, reactive" — meaning?**
The advisor never interrupts; the user opens the chat. "Reactive" means it responds to the user's current navigation state (the product they're on, recently viewed, cart) which is assembled fresh per request — it doesn't proactively push messages.

### S6 — Advisor: "The advisor won't make facts up"

**Q: How do you back up "won't make facts up" with a live video?**
The video shows the grounded chat answering with prices/specs that match the catalog. The stronger evidence is the ablation: factuality 0.76 grounded vs 0.53 ungrounded, and 48% vs 67% of specific claims failing the DB. "Won't" is shorthand for "fabricates far less, by construction and by measurement" — I wouldn't claim a hard zero.

### S7 — Context: "Grounded in the live session"

**Q: "live session" — what's in it?**
Per request, `assembleContext` packs: the current product (title, brand, category, price+discount, rating, reviewCount, 200-char description, up to 5 specs), review themes (positives/negatives/conflicts/bestFor), server-side cart contents, and up to 5 recently-viewed products. All from live Convex queries keyed on the request's `productId` and `recentlyViewedIds`.

**Q: Does "live session" mean it reads your tracked behavior (dwell, scroll)?**
No — and I'm explicit about this. `assembleContext` does not query the `behaviorSessions` table. "Session" here means current navigation state (current product, recently viewed, cart), not the dwell/scroll telemetry. That telemetry drives only client-side UI nudges (advisor pulse, suggestion chips), not the LLM prompt.

### S8 — Reviews: "Review summaries verified against the reviews"

**Q: "nightly job" — when and where?**
A Convex cron `"generate review summaries"` at `0 4 * * *` (04:00 UTC) calls `ai.reviewSummariesHelpers.generateAll` (`packages/backend/convex/crons.ts`). It's the only LLM-based cron; the classical crons run at 03:00/03:15.

**Q: "extracts themes with real counts" — how are counts real if an LLM extracts them?**
The LLM proposes candidate themes, but each theme is then embedding-verified against the actual review set, and the displayed count is the number of reviews semantically matching that theme — not a number the LLM made up. The example "battery life 14" means 14 reviews matched the battery theme.

**Q: "surfaces conflicts (who disagrees, how many)" — example?**
The AirPods Pro 2 card shows "divided on fit for small ears: 11 secure vs 5 work loose." The pipeline explicitly extracts conflicting opinion clusters with counts on each side, so the user sees disagreement rather than a smoothed-over consensus.

**Q: "each theme embedding-verified against the review set" — mechanism?**
In eval terms (`reviewThemeFidelity.ts` + `ai.evals.checkThemes`): each theme is embedded and matched against the product's review corpus; a theme is considered grounded only if it has ≥2 semantically matching reviews (`MIN_MATCHING_REVIEWS = 2`). The same embedding-match idea verifies the summary themes, so a theme with no supporting reviews is dropped.

**Q: The AirPods numbers — "38 reviews," "battery life 14" — where from?**
The card is a real generated summary from the seeded review corpus for that product. 38 is the review count; 14/11/8/6 are the matched-review counts per theme; the fit conflict is 11 vs 5. These come from the nightly pipeline output, not hand-picked.

### S9 — Grounding test

**Q: "the same model, the same 34 questions" — why 34 when the dataset is 25 rows?**
The dataset `shopping-v1.yaml` is 25 rows, but 9 rows appear twice with different expected-tool variants, giving 34 test cases per configuration. (There's minor doc drift: the thesis category table lists a 7th "multi-turn" category that the YAML header says was deferred to v2.)

**Q: "the catalog tools removed, answering from memory" — exactly what's removed?**
In `promptfooconfig.ungrounded.yaml` the single provider `oss-120b-ungrounded` is identical to gpt-oss-120b-medium except `disableTools: true` (Agent gets `tools: {}`) and `promptVariant: ungrounded` (system prompt says "you have no tools, answer from your own knowledge"). Few-shots are kept, so tool access is the *only* changed variable.

**Q: "specific price/rating claims 83 vs 162" — what's a claim, who counts them?**
The `factuality` scorer regex-extracts price literals (e.g. `1199 lei`, `$999`) and rating literals (e.g. `4.6/5`, `4.6 stars`). Grounded run made 83 such concrete claims; ungrounded made 162 — it volunteers far more specific numbers because it's confidently inventing a price table.

**Q: "claims that fail the catalog 48% vs 67%" — how is "fail" decided?**
Each extracted claim is checked against the run-time DB snapshot (`metadata.dbSnapshot`, captured pre+post run) with tolerances PRICE ≤ $0.01, RATING ≤ 0.1. A claim "fails" if no snapshot value matches within tolerance. 48.2% of grounded claims failed vs 67.3% ungrounded.

**Q: 48% of grounded claims still fail — isn't that bad?**
It's higher than I'd like and I won't hide it. Much of it is the regex catching numbers that aren't really catalog facts (e.g. a quantity, a model number "S24", a year) and flagging them as unmatched prices. The relative drop (48% vs 67%) and the factuality gap (0.76 vs 0.53) are the load-bearing comparison, not the absolute 48%.

**Q: "factuality 0.76 vs 0.53" — formula?**
`factuality = (totalClaims − fabricated) / totalClaims`, per row, then averaged. Fabricated = claims with no DB match within tolerance. So 0.76 grounded means ~76% of specific numeric claims matched the live DB, vs 53% ungrounded.

**Q: Legend "1199 lei, 4.6/5 checked against the live database" — checked how, against what snapshot?**
Against `dbSnapshot`, a `{id: {price, rating}}` map captured around each run in `runOnce.ts`, so even if prices changed mid-run the claim is checked against the values that were live for that call.

### S10 — Sweep

**Q: "Trust is an integration problem, not a model-capability problem" — justify that thesis from your data.**
The cheapest, weakest model (Gemini Flash-Lite) won the composite, and the biggest model at high reasoning was worst. So reliability came from how the system feeds and constrains the model (grounding, context, tool wiring), not from raw model power. That's the central empirical claim of the sweep.

**Q: "composite 0.807" — what goes into it?**
`composite = 0.30·quality + 0.25·correctness + 0.20·(1−costPenalty) + 0.15·(1−latencyPenalty) + 0.10·efficiency` (`src/reports/thesisExport.ts`). Quality = mean LLM-judge rubrics; correctness = mean programmatic non-efficiency scorers; efficiency = F1/dedupe scorers; cost/latency penalties are min-max normalized across the 8 configs. Flash-Lite scored 0.807.

**Q: "~$0.0003/query" — how computed?**
Token usage from the run × per-model OpenRouter pricing (`MODEL_PRICING`), averaged per query. Flash-Lite is the cheapest model in the sweep, hence it maxes the cost-penalty term.

**Q: "p95 4.2s" — p95 of what, measured where?**
95th-percentile end-to-end advisor latency across that config's 34 calls, computed in `thesisExport.ts` from per-call timings captured in `runOnce.ts`. (An earlier credit-limited run showed p95 4934ms; the refreshed canonical number is 4.2s.)

**Q: "more reasoning was worse (big model at high reasoning worst 0.492, slowest 12.1s p95)" — why worse?**
High reasoning effort made gpt-oss-120b burn its step budget on tool-calling loops, sometimes emitting no final answer (`hasFinalAnswer` catches this), and it roughly doubled cost and latency (p95 12.1s) — all of which tank the composite. More deliberation didn't buy correctness because the facts were already pre-fed; it just added failure surface and latency.

**Q: "groundedness ≥ 0.89 across all 8" — if everything is grounded, what does the metric prove?**
It proves the *architecture* holds across model choices — no config fabricates many product IDs because real IDs are pre-fed in context. It's a saturation result: groundedness is a property of the system, not the model. The discriminating signal between configs is quality/cost/latency, which is exactly the "integration not capability" thesis. (Caveat in Part 4 about it being near-1.0.)

### S11 — Conclusions

**Q: "an integration architecture + an honest evaluation against documented production failures" — restate the contribution precisely.**
My contribution is (1) a design that grounds an LLM advisor by hydration over a single-source-of-truth catalog and bridges it to a classical engine, and (2) an evaluation harness that measures grounding causally (ablation) and across configs (sweep), benchmarked against the documented Rufus failure modes rather than a model leaderboard.

**Q: "grounding is structural and measured" — both words justified?**
Structural: facts come only from DB reads via `assembleContext`/tools, by construction. Measured: groundedness and factuality scorers quantify it, and the ablation shows removing grounding degrades factuality 0.76→0.53. Both halves are backed by code.

**Q: "no user study" — why is that a limit you list first?**
Because helpfulness/trust ultimately need humans; my LLM judges are a proxy and even *preferred the fabricator* in the ablation. So I flag upfront that I have no human-subjects evidence — it's the most important caveat and the first next step.

**Q: "not tested against a standard product-search baseline" — meaning?**
I compare grounded vs ungrounded *versions of my own system*, not against, say, BM25 product search or a published recommender benchmark. So I can claim grounding helps my system; I can't claim my system beats an external baseline.

**Q: "~200-product seeded catalog" — does small scale undercut the results?**
It limits external validity (co-occurrence and trending are sparse at 200 products with synthetic orders), but the grounding mechanism is scale-independent — fabrication is a model property that a small catalog actually makes *harder* to hide, not easier. I list it honestly as a limit.

**Q: "fine-tuning a smaller model" — fine-tune on what, for what?**
On traces from my own harness — (question, assembled context, grounded answer) tuples that pass the validators — to teach a small model the select-and-explain behaviour and tool-use discipline so I could cut cost/latency further while keeping groundedness. It's future work, not done.

### S12 — Thank you

**Q: Anything to defend?**
No claims here.

---

## Part 2 — Deep dives the committee will probe

### (a) The classical engine & algorithms

**Q: Where does the classical engine live and does it ever call the LLM?**
Two files: `packages/backend/convex/recommendationHelpers.ts` (pure deterministic math, no Convex) and `packages/backend/convex/recommendations.ts` (Convex query/action wrappers + crons). There is no `ctx.runAction`, no `ai.*` import, and no model call anywhere in either file — every rail is DB reads plus arithmetic.

**Q: How does content similarity work — is it cosine over embeddings?**
No, it's a weighted sum of 7 attribute signals, `contentSimilarity()` at `recommendationHelpers.ts:53-63`:
`0.25·(category==) + 0.20·jaccard(tags) + 0.15·jaccard(useCases) + 0.10·jaccard(goodFor) + 0.10·(brand==) + 0.10·priceProximity + 0.10·ratingProximity`, weights summing to 1.0.
Sub-measures: `jaccard = |A∩B|/|A∪B|` (0 if both empty); `priceProximity = 1 − min(|a−b|/maxRange, 1)` where maxRange = max price among same-category candidates; `ratingProximity = 1 − |a−b|/4`. `rankBySimilarity()` excludes the target, scores all candidates, sorts desc, takes top `limit`, then MMR-reranks.

**Q: Why a hand-weighted sum instead of learned embeddings?**
It's transparent, deterministic, needs no training data, and is debuggable for a 200-product catalog — I can explain exactly why two products are "similar." Embeddings would be a reasonable upgrade at scale, but here the weighted sum is honest about what signal each attribute contributes and avoids a black box.

**Q: How does frequently-bought-together work — association rules?**
It's order-level Jaccard co-occurrence, `buildCoOccurrenceMatrix(orders, minSupport)` at `recommendationHelpers.ts:86-131`:
`score(a,b) = pairCount(a,b) / (orderCount(a) + orderCount(b) − pairCount(a,b))`.
Products are deduped per order (`:96`); pairs with `count < minSupport` (=2, set in the cron) are skipped, so a pair must co-occur in ≥2 orders. It's stored bidirectionally and `getTopCoOccurrences` keeps the top 20 related products each. The query reads the precomputed `productCoOccurrences` table via the `by_product_and_score` index.

**Q: Why Jaccard and not raw co-occurrence count or lift?**
Jaccard normalizes for popularity — a blockbuster product co-occurs with everything, so raw counts would make it look "frequently bought with" all items. Dividing by the union penalizes that. `minSupport=2` is a noise floor against single-order coincidences.

**Q: How does trending work — what's the decay?**
`computeTrendingScores(purchases, now, lambda)` at `recommendationHelpers.ts:152-167`:
`score(product) = Σ exp(−lambda · ageDays)` over each purchase line item, `ageDays = (now − timestamp)/86,400,000`. Lambda = 0.05/day (global, uniform), giving a half-life of `ln(2)/0.05 ≈ 13.86 days`. The query sorts by `trendingScore`, falling back to raw `purchaseCount` if a score is missing; a category filter just narrows the product set — the decay math itself is global.

**Q: Why exponential decay over a sliding window?**
Exponential decay is smooth and parameterized by a single intuitive knob (half-life ≈ 14 days), so a purchase's influence fades continuously rather than dropping off a cliff at a window edge. It rewards recent momentum without a hard cutoff.

**Q: Explain the "for-you" switching hybrid in detail.**
`forYou` in `recommendations.ts:113-245`. Anonymous users → global trending by `purchaseCount`. For logged-in users it switches on signal strength (mutually exclusive tiers):
- Tier 1 (purchaseCount ≥ 3): for up to 10 recent purchases, pull top-5 co-occurrences each, accumulate `+= co.score`, skip already-purchased.
- Tier 2 (purchaseCount ≥ 1): for each purchase, take 20 same-category products, accumulate `+= 0.5`.
- Tier 3 (favorites > 0): for up to 5 favorites, take 20 same-category, accumulate `+= 0.3`.
- Cold fallback: global trending by `purchaseCount`.
Then a category boost ×1.3 for candidates whose category is in the user's `favoriteCategories`, then MMR rerank on top `limit*2`.

**Q: Why "switching" and not a weighted blend of all signals?**
Because the tiers represent confidence: a user with ≥3 purchases gives reliable co-occurrence signal, so I trust it; a user with only favorites gets a weaker, lower-weight strategy. Switching avoids drowning a strong signal in noisy weak ones and degrades gracefully toward trending as signal vanishes.

**Q: Is the combination RRF (reciprocal rank fusion)?**
No, and this is an honest correction. It's additive accumulation into a Map — `candidateScores.set(id, (get(id) ?? 0) + score)` (`:169-172, 187, 202`) — raw score addition, no rank-reciprocal anywhere. The thesis mentioning RRF k=60 is a discrepancy (Part 4); the code uses additive scoring.

**Q: Explain MMR and its parameters.**
`applyMMR(candidates, lambda, limit)` at `recommendationHelpers.ts:240-273`, greedy with lambda = 0.7:
`mmrScore = lambda·relevance − (1−lambda)·maxSim(candidate, alreadySelected)`.
`itemSimilarity` is categorical: same brand = 1.0, else same category = 0.5, else 0.0. First pick = highest relevance, then iteratively the max mmrScore. Same MMR (0.7) is used by `similarProducts`. Lambda 0.7 means 70% relevance, 30% diversity — it stops a rail from being five near-identical phones.

**Q: Where do the crons run and what do they write?**
`crons.ts`: "recompute co-occurrences" at `0 3 * * *` rebuilds `productCoOccurrences` (minSupport 2, topN 20, batches of 200); "recompute trending scores" at `15 3 * * *` patches `products.trendingScore` (lambda 0.05, 3 decimals, batches of 100). `deriveAllUserPreferences` exists but is NOT on a cron — it runs once via the public `initialize` action after seeding; it derives favoriteCategories (top-3), priceRange, favoriteBrands (top-5), interestTags (top-10) via `derivePreferences()`.

**Q: Where do these rails surface in the UI?**
Home: `trending` + `forYou` rails (`page.tsx:13-14`). Product detail: `similarProducts` + `frequentlyBoughtTogether` (`product-detail-client.tsx:35-39`). Cart: `forCart` — aggregates top-10 co-occurrences per cart item additively, excludes items already in cart (`recommendations.ts:247-289`). All five are pure DB+math, no LLM.

### (b) Context generation & recording user actions

**Q: Walk through how the advisor context is generated per request.**
`assembleContext` in `ai/advisor.ts` (defined ~L12-114) runs unconditionally inside `requestAdvice` (~L133-136). It packs four blocks into a single `role: "system"` message: current product via `api.products.get`; review themes via `api.ai.reviewSummariesHelpers.getSummary`; cart via `api.cart.list` (server-side, authoritative); and up to 5 recently-viewed via `api.products.getByIds` over the client-passed `recentlyViewedIds`. Its inputs are just the request args `{productId, recentlyViewedIds}` plus live server queries.

**Q: Is that context persisted to the thread?**
No. It's built ephemerally and passed inline to `thread.streamText` via `messages`; only the assistant reply is saved with `saveStreamDeltas`. The comment confirms "assemble context on every request (not saved to thread)." So context is fresh and thrown away each call — that's how it stays in sync with the live catalog.

**Q: Now the behavior tracking — what hooks record what?**
- `use-dwell-time.ts`: cursor hover time on an element via mouseenter/leave + a 100ms-tick setInterval; returns `dwellTimeMs`.
- `use-scroll-depth.ts`: max scroll fraction (0–1) via a passive, rAF-throttled scroll listener; resets on pathname change.
- `use-viewport-tracking.ts`: cumulative ms an element is ≥50% visible, via `useInView` + 100ms tick.
- `use-product-engagement.ts`: composes the three into `{productId, dwellTimeMs, scrollDepth, cursorHoverMs, viewTimeMs, isInView}`.
- `use-behavior-tracker.ts`: session aggregator — `trackProduct` (merges per metric by `Math.max`), `setViewedReviews`, `addCategoryView` (last 20).
- `use-readiness-signals.ts`: derives UI nudges.
- `use-recently-viewed.ts`: localStorage list, cap 10.

**Q: How and when does the session flush?**
`use-behavior-tracker.ts` calls `api.behavior.upsertSession`. Flush triggers: every 5,000ms (`FLUSH_INTERVAL_MS`), on pathname change, and on `visibilitychange → hidden` (tab hide/close). Guards: no-op if no products viewed or session id still `"ssr"`; errors are silently swallowed. Session id is a `crypto.randomUUID()` in sessionStorage key `"zalem-session-id"`.

**Q: What's in the behaviorSessions table?**
`schema.ts:196-214`: `clerkUserId?`, `sessionId`, `productsViewed[]{productId, dwellTimeMs, scrollDepth, cursorHoverMs, viewedReviews, timestamp}`, `currentPage`, `cartProductIds[]`, `updatedAt`. Indexes `by_session` and `by_user`. The backend `upsertSession` merges per-product by `Math.max` (OR for `viewedReviews`) on update, else inserts. Note `cartProductIds` is always empty from the client — cart comes from the server query instead.

**Q: What are the readiness signals exactly?**
`shouldPulseAdvisor` fires if: dwell > 15000ms on a detail page (>5000ms elsewhere); or detail page AND scrollDepth > 0.5; or any category with ≥3 products viewed. Suggestion chips (each dismissible once, session-permanent): `review_engagement` ("What do buyers think?") when on detail + viewedReviews; `comparison_behavior` ("Compare these products?") when a category has ≥3 viewed; `cart_deliberation` ("Need help deciding?") when cart has items and not on a detail page.

**Q: Critical honest question — does the advisor read the behavior table?**
No. `assembleContext` does not query `behaviorSessions` anywhere in `advisor.ts`. The advisor context is assembled fresh from the request's `productId`/`recentlyViewedIds` and live server queries (products, review summary, cart). The behavior pipeline (`useBehaviorTracker → upsertSession → behaviorSessions`) feeds only client-side UI nudges (`useReadinessSignals`) and is persisted for analytics. So: behavior signals drive UI nudges; the LLM context is nav/session state assembled fresh and discarded.

**Q: Why build the whole behavior pipeline if the LLM doesn't use it?**
Two honest reasons: it powers the reactive UX (when to pulse the advisor, which chips to show), which is a real product feature; and it's the data substrate for the future fine-tuning / personalization work. It's deliberately decoupled from the prompt so behavior analytics can't silently leak unverified signals into grounded answers — a design choice, not an oversight, but I'm clear it's not wired into the LLM today.

### (c) The evaluation

**Q: What tool is the harness and how does it call the real advisor?**
Promptfoo v0.119, single config `packages/eval/promptfooconfig.yaml`, run via `bun --filter @zalem/eval eval[:sweep|:ablation]`. The provider `advisorProvider.ts` is a custom JS shim, not a model call: `callApi()` calls a Convex action `ai.evals.runOnce.runOnce` over `ConvexHttpClient`, authed by `CONVEX_EVAL_SECRET`. `runOnce` builds a fresh `@convex-dev/agent` Agent per call with the *production* tools and system prompt + few-shots, mirrors `assembleContext`, then `generateText` non-streaming at `maxOutputTokens: 2048`. So it exercises the real production code path, parameterized per row.

**Q: Dataset and config counts?**
Dataset `shopping-v1.yaml` = 25 rows across 6 categories (6 simple_qa, 5 product_validation, 5 comparison, 5 recommendation, 3 review_summary, 1 edge_case); 34 test cases per config because 9 rows duplicate with different expected-tools. 8-config sweep across 4 axes (modelId, reasoningEffort, maxSteps, promptVariant): baseline-flash-lite, gpt-oss-120b low/medium/high, gpt-oss-20b-medium, oss-120b-tight, oss-120b-loose, oss-120b-no-fewshot (plus a 9th ungrounded provider for the ablation). Totals: 8×34 = 272 advisor calls + ~1,100 judge calls; a full run ≈ $3, of which the Haiku judge is ~50%.

**Q: What are the 6 deterministic scorers and how does each work?**
1. `hasFinalAnswer` — pass if any non-empty text part or trimmed output exists; catches maxSteps-cutoff (agent emits no final text).
2. `groundedness` — regex-extracts cited product IDs (`/\bk[0-9a-z]{31}\b/g`), looks each up live via `products.get`; score = grounded/cited, pass iff zero missing; no citations → 1.0.
3. `factuality` — regex price/rating literals vs `dbSnapshot`, tolerances $0.01 / 0.1; score = (total − fabricated)/total, pass iff fabricated = 0.
4. `reviewThemeFidelity` — only if `checkReviewFidelity: true`; extracts up to 8 claim sentences, calls `ai.evals.checkThemes` to embed and count matches; grounded if ≥2 matching reviews; score = grounded/themes.
5. `toolCallEfficiency` — `0.6·dedupeRatio + 0.4·budgetScore` (dedupe by toolName::args, cap 6); soft, not a gate.
6. `expectedToolCoverage` — F1 of called∩expected tools, pass iff F1 ≥ 0.8 and no forbidden tools (forbidden = hard 0).

**Q: What are the LLM judges and how many?**
The config defines 4 llm-rubric judges: `judge_completeness` (thr 0.6), `judge_helpfulness` (0.6), `judge_tradeoff_surfacing` (0.5), `judge_tone` (0.7). The thesis text says 5 by adding "tool appropriateness," but the config comment states tool-appropriateness is intentionally NOT LLM-judged — it's covered by the programmatic `expectedToolCoverage`. That's a known thesis/code discrepancy I'll flag. Judge model is `claude-haiku-4-5` via OpenRouter, chosen cross-family (Anthropic judging gpt-oss/Gemini) to avoid self-preference bias. The judge sees only {question, final output} — never the reasoning trace or tool calls, to prevent reward-hacking via long reasoning and prestige bias.

**Q: How is the composite computed?**
`thesisExport.ts:24-30, 225-231`: `composite = 0.30·quality + 0.25·correctness + 0.20·(1−costPenalty) + 0.15·(1−latencyPenalty) + 0.10·efficiency`. Quality = mean of judge rubrics; correctness = mean of programmatic non-efficiency scorers; efficiency = mean of F1/dedupe; costPenalty and latencyPenalty are min-max normalized linearly across the sweep (`(avg−min)/(max−min)`) over avgCostUsd and avgLatencyMs, so they enter with effective negative weight and keep the composite in [0,1]. Cost = token usage × per-model OpenRouter pricing; latency p95 from per-call timings.

**Q: Describe the grounding ablation precisely.**
`promptfooconfig.ungrounded.yaml`, run `eval:ablation` → `results/ungrounded.json`. One provider `oss-120b-ungrounded`, identical model/reasoning/maxSteps to gpt-oss-120b-medium; only changes are `disableTools: true` (Agent gets `tools: {}`) and `promptVariant: ungrounded` (system prompt: "you have no tools, answer from your own knowledge"). Few-shots kept, same dataset/judges/thresholds, so rows are directly comparable to `results/latest.json`. Tool metrics are structurally inapplicable and excluded.

**Q: Give the ablation numbers and the key reading.**
Grounded vs ungrounded: specific claims 83 vs 162; claims failing DB 48.2% vs 67.3%; factuality 0.760 vs 0.533; judge helpfulness 0.572 vs 0.776; judge completeness 0.702 vs 0.885; latency p50/p95 2.4/5.3s vs 1.4/3.3s. Key reading: the ungrounded model fabricates a confident price table (Galaxy S24 Ultra $1,199, iPhone 15 Pro $999 — few-shot products recalled from world memory), and the judges *prefer the fabricator*. That validates the harness split: the programmatic DB checks carry the trust signal; the LLM judges are secondary.

### (d) The Amazon Rufus case + staleness

**Q: What is Rufus?**
Amazon's generative-AI shopping assistant launched 2024, a conversational layer over the catalog that answers product questions, summarizes reviews, and compares items. By late 2025 Amazon reported 300M+ users, ~149% YoY MAU growth, ~$12B incremental annualized sales, and Rufus shoppers ~60% more likely to purchase; analysts estimated ~13.7% of searches were Rufus-mediated by early 2026. It integrates the COSMO knowledge graph, Nova Web Grounding, and a "Help Me Decide" comparison feature, and was rebranded "Alexa for Shopping" in the US on May 13, 2026.

**Q: Where do your stats come from and how solid are they?**
The "32% right / 28% prices wrong / 83% own-brand / fabricated review themes" figures trace to 2024 ConsumerAffairs / Marketplace Pulse trade reporting and pooled AI-shopping-assistant studies — re-cited, not re-measured. I flag attribution carefully: the 28% price figure is sometimes attributed to ChatGPT Shopping, and 32%/83% to pooled studies. My footnote labels them trade reports, not peer-reviewed.

**Q: "Those 2024 numbers are surely better in 2026 — your motivation is stale."**
Three points. (1) They're a *design target*, not a live benchmark — I use the documented failures to define what my architecture must avoid; my contribution is my design and my own evaluation of it, which stands regardless of Rufus today. (2) The failure mode is inherent to the model class, not one Rufus build — I prove this in my own ablation: remove grounding and *my* assistant fabricates the same way. (3) As far as I can determine, the accuracy numbers haven't been superseded — Amazon reports relevance/revenue gains (COSMO ~60% macro-F1 search-relevance, Nova grounding) but no one has published a factual-accuracy or price-hallucination re-measurement since 2024, and 2026 seller forums still describe the same hallucination class. If pressed that Rufus likely improved on relevance: I concede it plausibly has, but relevance is orthogonal to factual grounding, and "Rufus is fixed" is itself an unsupported claim — my own ablation is the only controlled evidence in the room.

---

## Part 3 — Intuitive committee questions

**Q: What design patterns did you use?**
The classical engine separates pure functions (`recommendationHelpers.ts`) from I/O wrappers (`recommendations.ts`) — a ports/adapters split that makes the algorithms unit-testable without a database. The advisor uses a tool/agent pattern (read-only tools as the only fact source) and the eval uses a provider-shim adapter so the test harness drives the real production code path. Crons implement scheduled batch precomputation (materialized co-occurrence/trending tables) so reads are cheap.

**Q: How do you validate input?**
Convex validates every function argument against declared validators at the boundary (`v.id`, `v.string`, etc.), so malformed args are rejected before handler code runs. The advisor tools take typed args and query by ID, so an invalid ID returns nothing rather than fabricating. The eval scorers defensively handle empty/no-claim cases (vacuous 1.0). Honest gap: the advisor doesn't sanitize free-text user questions beyond the model itself — there's no separate prompt-injection filter.

**Q: How is it tested?**
Pure algorithm functions are unit-tested with bun's runner co-located as `.test.ts`. The advisor's behaviour is tested through the promptfoo harness (272 advisor calls + judges per sweep) with deterministic scorers asserting groundedness/factuality. There's no full E2E browser suite — that's a gap I'd close.

**Q: What happens with invalid or missing data — e.g. a product with no reviews?**
`reviewThemeFidelity` only runs when a row opts in; `getSummary` returns nothing for a product without a summary, so the advisor simply omits review themes rather than inventing them. `jaccard` returns 0 for empty sets; `priceProximity` returns 1 when maxRange ≤ 0; trending falls back to raw `purchaseCount` if a score is missing; `forYou` falls back to global trending for cold users. The system degrades to "less personalized," never to "fabricated."

**Q: How would this scale to a real catalog (millions of products)?**
Co-occurrence and trending are precomputed nightly into indexed tables, so reads stay O(top-N) regardless of catalog size; the bottleneck is the cron's matrix build, which I'd shard by category or move to an incremental update. Content similarity currently scores all same-category candidates per request — at scale I'd switch to an ANN/embedding index. The advisor's per-request context is bounded (one product + ≤5 recently-viewed + cart), so it scales with session size, not catalog size.

**Q: "Show me the code for grounding enforcement."**
Two layers. Construction: `ai/advisor.ts assembleContext` reads facts from live Convex queries and the tools only return real rows. Verification: `packages/eval/src/scorers/groundedness.ts` (cited IDs looked up via `products.get`) and `factuality.ts` (price/rating literals vs `dbSnapshot` within $0.01/0.1). The system prompt rules live in `promptVariants.ts`.

**Q: How would you integrate other data sources (e.g. real inventory, a CMS)?**
Anything that can be exposed as a Convex query becomes a new read-only advisor tool or an `assembleContext` block — the grounding contract is "facts come from a tool that reads a source of truth," so adding inventory means adding a `getInventory` tool and a factuality-style scorer for stock claims. The classical engine would consume new signals (e.g. real order history) by feeding the same co-occurrence/trending functions, which are source-agnostic pure functions.

**Q: What was the hardest part?**
Designing an evaluation that doesn't reward fluent fabrication. My first instinct was LLM judges, but the ablation showed judges *prefer* the confident fabricator — so the hard part was building deterministic, DB-backed scorers (groundedness, factuality, review-theme fidelity) and weighting them as the trust signal while demoting the judges to a quality proxy.

**Q: Why these model choices (gpt-oss, Gemini Flash-Lite, Haiku judge)?**
I wanted a cost/quality spread across families to test "integration not capability": gpt-oss-120b/20b as open-weight reasoning models, Gemini Flash-Lite as a cheap fast model, all behind OpenRouter for uniform access. The judge is Haiku deliberately cross-family from the candidates to avoid self-preference bias. The winner being the cheapest model is the result, not the assumption.

**Q: Why Convex and Next.js?**
Convex gives me a single reactive source of truth with typed queries, built-in crons, and actions — which is exactly the "single source of truth" the grounding argument needs, and it let the eval call the *real* advisor action directly. Next.js 16 (App Router, React Compiler) gives server components for the store and streaming for the advisor chat. The pairing meant facts live in one place that both the UI rails and the LLM read.

**Q: Security and auth?**
Clerk handles user auth in the web app; the advisor's eval entry point `runOnce` is gated by a `CONVEX_EVAL_SECRET` bypass token, not exposed publicly. The advisor tools are read-only, so even a fully compromised prompt can't mutate data. Cart reads are server-side and user-scoped. Gap I'd own: no rate-limiting or prompt-injection filtering on the public advisor endpoint.

**Q: The AI-specific ones — how many parameters / hidden layers / overfitting / false positives?**
I didn't train a model, so parameters/hidden layers belong to the off-the-shelf LLMs (gpt-oss-120b/20b, Gemini Flash-Lite) — I treat them as black boxes accessed via API. "Overfitting" reframes to eval-overfitting: my 25-row dataset is small, so I avoid tuning prompts to specific rows and I report the ablation separately. "False positives/negatives" reframe to my *scorers*: e.g. the factuality regex has false positives (flagging a non-price number like a year as a fabricated price), which is exactly why I lean on the relative grounded-vs-ungrounded delta rather than the absolute rate.

**Q: The fine-tuning future work — concretely?**
I'd collect (question, assembled context, validated grounded answer) traces from my harness — only rows passing groundedness+factuality — and supervised-fine-tune a small model (e.g. a 7–8B) to reproduce the select-and-explain behaviour and tool discipline. Goal: keep groundedness ≥0.89 while cutting cost and p95 latency below Flash-Lite. It's a distillation of my own grounded pipeline, not training a recommender from scratch.

---

## Part 4 — Tricky / adversarial questions

**Q: Your own AI judge preferred the fabricator — why should we trust your evaluation at all?**
Because that result is the point, not a bug I'm hiding. It empirically demonstrates that fluency-based judging rewards confident fabrication, which is why my composite weights deterministic, DB-backed scorers (groundedness, factuality, review-theme fidelity) as the trust signal and treats LLM judges as a secondary quality proxy. The judges preferring the fabricator is *evidence for* my methodological choice to ground trust in database checks rather than taste.

**Q: Your reviews are AI-generated — doesn't that invalidate the whole review-summary feature?**
The synthetic reviews are seed *data*, but the pipeline's claim is narrower and still valid: it verifies that each summary theme is supported by ≥2 reviews actually in the corpus, whatever their origin. So the feature proves "the summary doesn't fabricate themes beyond its source," which holds for synthetic or real reviews identically. The mechanism is source-agnostic; only the seed corpus is synthetic, and I list that as a catalog limitation.

**Q: If the advisor mostly reads the catalog directly, what does the classical engine actually contribute to the AI?**
Honestly, fairly little at the LLM layer — they're loosely coupled by design. The one bridge is `getRecommendations`, which lets the advisor invoke the deterministic engine when a user asks "what goes with this" instead of guessing related products. The classical engine's main job is the store rails (home/product/cart), not feeding the advisor; I don't overclaim a deep fusion.

**Q: The thesis says RRF k=60 but the code uses additive accumulation — explain.**
That's a real doc/code discrepancy and I'll own it. The `forYou` combination is additive score accumulation into a Map (`(get(id) ?? 0) + score`), with no reciprocal-rank term anywhere — the thesis's RRF k=60 description doesn't match the implementation. The honest answer is the thesis describes a design I considered/wrote up but the shipped code uses simpler additive scoring; I should correct the thesis text.

**Q: `validationPassed` is only a flag, not a hard block — so is the output really "validated"?**
Correct, and I won't overstate it. In the eval, the scorers compute pass/fail and surface violations as metrics; at runtime `validationPassed` is recorded as telemetry rather than a gate that blocks a response before it reaches the user. So "3-stage validation" means measured and flagged, not hard-enforced interception. A production version would add a blocking re-generation loop on failure — that's an honest limitation of the current build.

**Q: Isn't "hydration over generation" just RAG with a fancier name?**
It's in the RAG family, yes. The distinction I'm drawing is emphasis: standard RAG retrieves *documents* to condition generation and still trusts the model to phrase facts; my "hydration" pre-feeds *structured catalog records* and constrains the model to select-and-explain, with deterministic post-hoc verification that every price/rating/ID came from the DB. So it's RAG plus a strict no-authoring contract plus measured grounding — not a new retrieval algorithm, a tighter discipline. I'm comfortable calling it grounded RAG if the committee prefers.

**Q: 200 products and synthetic reviews — is any of this real?**
The catalog and reviews are seeded, but the *system* is real and running: real Convex backend, real classical algorithms, real LLM calls, real eval harness exercising production code. The grounding result is scale-independent — fabrication is a model property, and my ablation shows it appears and disappears with the grounding layer regardless of catalog size. The synthetic data limits external validity of the recommender (sparse co-occurrence), not the validity of the grounding mechanism.

**Q: The cheap model won — did you just under-tune the big one?**
Possible, and I tested it directly: the sweep includes gpt-oss-120b at low/medium/high reasoning and tight/loose step budgets and a no-fewshot variant. The big model's *best* raw quality (0.815 no-fewshot) actually beat Flash-Lite's quality (0.776), but it lost on cost and latency; high reasoning made it *worst* (0.492, p95 12.1s) by burning step budget. So it's not under-tuning — across five 120b configs none beat Flash-Lite on the composite, which is exactly the "integration not capability" finding.

**Q: Groundedness is ~1.0 for both arms in the ablation — so the metric catches nothing.**
The groundedness scorer checks cited *product IDs*, and neither arm cites many fabricated IDs because IDs aren't something the model recalls from memory — so yes, groundedness saturates and is the wrong lens for the ablation. That's precisely why I report *factuality* (price/rating literals, 0.76 vs 0.53) and the claim-failure rate (48% vs 67%) for the ablation — those catch the fabrication. Groundedness's value is showing the ID-citation channel is clean across the whole sweep; factuality is what discriminates grounded from ungrounded.

**Q: You cap context at request time — what about multi-turn drift?**
Two honest points. The catalog facts can't drift because I re-read them every turn (assembleContext runs per request, not once per conversation), so prices/specs stay live. But conversational *history* can drift — earlier turns persist in the thread and the model could carry a stale framing forward; I don't re-validate prior assistant turns, and multi-turn test cases were deferred to dataset v2. So single-turn grounding is solid; multi-turn drift is an acknowledged, untested gap.

**Q: Your factuality regex has a 48% failure rate even when grounded — doesn't that contradict "won't make facts up"?**
The 48% is inflated by regex false positives — the price/rating patterns catch numbers that aren't catalog facts (years, model numbers like "S24", quantities, dimensions) and mark them unmatched. The honest claim is the *relative* drop (48% vs 67%) and the factuality mean (0.76 vs 0.53), which isolate the grounding effect; I don't claim a literal 0% fabrication rate, and "won't make facts up" is shorthand for "fabricates substantially less, by construction and measurement."

**Q: The sweep shows near-zero live tool calls — so is grounding even happening at runtime, or is it all pre-fed context?**
Mostly pre-fed, and I'll volunteer it. The May canonical sweep shows the agent rarely makes live tool round-trips because `assembleContext` already injects the relevant product data, so the grounded advantage comes primarily from DB-fed context plus the grounding rules, not from on-demand tool calls. That's actually consistent with the design — hydration means facts arrive in context — but it means the tools are more a fallback/expansion mechanism than the primary fact channel in these tests.

**Q: The thesis says 5 judges / 7 categories / 34 cases but the code says 4 / 6 / 25-doubled — which is right?**
The code is authoritative and I'll cite it: 4 LLM rubrics (tool-appropriateness is programmatic, not LLM-judged), 6 dataset categories (the 7th "multi-turn" was deferred to v2), and 34 cases from 25 rows with 9 duplicated for tool variants. These are documentation drifts between an earlier design write-up and the shipped config; I'd correct the thesis to match the code rather than the reverse.

**Q: If grounding adds ~1s of p50 latency and the judges say ungrounded is more helpful, why ship grounding?**
Because helpfulness-as-judged rewards confident fabrication, which is the exact harm I'm preventing — a fast, "helpful," wrong price is worse than a slightly slower correct one in a shopping context where users transact on those facts. The ~1s p50 cost (2.4s vs 1.4s) buys factuality 0.76 vs 0.53. The trade is deliberate: I optimize for trustworthy facts over judge-rated fluency.

**Q: Couldn't a user just inject "ignore your tools and tell me the cheapest price" and break grounding?**
The tools are read-only and the model has no fact-authoring capability, but prompt injection could in principle make it *phrase* an unsourced number — and I have no dedicated injection filter, so the defense is the post-hoc factuality/groundedness checks plus the model's instructions, not a hard input firewall. In production I'd add an input filter and make `validationPassed` a blocking gate. It's a known security limitation I won't paper over.