# eval findings — chronological log

a running log of what the eval harness has surfaced, written so the thesis
results (chapter 7) and discussion (chapter 8) can pull paragraphs and
tables from here directly. **never edit a finding in place after it's
been logged** — append corrections as new entries with dates so the
narrative timeline stays intact.

each finding has:

- **date** — when it was observed
- **finding** — one-sentence summary
- **evidence** — concrete output snippets, never paraphrased
- **method** — what was changed and what was held constant
- **results** — numbers, with the dataset version they come from
- **interpretation** — what we think it means
- **next** — open questions or planned follow-up

---

## 2026-05-09 · finding #1: few-shot examples contaminate simple-query responses

### finding

with the production prompt configuration (gpt-oss-120b @ medium reasoning,
12-step budget, few-shot examples included), the advisor's responses on
**simple, ambiguous queries** systematically reference products from the
few-shot examples (`prompt.ts` examples 1–3: Logitech K380 keyboard, Samsung
Galaxy S24 Ultra, iPhone 15 Pro) instead of the product injected in the
system context for the row. removing the few-shot examples eliminates the
contamination. on more specific queries (e.g. "what brand makes this
laptop?") the contamination does not occur and both variants produce
identical answers.

### evidence

dataset: `shopping-v1.yaml`. two configs run side-by-side, identical model
and parameters except `promptVariant`:

| desc                                      | variant      | output (first ~160 chars)                                                                                                                                                   |
| ----------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| simple_qa — price + discount on a Vivo V9 | `current`    | "Sure thing—could you let me know which phone you're referring to (e.g., **Samsung Galaxy S24 Ultra**, **iPhone 15 Pro**, or another model)? Then I can check the current…" |
| simple_qa — price + discount on a Vivo V9 | `no-fewshot` | "**The Vivo V9 is listed for $299.99**. At the moment there's no discount or promotional pricing shown for this model."                                                     |
| simple_qa — stock status on an iPhone 6   | `current`    | "I don't have real-time inventory data for that **keyboard**. If you can share the product ID (it looks like a string such as 'k…') I can look up its current stock s…"     |
| simple_qa — stock status on an iPhone 6   | `no-fewshot` | "Yes—this iPhone 6 (product ID `k1704herc3603wzds8jeex4c5983h6d7`) is currently in stock, with 60 units available."                                                         |
| simple_qa — screen size on a Galaxy Tab   | `current`    | "The Samsung Galaxy Tab White has a 15.05 × 5.37 × 11.82 cm footprint, which corresponds to a **10-inch display** (the typical size for tablets with those di…"             |
| simple_qa — screen size on a Galaxy Tab   | `no-fewshot` | "The Samsung Galaxy Tab White has a **10.1-inch display**."                                                                                                                 |
| simple_qa — brand on a Lenovo Yoga 920    | both         | identical: "The Lenovo Yoga 920 is made by **Lenovo**."                                                                                                                     |
| simple_qa — warranty on a MacBook Pro 14  | both         | identical: "The MacBook Pro 14-inch comes with a **3-year warranty**."                                                                                                      |

three rows show contamination (keyboard / S24 Ultra / iPhone 15 Pro), three
rows are identical or improved under no-fewshot.

### method

- **harness:** `bun --filter @zalem/eval eval` (Promptfoo v0.119)
- **dataset:** `packages/eval/src/datasets/shopping-v1.yaml` v1 (25 rows)
- **provider matrix:** 2 configs identical except prompt variant — both run
  in the same sweep so model, reasoning, providerOrder, dataset, and
  network conditions are held constant
- **scorers:** all 6 (`hasFinalAnswer`, `groundedness`, `factuality`,
  `toolCallEfficiency`, `expectedToolCoverage`, `reviewThemeFidelity`)
  applied identically to both variants
- **runs:** results captured in `packages/eval/results/latest.json`
  (id `eval-...-2026-05-09`)

### results (aggregate)

| variant      | rows | passed-assertion outcomes / total | full-row pass | notes                                                               |
| ------------ | ---- | --------------------------------- | ------------- | ------------------------------------------------------------------- |
| `current`    | 24   | 101 / 145 = **69.7%**             | 1 / 24        | dominated by simple_qa contamination + tool-F1=0                    |
| `no-fewshot` | 24   | 108 / 145 = **74.5%**             | 1 / 24        | +4.8pp on assertion outcomes, qualitatively far better on simple_qa |

(20 row-level entries fall into a "metadata-missing" bucket, mostly errored
runs — excluded from the variant rollup. `fully_passing` is a strict bar
that almost no row clears yet because some scorers — notably
`expectedToolCoverage` — are calibrated against a dataset that assumes the
agent calls tools even when the system context already has the data. that
calibration is dataset-side work, not an agent issue. see `next`.)

### interpretation

the few-shot examples in `packages/backend/convex/ai/prompt.ts` are injected
into the model's `messages` array as JSON-encoded `user` and `assistant`
turns. when the live user sends a short, ambiguous message ("What's the
price of this phone?"), the model treats those few-shot turns as the
**recent conversation history** and pattern-matches the user's question
against the products that appeared in those turns rather than against the
product in the system-context message.

this matches a known failure mode of in-context few-shot examples: when
example outputs are concrete enough (specific product names, specific
prices), the model copies them rather than learning the abstract pattern
the example was meant to teach. the production code path
(`packages/backend/convex/ai/advisor.ts`) only includes few-shots on the
first message of a thread and may have masked this in real use because
real users typically open the advisor with a more specific click-through
question (e.g., from a "compare these two" chip), not a generic "what's the
price?".

the eval surfaced this _because_ the dataset includes plain, intentionally
ambiguous shopping queries that mirror what users would actually type if
they used a free-form text input — a class the production UX largely
side-steps via question chips. **the harness exposed a failure mode the
production UX hides.**

### implications for the thesis

- chapter 7 (results) — first concrete demonstration of the eval system
  surfacing a measurable agent-quality issue. directly answers chapter 4's
  "is the harness useful?" question with evidence.
- chapter 8 (discussion) — example of how UX design choices (question chips
  → narrow query distribution) can mask agent weaknesses on the long-tail
  open query distribution. argues for evals that test against the broader
  query distribution, not just the UX-curated one.
- methodology angle — A/B in the same sweep with one knob changed is the
  cleanest controlled comparison the harness supports. document this
  pattern in chapter 6 as the canonical eval methodology.

### next

- **fix the few-shots, don't drop them.** the few-shots also teach
  comparison structure and review-summary phrasing — both useful. options:
  1. move few-shots out of the `messages` array and into the system prompt
     as plain "Example:" prose so the model sees them as instructions, not
     conversation history
  2. rewrite the user-side few-shots in plain-text form (matching how real
     users phrase queries) instead of JSON-encoded behavior dumps
  3. only include few-shots when the query type matches what the few-shot
     teaches (e.g., gate by query classifier — heavyweight, deferred)
- **extend the A/B with a reformatted-fewshot variant** to verify (1) or (2)
  recovers the comparison/recommendation quality without the contamination.
  add `promptVariant: "few-shot-as-prose"` once written.
- **dataset calibration** — `expectedToolCoverage` currently penalises rows
  where the agent correctly skips redundant tool calls (because the system
  context already has the data). either loosen the assertion (recall-only,
  no precision penalty) or annotate which rows expect zero tool calls.
  this is dataset work, not an agent fix.

---

## 2026-05-09 · finding #2: LLM judges independently confirm finding #1

### finding

with the same A/B sweep as finding #1 (current vs no-fewshot, 25 rows
each, identical model/parameters), a Claude Haiku 4.5 judge was added
across four rubrics (completeness, helpfulness, tradeoff surfacing, tone).
the judge is from a different model family (Anthropic) than both
candidate variants (gpt-oss-120b, OpenAI lineage) — so self-preference
bias is minimised. **the judge agrees with the programmatic A/B on every
rubric except tone (which is a tie).** the largest deltas are on the two
rubrics most directly tied to the contamination failure mode.

### evidence

dataset: `shopping-v1.yaml`. judge: `openrouter:anthropic/claude-haiku-4-5`,
seeing only `{question, final output}` per row (no reasoning trace, no tool
calls — bias mitigation per `docs/eval-system-plan.md` § "judge model
selection"). 34 row-runs per variant.

| rubric                     | current mean | no-fewshot mean |         Δ | current pass-rate | no-fewshot pass-rate |
| -------------------------- | -----------: | --------------: | --------: | ----------------: | -------------------: |
| `judge_completeness`       |        0.606 |       **0.826** | **+0.22** |               53% |              **82%** |
| `judge_helpfulness`        |        0.563 |       **0.686** | **+0.12** |               47% |              **76%** |
| `judge_tradeoff_surfacing` |        0.840 |       **0.944** | **+0.10** |               82% |              **94%** |
| `judge_tone`               |        0.852 |           0.840 |     -0.01 |               94% |                  94% |

programmatic context (carried over from finding #1):

| variant      | passed-assertion outcomes / total |
| ------------ | --------------------------------- |
| `current`    | 101 / 145 = 69.7%                 |
| `no-fewshot` | 108 / 145 = 74.5%                 |

### method

same as finding #1, except:

- judges added in `defaultTest.assert` as four `llm-rubric` blocks tagged
  with `metric: judge_*` for grouping
- judges share `defaultTest.options.provider:
openrouter:anthropic/claude-haiku-4-5`
- thresholds: completeness 0.6, helpfulness 0.6, tradeoff 0.5, tone 0.7
- run id: `eval-...-2026-05-09T20:32` (after the OPENROUTER_API_KEY was
  added to `packages/eval/.env`)
- token cost: ~419k total (180k advisor + 240k grading); ~$0.40 per
  full sweep at current OpenRouter pricing for these models

### interpretation

two methodologies — programmatic comparison and a cross-family LLM
judge — independently rank the two prompt variants the same way.
agreement across methods is the strongest signal a single eval run can
produce: it argues the finding isn't an artefact of either scoring
approach.

the two largest deltas (`completeness` +22pp, `helpfulness` +12pp) are
exactly the rubrics most threatened by the contamination failure mode
(asking for clarification instead of answering = low completeness;
generic deflection = low helpfulness). the smallest delta is `tone`,
which is plausible: even when the contaminated response answers the
wrong product, it does so in a polite, advisor-like tone — the failure
is in _what_ it says, not _how_.

methodologically, this is the canonical pattern the harness was built to
support — **A/B in the same sweep, multi-method scoring, agreement as
robustness check**. document this in chapter 6 as the recommended
workflow.

### implications for the thesis

- chapter 6 (evaluation methodology) — concrete instance of "programmatic
  - LLM-judge agreement as a robustness check." also concrete evidence
    the cross-family judge choice (Haiku judging gpt-oss) doesn't
    systematically advantage either candidate, which is the whole point
    of cross-family selection.
- chapter 7 (results) — combine finding #1 (qualitative table of
  contaminated vs clean outputs) with finding #2 (judge-confirmed
  numerical deltas) for a complete A/B writeup. one figure per finding,
  one paragraph each.
- chapter 8 (discussion) — concrete data for the limits-of-LLM-judging
  discussion: judges DO surface the same signal as programmatic scoring
  here, but only because the failure mode produces visible textual
  artefacts. failure modes that don't show up in the final text (e.g.
  silent over-tool-calling that still produces a clean answer) wouldn't
  be caught by judges — that's why we keep both layers.

