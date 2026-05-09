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