### next

- **fix the few-shots and re-run the A/B** — write `prompt-fewshot-as-prose`
  variant per finding #1 § next, run a 3-way sweep (`current` vs
  `no-fewshot` vs `as-prose`), see if the as-prose variant retains the
  no-fewshot quality without losing whatever the few-shots taught. this
  becomes finding #3 and gives the thesis a "we found a problem AND
  fixed it" arc rather than just a problem statement.
- **judge calibration sanity-check** — manually review 5-10 rows where
  the programmatic and judge scores disagree the most. a thesis examiner
  will ask this; doing it preemptively gives us an answer.
- the `judge_tradeoff_surfacing` rubric explicitly says "for simple
  factual queries (what's the price?) score 1.0", which inflates the
  no-fewshot variant's score on simple_qa rows where it gives a clean
  factual answer. consider whether the rubric should instead exclude
  simple_qa rows from this metric entirely — track this as a calibration
  question, not a bug.

---

## 2026-05-09 · finding #3: full 8-config sweep — Flash-Lite is the cost/quality champion

### finding

with the canonical 8-configuration sweep run end-to-end (gpt-oss-120b across
low/medium/high reasoning + tight/loose maxSteps + be-efficient prompt;
gpt-oss-20b; gemini-3.1-flash-lite-preview; the no-fewshot variant), the
**Gemini 3.1 Flash-Lite baseline ranks #1 on composite** despite being the
configuration we previously treated as a fallback. the gpt-oss-120b
no-fewshot variant ranks #2 with the highest **quality** subscore but
loses on cost and latency. higher reasoning effort (`high`) and looser
step budget (`ms15`) both *hurt* composite — confirming the spec's
hypothesis that reasoning effort is not a free lunch.

### evidence

generated 2026-05-09 by `bun --filter @zalem/eval eval:export` from
`results/latest.json`. `thesis/figures/eval-ranked-configs.tex` — the
ranked LaTeX table that goes into chapter 7:

| # | configuration | quality | correctness | efficiency | avg cost | p95 latency (ms) | composite |
|---|---|---:|---:|---:|---:|---:|---:|
| 1 | gemini-3.1-flash-lite · none · ms12 · current        | 0.828 | 0.960 | 0.500 | $0.0003 | 4934  | **0.870** |
| 2 | gpt-oss-120b · medium · ms12 · **no-fewshot**        | **0.870** | 0.940 | 0.487 | $0.0006 | 3860  | 0.819 |
| 3 | gpt-oss-120b · low · ms12 · current                  | 0.842 | 0.894 | 0.489 | $0.0006 | 4465  | 0.788 |
| 4 | gpt-oss-120b · medium · ms12 · current               | 0.818 | 0.953 | 0.484 | $0.0008 | 5309  | 0.752 |
| 5 | gpt-oss-120b · medium · ms8 · be-efficient           | 0.834 | 0.900 | 0.483 | $0.0007 | 5572  | 0.740 |
| 6 | gpt-oss-120b · medium · ms15 · current               | 0.795 | 0.926 | 0.453 | $0.0007 | 7848  | 0.731 |
| 7 | gpt-oss-20b · medium · ms12 · current                | 0.749 | 0.932 | 0.496 | $0.0005 | **33456** | 0.664 |
| 8 | gpt-oss-120b · **high** · ms12 · current             | 0.821 | 0.942 | 0.475 | $0.0010 | 8129  | 0.658 |

pareto data + plots: `thesis/figures/eval-pareto-cost-quality.{csv,tex}`
and `thesis/figures/eval-pareto-latency-quality.{csv,tex}` (pgfplots
scatter, ready to `\input{}` from any chapter).

per-category programmatic-correctness breakdown: `thesis/figures/eval-per-category.tex`.

### method

- **harness:** `bun --filter @zalem/eval eval` followed by `eval:export`
- **dataset:** `shopping-v1.yaml` v1
- **provider matrix:** 8 configurations from the planned canonical sweep
  (see `promptfooconfig.yaml`)
- **scorers:** all 6 programmatic + 4 LLM-judge rubrics (Claude Haiku 4.5)
- **composite weights:** quality 0.30, correctness 0.25, cost 0.20, latency
  0.15, efficiency 0.10 (configurable in `thesisExport.ts`)
- **caveats**:
  1. ~86 row-runs hit an OpenRouter `max_tokens` credit-limit error
     mid-sweep (account-side credit limit, not a model failure). this
     biased the *coverage* of long-output configs (high reasoning, loose
     step budget) downward — they're penalised partly for failing rather
     than partly for being slow. fix: lowered `maxOutputTokens` to 2048
     in `runOnce.ts` for the next sweep.
  2. `gpt-oss-20b` returned empty output on several rows (judge: "the
     output is empty, so there is no tone to evaluate"). this looks like
     a model issue with that specific size variant on Cerebras/Groq —
     worth a separate dedicated A/B before relying on the 20b numbers.

### interpretation

three distinct conclusions:

1. **Flash-Lite is genuinely competitive** for this advisor task. it has
   the lowest input/output token cost, no reasoning overhead, and the
   second-shortest latency. the only thing it loses on is raw quality
   (0.828 vs 0.870 for no-fewshot gpt-oss) — and even that gap is small.
   the composite weights (cost 0.20, latency 0.15) push it to the top
   when those are taken seriously. this challenges the implicit
   assumption baked into the production code (`models.ts:30`) that
   "conversational" requires gpt-oss-120b — Flash-Lite would likely be
   acceptable as the conversational tier too.

2. **few-shots remain a net negative.** finding #1 said no-fewshot beats
   current on a 2-config A/B; finding #3 says no-fewshot beats current
   when *both* are dropped into a larger 8-config matrix (the only place
   no-fewshot loses to current is on `correctness`, where the gap is
   1.3pp). cumulative across three measurements (programmatic A/B, judge
   A/B, full sweep), the few-shot configuration consistently
   underperforms. it should be removed from production or rewritten per
   finding #1 § next.

3. **reasoning effort and step budget are not monotonic improvers.**
   `high` reasoning is the worst-composite config in the sweep (0.658),
   despite having competitive raw quality. `ms15` (loose step budget) is
   second-worst on composite (0.731). the harness directly answers the
   question "should we crank up reasoning?" with **no, on this dataset**.
   this is the kind of design-space evidence the original `eval-system-plan.md`
   set out to produce.

### implications for the thesis

- **chapter 7 (results) — primary table.** the ranked config table above
  is the centrepiece of section 7.2 ("system evaluation"). drop in
  `\input{figures/eval-ranked-configs.tex}` and discuss in three
  paragraphs (one per conclusion above).
- **chapter 7 — pareto figures.** `\input{figures/eval-pareto-cost-quality.tex}`
  and the latency variant. the cost pareto front clearly shows Flash-Lite
  + no-fewshot dominate everything else.
- **chapter 7 — defended choice.** the shipped configuration should be
  argued for explicitly: "we ship gpt-oss-120b @ medium with the reformed
  no-fewshot prompt because [reasons], even though the harness suggests
  Flash-Lite is composite-optimal — chosen for [trade-off]." this turns
  a "we picked the best number" into "we made a defensible engineering
  decision under multi-objective optimization", which is stronger.
- **chapter 8 (discussion) — credit-limit caveat.** a candid paragraph
  about the OpenRouter credit ceiling biasing the sweep is good
  honesty, not a weakness — re-run with the `maxOutputTokens: 2048` fix
  for the chapter 7 numbers.

### next

- **re-run the sweep** with `maxOutputTokens: 2048` (already shipped in
  `runOnce.ts`) so high-reasoning / ms15 configs aren't unfairly
  penalised by API-side credit limits
- **add gemini-3-flash + claude-haiku-4-5 + an OpenAI gpt-5 mini variant**
  as candidate providers in the next sweep so the matrix actually spans
  the major model families — currently dominated by gpt-oss
- **drop or rewrite the few-shots** in `packages/backend/convex/ai/prompt.ts`
  per finding #1 § next, then re-A/B vs `current` to see whether the
  fix recovers the comparison/recommendation quality the few-shots were
  intended to teach (finding #4)
- **investigate the gpt-oss-20b empty-output issue** before treating those
  numbers as load-bearing

---

## template for future findings (copy-paste)

```markdown
## YYYY-MM-DD · finding #N: <one-sentence headline>

### finding

<2-4 sentences. what behavior was observed, under what conditions.>

### evidence

<concrete output snippets in a table or fenced block. never paraphrase.
include the dataset version and the run id from results/latest.json.>

### method

- **harness:** `bun --filter @zalem/eval eval`
- **dataset:** `shopping-vN.yaml`
- **provider matrix:** <what was held constant, what varied>
- **scorers:** <which ones>
- **runs:** results id

### results

<aggregate numbers, pareto deltas, or qualitative table>

### interpretation

<what we think it means. not just "what happened" — why we think it
happened, with reference to prompt design / dataset / model behavior.>

### implications for the thesis

- chapter X — <how this informs that chapter>

### next

- <open question or planned follow-up, with assignee if applicable>
```
