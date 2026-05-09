# custom eval system plan

a purpose-built evaluation harness for measuring and comparing LLM configurations in the `zalem` shopping advisor. the goal is to turn model selection, prompt design, and parameter tuning into a data-driven process instead of vibes — and to produce thesis-quality evidence at the same time.

---

## direction change (2026-05-09)

**previous plan:** build a custom in-house eval system end to end — own Convex tables (`evalRuns`, `evalRunResults`, `evalDatasets`), own runner action, own admin webapp at `/admin/evals` with run lists, comparison views, pareto charts, and CSV export.

**new plan:** use **Promptfoo** (MIT, open-source) as the runner / dataset manager / report generator, and write only the bits that don't exist off-the-shelf — a custom provider that calls our Convex agent, plus a small library of **shopping-domain scorers** that grade groundedness, factuality, tool-call efficiency, and review-theme fidelity against the live Convex catalogue.

**why:**

- the most expensive piece of the original plan (the admin webapp + own runner + own tables + own dashboard) is **generic infrastructure** that Promptfoo already provides better. re-implementing it has poor thesis ROI — an examiner will read it and ask "why didn't you use Promptfoo / Langfuse / Braintrust?"
- the **actually novel part** is the domain-specific scoring: validating cited `productId`s exist in Convex, checking that prices/ratings in the answer match a DB snapshot, verifying review themes against the embedding-backed review corpus. these scorers don't exist in any off-the-shelf tool and are exactly the angle that lets the thesis claim a Rufus-beating quality bar (see `ai-integration-plan.md` § 4)
- this framing is **stronger academically**. "we extended an open-source eval framework with shopping-domain scorers grounded in live catalogue data" shows literature awareness and isolates the actual contribution. NIH ("not invented here") gets penalised in bachelor theses
- the time saved (~3–5 weeks of webapp engineering reduced to ~3–5 days of glue code) goes into more dataset coverage, the user study, and writing

what stays the same:

- the dataset design (~25 hand-curated questions across 7 categories with expected behavior tags)
- the scoring rubric (programmatic + LLM-as-judge, weighted into a composite)
- the 9-config first-batch sweep (gpt-oss vs gemini × reasoning effort × maxSteps × prompt variant)
- the validity-threats discussion
- the relationship to the user study

what changes:

- the runner is `promptfoo eval` instead of a Convex action
- the dataset is YAML in `packages/eval/src/datasets/` instead of a Convex table
- results are JSON files in `packages/eval/results/` instead of `evalRunResults` rows
- the dashboard is `promptfoo view` (a local web UI) instead of an admin route
- the thesis tables come from a small `reports/thesisExport.ts` script that reads the Promptfoo JSON output and emits LaTeX

---

## what is Promptfoo (quick primer)

**Promptfoo** is an MIT-licensed, Node/TypeScript CLI for evaluating LLM applications. install with `bun add -D promptfoo` (or `npx promptfoo`). configure with a single `promptfooconfig.yaml`. run with `promptfoo eval`. view results with `promptfoo view` (local web UI on `localhost:15500`).

it is not a SaaS, not a hosted dashboard, not a tracing platform. it is a **test runner** — pytest for LLMs.

### what it gives us out of the box

| feature                                                  | how it helps zalem                                                                                                               |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| YAML dataset format                                      | versioned in git, citable in the thesis                                                                                          |
| `providers` matrix                                       | run all 9 sweep configs against the dataset with one command — no glue code                                                      |
| custom **JS providers** (`file://path.ts`)               | wrap our Convex `requestAdvice` action so Promptfoo tests the real production code path                                          |
| custom **JS assertions** (`file://path.ts:functionName`) | drop in our domain scorers (groundedness, factuality, theme fidelity)                                                            |
| built-in `tool-call-f1` assertion                        | replaces the planned `expectedToolCoverage` / `forbiddenToolCheck` scorers — already does F1 across called vs expected tool sets |
| built-in `model-graded` assertions                       | replaces the planned LLM-as-judge scorers — supports rubrics, scores, custom judge models                                        |
| JSON + HTML output                                       | trivially parsed into LaTeX tables and pareto plots for the thesis                                                               |
| local web view                                           | replaces the planned admin webapp for exploration / comparison                                                                   |
| variable interpolation                                   | one YAML test row → tested against every provider config with full row-vs-config matrix                                          |
| `defaultTest` block                                      | shared assertions applied across all rows (e.g. "must produce a non-empty final answer")                                         |

### what it does NOT give us (and why it doesn't matter)

- **no persistent run history beyond the JSON files** — but git already versions those, and 25 questions × 9 configs is small
- **no tracing of internal tool calls** — but our provider captures the full trace from the Convex action and stores it in the result blob
- **no user-friendly dashboard** — `promptfoo view` is enough for development; the thesis tables come from a custom export script anyway
- **single-machine** — fine for our scale. if/when we want a hosted dashboard with team-level visibility, we layer self-hosted **Langfuse** on top later (see § future extensions)

### minimal Promptfoo config (illustrative, not the real one)

```yaml
description: zalem shopping advisor sweep

providers:
  - id: file://src/providers/advisorProvider.ts
    label: gpt-oss-120b-medium
    config:
      modelId: openai/gpt-oss-120b
      reasoningEffort: medium
      maxSteps: 12

prompts:
  - "{{question}}"

defaultTest:
  assert:
    - type: javascript
      value: file://src/scorers/hasFinalAnswer.ts
    - type: javascript
      value: file://src/scorers/groundedness.ts
    - type: tool-call-f1
      value:
        expectedTools: "{{expectedTools}}"

tests: file://src/datasets/shopping-v1.yaml
```

---

## architecture

```
                            DEVELOPER MACHINE
   ┌─────────────────────────────────────────────────────────────────┐
   │                                                                 │
   │   bun run eval:sweep                                            │
   │           │                                                     │
   │           ▼                                                     │
   │   ┌────────────────┐                                            │
   │   │ promptfoo eval │   reads promptfooconfig.yaml               │
   │   │                │   + datasets/shopping-v1.yaml              │
   │   │  - matrix      │                                            │
   │   │  - parallelism │   runs (rows × providers) cells            │
   │   │  - retries     │                                            │
   │   └────────┬───────┘                                            │
   │            │ for every (row, provider) cell:                    │
   │            ▼                                                    │
   │   ┌────────────────────────┐                                    │
   │   │ advisorProvider.ts     │                                    │
   │   │ (custom JS provider)   │                                    │
   │   │                        │                                    │
   │   │  .callApi(prompt, ctx) │                                    │
   │   └────────┬───────────────┘                                    │
   │            │ HTTPS (Convex client)                              │
   │            ▼                                                    │
   └────────────┼────────────────────────────────────────────────────┘
                │
                │
   ┌────────────┼────────────────────────────────────────────────────┐
   │            ▼                  CONVEX (eval deployment)          │
   │   ┌────────────────────────┐                                    │
   │   │ ai/evals/runOnce       │   one-shot, non-streaming variant  │
   │   │ (action — eval-only)   │   of requestAdvice. accepts the    │
   │   │                        │   per-run config (modelId,         │
   │   │  1. snapshot products  │   reasoningEffort, maxSteps,       │
   │   │  2. run agent loop     │   promptVariant, providerOrder).   │
   │   │  3. await stream       │                                    │
   │   │  4. return:            │   marks the thread isEval=true so  │
   │   │     - parts            │   it's filtered out of normal      │
   │   │     - usage            │   queries.                         │
   │   │     - timings          │                                    │
   │   │     - dbSnapshot       │                                    │
   │   │     - threadId         │                                    │
   │   └────────────┬───────────┘                                    │
   │                │                                                │
   │                ▼                                                │
   │   ┌────────────────────────┐                                    │
   │   │ shoppingAdvisor agent  │   the real advisor — same code     │
   │   │  (gpt-oss / gemini)    │   as production, parameterised by  │
   │   │                        │   the per-run config above.        │
   │   └────────────────────────┘                                    │
   │                                                                 │
   └─────────────────────────────────────────────────────────────────┘

   ┌─────────────────────────────────────────────────────────────────┐
   │                       BACK ON DEV MACHINE                       │
   │                                                                 │
   │   provider returns to Promptfoo:                                │
   │     { output, tokenUsage, metadata: {parts, timings, snapshot}} │
   │            │                                                    │
   │            ▼                                                    │
   │   ┌──────────────────────────────────────────────┐              │
   │   │ Promptfoo runs assertions for this row:      │              │
   │   │                                              │              │
   │   │  - hasFinalAnswer.ts        (programmatic)   │              │
   │   │  - groundedness.ts          (Convex query)   │              │
   │   │  - factuality.ts            (snapshot diff)  │              │
   │   │  - reviewThemeFidelity.ts   (embedding sim)  │              │
   │   │  - toolCallEfficiency.ts    (programmatic)   │              │
   │   │  - tool-call-f1             (built-in)       │              │
   │   │  - model-graded helpfulness (built-in judge) │              │
   │   │  - model-graded completeness                 │              │
   │   │  - model-graded tradeoffSurfacing            │              │
   │   └──────────────┬───────────────────────────────┘              │
   │                  │                                              │
   │                  ▼                                              │
   │   results/<timestamp>.json                                      │
   │                  │                                              │
   │                  ▼                                              │
   │   ┌──────────────────────┐    ┌─────────────────────────┐       │
   │   │ promptfoo view       │    │ reports/thesisExport.ts │       │
   │   │ (local web UI)       │    │ → LaTeX tables          │       │
   │   │ for development      │    │ → pareto plots (PDF)    │       │
   │   └──────────────────────┘    └─────────────────────────┘       │
   │                                                                 │
   └─────────────────────────────────────────────────────────────────┘
```

### why a dedicated `runOnce` Convex action (not just calling `requestAdvice`)

`requestAdvice` is auth-gated, streams to subscribers, and assumes a thread already exists. for evals we want:

- no Clerk auth (admin secret in env instead)
- synchronous return of the full result blob (parts, usage, timings) — no streaming consumer needed on the eval side
- per-call config injection (modelId, reasoningEffort, maxSteps, promptVariant) so one action can run any sweep cell
- fresh throwaway thread per row, marked `isEval: true` so eval data doesn't pollute production queries
- a DB snapshot timestamp captured at run start so `factuality.ts` can later check claimed prices/ratings against what the catalogue actually said at that moment

implementing this as a **separate** action keeps the production `requestAdvice` clean and avoids leaking eval concerns into the user-facing path.

---

## workspace layout

```
packages/eval/
├── package.json                  # bun workspace, scripts, devDeps
├── tsconfig.json                 # extends @zalem/config
├── promptfooconfig.yaml          # the only Promptfoo config — defines
│                                 # the 9 sweep providers, default
│                                 # assertions, and dataset reference
├── README.md                     # quick reference for running evals
├── .gitignore                    # ignore results/ and .promptfoo cache
│
├── src/
│   ├── providers/
│   │   └── advisorProvider.ts    # custom Promptfoo provider — calls
│   │                             # the Convex eval action, returns
│   │                             # { output, tokenUsage, metadata }
│   │
│   ├── scorers/
│   │   ├── hasFinalAnswer.ts     # there is at least one non-empty text
│   │   │                         #   part (catches the maxSteps cutoff)
│   │   ├── groundedness.ts       # every cited productId exists in
│   │   │                         #   Convex `products` (live query)
│   │   ├── factuality.ts         # claimed prices/ratings match the
│   │   │                         #   DB snapshot taken at run start
│   │   ├── reviewThemeFidelity.ts # claimed review themes match the
│   │   │                         #   embedding-backed review corpus
│   │   │                         #   (generalises validateThemesWith-
│   │   │                         #   Embeddings from reviewSummaries.ts)
│   │   └── toolCallEfficiency.ts # duplicate-call penalty + step-budget
│   │                             #   usage, from the trace metadata
│   │
│   ├── datasets/
│   │   ├── shopping-v1.yaml      # 25 hand-curated questions with
│   │   │                         #   expected tool calls and product IDs
│   │   └── README.md             # how the dataset is curated, how to
│   │                             #   add a row, versioning policy
│   │
│   ├── lib/
│   │   ├── convexClient.ts       # shared Convex HTTP client used by
│   │   │                         #   the provider AND the scorers
│   │   └── snapshot.ts           # captures and reads DB snapshots
│   │                             #   (price/rating per productId at
│   │                             #   the moment a row was run)
│   │
│   └── reports/
│       └── thesisExport.ts       # reads results/<latest>.json and
│                                 #   emits:
│                                 #    - chapter7-table.tex (ranked
│                                 #      configs with composite, cost,
│                                 #      latency, quality)
│                                 #    - pareto-cost-quality.pdf
│                                 #    - pareto-latency-quality.pdf
│
├── scripts/
│   ├── run.sh                    # bun run eval — single config
│   ├── sweep.sh                  # bun run eval:sweep — full 9-config
│   ├── view.sh                   # bun run eval:view — open dashboard
│   └── export.sh                 # bun run eval:export — thesis tables
│
└── results/                      # gitignored. one JSON per run.
    └── .gitkeep
```

### bun scripts (defined in `packages/eval/package.json`)

```jsonc
{
  "scripts": {
    "eval": "promptfoo eval",
    "eval:sweep": "promptfoo eval --no-cache", // forces fresh runs
    "eval:view": "promptfoo view", // localhost:15500
    "eval:export": "bun run src/reports/thesisExport.ts",
    "eval:reset": "rm -rf results/* .promptfoo-cache",
  },
}
```

invoked from monorepo root via:

```bash
bun --filter @zalem/eval eval          # one off
bun --filter @zalem/eval eval:sweep    # full sweep
bun --filter @zalem/eval eval:view     # browse results
bun --filter @zalem/eval eval:export   # thesis tables
```

### why TypeScript, not Python

Promptfoo runs Node natively. our provider must talk to the Convex client (`convex` npm package) and our scorers must talk to the Convex catalogue. doing this in Python would mean two language stacks, two dep managers, and a fragile bridge. since the rest of the monorepo is bun + TypeScript, eval stays bun + TypeScript. **no `uv` / Python toolchain needed.** mise already pins `bun` and `node` for the repo.

---

## the data flow for one eval row

```
   row in shopping-v1.yaml
   ─────────────────────────────────────────────────────────
   id: compare-keyboards-01
   vars:
     question: "How does the K380 compare to the MX Keys Mini?"
     productId: "k57abc..."
     expectedTools: ["getProductDetails", "compareProducts"]
     expectedProductIds: ["k57abc...", "mxkmini..."]
   ─────────────────────────────────────────────────────────
                  │
                  ▼
   Promptfoo for each provider in the sweep:
                  │
                  ▼
   advisorProvider.callApi:
     await convex.action(api.ai.evals.runOnce, {
       question: vars.question,
       productId: vars.productId,
       config: provider.config,    // modelId, reasoning, maxSteps...
     })
                  │
                  ▼
   Convex returns:
     {
       output: "<final assistant text>",
       tokenUsage: { input, output, reasoning, total },
       metadata: {
         parts: [...],              // full part array, incl. tool-call parts
         timings: { startedAt, firstDeltaAt, finishedAt, ttftMs, totalMs },
         dbSnapshot: { "k57abc...": { price, rating }, ... },
         threadId: "...",
         finishReason: "stop",
         stepsUsed: 7,
       }
     }
                  │
                  ▼
   Promptfoo runs every assertion in defaultTest + the row's own assert[]:
     - programmatic scorers read output + metadata
     - tool-call-f1 reads parts + vars.expectedTools
     - model-graded scorers send (question, output) to the judge model
                  │
                  ▼
   results/<timestamp>.json gets one entry per (row × provider) cell
```

---

## dataset design

unchanged from the previous plan, restated here as the source of truth.

dataset lives at `packages/eval/src/datasets/shopping-v1.yaml`. each row is:

```yaml
- description: compare two keyboards in the same category
  vars:
    question: "How does the K380 compare to the MX Keys Mini for typing?"
    productId: "k57abc..." # simulates "viewing this product"
    recentlyViewedIds: ["mxkmini..."]
    expectedTools:
      - getProductDetails
      - getRecommendations
    expectedProductIds: # IDs the answer SHOULD reference
      - "k57abc..."
      - "mxkmini..."
    forbiddenTools: [] # tools that MUST NOT fire
    category: comparison
    maxAcceptableToolCalls: 6
  assert:
    # row-specific assertions in addition to defaultTest's
    - type: contains
      value: "MX Keys Mini"
```

target size for v1: **25 rows**, distribution:

| category           | count |
| ------------------ | ----- |
| simple_qa          | 4     |
| product_validation | 4     |
| comparison         | 5     |
| recommendation     | 5     |
| review_summary     | 3     |
| multi_turn         | 3     |
| edge_case          | 1     |

curation rules:

- every `productId` in the dataset must exist in the seeded dev DB
- bumping the dataset means bumping the filename (`shopping-v2.yaml`) so old runs are never compared against new questions
- multi-turn rows use Promptfoo's conversation feature (sequential vars + provider state)
- edge cases include ambiguous phrasing, off-topic requests, empty-result queries

---

## scoring pipeline

same scorers as the previous plan, restructured around Promptfoo's primitives.

### programmatic scorers — custom JS files in `src/scorers/`

| file                     | what it checks                                                                                                                 | mapped from old plan                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| `hasFinalAnswer.ts`      | at least one non-empty `{ type: "text" }` part                                                                                 | `hasFinalAnswer`                         |
| `groundedness.ts`        | every productId cited in the answer exists in Convex `products`                                                                | `groundedness`                           |
| `factuality.ts`          | claimed prices / ratings match the DB snapshot taken at run start                                                              | `factuality`                             |
| `reviewThemeFidelity.ts` | claimed review themes match the embedding-backed review corpus (generalises the validator already in `reviewSummaries.ts:127`) | new — leverages existing infra           |
| `toolCallEfficiency.ts`  | unique-vs-total tool calls + step-budget usage                                                                                 | `toolCallEfficiency` + `stepBudgetUsage` |

### built-in Promptfoo assertions used as-is

| assertion type                                | purpose                                                       | mapped from old plan                          |
| --------------------------------------------- | ------------------------------------------------------------- | --------------------------------------------- |
| `tool-call-f1`                                | F1 of called vs expected tools (per-row `vars.expectedTools`) | `expectedToolCoverage` + `forbiddenToolCheck` |
| `model-graded` (rubric: completeness)         | "does the answer address the user's question? 0-5"            | `completeness`                                |
| `model-graded` (rubric: helpfulness)          | "would a shopper find this actionable? 0-5"                   | `helpfulness`                                 |
| `model-graded` (rubric: tradeoff surfacing)   | "does the answer mention downsides where relevant? 0-5"       | `tradeoffSurfacing`                           |
| `model-graded` (rubric: tone)                 | "does the tone match an honest, non-pushy advisor? 0-5"       | `toneAlignment`                               |
| `model-graded` (rubric: tool-appropriateness) | "given the question, were the right tools called? 0-5"        | `toolAppropriateness`                         |

### judge model selection (bias mitigation)

LLM-as-judge has known position, length, and self-preference biases ([self-preference bias](https://arxiv.org/abs/2410.21819), [position bias study](https://aclanthology.org/2025.ijcnlp-long.18.pdf)). mitigations baked into the config:

- judge with **Claude Haiku 4.5** — different model family from both `gpt-oss` and Gemini, so no candidate model is judging itself
- judge sees only the user question and the assistant's final text — not the reasoning chain (avoids reward-hacking by long thinking)
- when comparing two configurations, randomise option order (Promptfoo's `model-graded` handles this when `provider` is set)
- programmatic scores and judge scores are **reported separately** in the thesis table — never silently averaged

### composite score

emitted by `thesisExport.ts`, not by Promptfoo. Promptfoo's per-assertion scores are already in the JSON; the export script computes:

```
composite =
    0.30 × qualityScore        // avg of LLM-judge scores
  + 0.25 × correctnessScore    // avg of programmatic scorers (binary→0/1)
  + 0.20 × (1 - costPenalty)   // cost vs cheapest run in same dataset
  + 0.15 × (1 - latencyPenalty) // latency vs fastest run
  + 0.10 × efficiencyScore     // tool + step efficiency
```

weights are configurable in `thesisExport.ts` and reported as such in the thesis (so the reader knows the ranking is one defensible choice among many). the pareto front of (cost, quality) and (latency, quality) is reported alongside the composite — never instead of it.

---

## the 9-config first-batch sweep

written directly as the `providers:` section of `promptfooconfig.yaml`. Promptfoo runs the cartesian product of `tests × providers` automatically.

| label               | model                                | reasoning | maxSteps | prompt variant        |
| ------------------- | ------------------------------------ | --------- | -------- | --------------------- |
| baseline-flash-lite | google/gemini-3.1-flash-lite-preview | n/a       | 12       | current               |
| gpt-oss-120b-low    | openai/gpt-oss-120b                  | low       | 12       | current               |
| gpt-oss-120b-medium | openai/gpt-oss-120b                  | medium    | 12       | current               |
| gpt-oss-120b-high   | openai/gpt-oss-120b                  | high      | 12       | current               |
| gpt-oss-20b-low     | openai/gpt-oss-20b                   | low       | 12       | current               |
| gpt-oss-20b-medium  | openai/gpt-oss-20b                   | medium    | 12       | current               |
| oss-120b-tight      | openai/gpt-oss-120b                  | medium    | 8        | "be efficient" prompt |
| oss-120b-loose      | openai/gpt-oss-120b                  | medium    | 15       | current               |
| oss-120b-no-fewshot | openai/gpt-oss-120b                  | medium    | 12       | no few-shot           |

9 configs × 25 rows = **225 advisor calls per sweep + 225 × 5 ≈ 1,125 judge calls**. at OpenRouter's gpt-oss prices (Cerebras tier) and Haiku 4.5's judge cost, a full sweep is well under $5.

---

## storage

not Convex tables. just files.

- **datasets:** YAML in `packages/eval/src/datasets/`, versioned in git
- **results:** JSON in `packages/eval/results/<timestamp>-<sweep-label>.json`, gitignored. one file per `promptfoo eval` invocation. each file contains the full `parts`, `usage`, `timings`, `dbSnapshot`, and per-assertion scores for every (row × provider) cell
- **DB snapshots:** captured by the `runOnce` Convex action at the moment each row begins, returned in the result blob. lets `factuality.ts` work later, even if catalogue prices change between runs
- **eval threads:** persisted in Convex with `isEval: true` flag, queryable for ad-hoc transcript review without polluting normal queries

reasoning: results are append-only, write-once, read-rarely (mostly by `thesisExport.ts` and `promptfoo view`). Convex tables would add roundtrips and admin UI for no value.

---

## thesis dashboard (replaces the planned admin webapp)

three layers, none of which is "an admin route in the Next.js app":

1. **`promptfoo view`** — built-in local web UI on `localhost:15500`. table view of every (row × provider) cell, sortable, filterable, with click-to-expand for the full transcript. used during development and prompt iteration. zero engineering cost.

2. **`bun --filter @zalem/eval eval:export`** — runs `thesisExport.ts`, which reads the latest results JSON and writes to `thesis/figures/`:
   - `eval-ranked-configs.tex` — LaTeX `tabular` of the 9 configs ranked by composite, with cost, latency p95, quality, correctness columns
   - `eval-pareto-cost-quality.pdf` — scatter plot rendered with `recharts` → headless chrome → PDF
   - `eval-pareto-latency-quality.pdf` — same pattern
   - `eval-per-category.tex` — breakdown of correctness by question category

3. **`promptfoo eval --output html`** — generates a self-contained HTML report that can be linked to from the thesis appendix or shared with a supervisor for review

if at any point the user study or the supervisor needs a richer dashboard with team access, **self-hosted Langfuse** (Docker, MIT) is the drop-in upgrade — Promptfoo can publish traces to Langfuse and Langfuse handles persistence, comparison views, and shareable links. this is deferred to "future extensions" and is not on the v1 critical path.

---

## implementation plan (phased)

### phase 8.1 — workspace scaffolding

- `packages/eval/` workspace with `package.json`, `tsconfig.json`, scripts
- `promptfooconfig.yaml` skeleton with one provider (gpt-oss-120b-medium) for smoke testing
- `src/providers/advisorProvider.ts` skeleton
- `src/lib/convexClient.ts` shared client
- `README.md` with run instructions

**deliverable:** `bun --filter @zalem/eval eval` runs against a single hardcoded test row and prints output. no scoring yet.

### phase 8.2 — eval-only Convex action

- `packages/backend/convex/ai/evals/runOnce.ts` — non-streaming, auth-bypass-via-env-secret variant of `requestAdvice` that accepts the per-run config and returns the full result blob
- `isEval: true` flag added to thread metadata
- DB snapshot helper that returns `{ [productId]: { price, rating } }` for any product set
- `advisorProvider.ts` wired to call this action

**deliverable:** the provider returns real Convex agent output to Promptfoo, captured into the JSON result.

### phase 8.3 — programmatic scorers + dataset v1

- 25-row `shopping-v1.yaml`
- 5 custom scorers (`hasFinalAnswer`, `groundedness`, `factuality`, `reviewThemeFidelity`, `toolCallEfficiency`)
- built-in `tool-call-f1` wired to `vars.expectedTools`
- `defaultTest` block applying all scorers to every row

**deliverable:** `eval:sweep` (still single-config) returns full programmatic scores. catches the maxSteps-cutoff bug class automatically.

### phase 8.4 — LLM judges + 9-config sweep

- 5 model-graded rubrics in YAML, judge = Claude Haiku 4.5
- `providers:` matrix expanded to all 9 configs from the sweep table
- a smoke run completes within 5 minutes and stays under $5

**deliverable:** ranked table, exported to JSON, ready for analysis.

### phase 8.5 — thesis export

- `reports/thesisExport.ts` — reads latest JSON, emits LaTeX tables + pareto PDFs into `thesis/figures/`
- `thesis/chapters/chapter7_results.tex` includes the generated tables/figures
- a `make eval-thesis` (or bun script) regenerates everything end-to-end

**deliverable:** running one command produces every eval-derived artifact in the thesis.

### phase 8.6 — optional: Langfuse layer

deferred. only if a richer dashboard or trace storage becomes necessary.

---

## how this fits the thesis

unchanged in spirit from the previous plan. the pitch is now slightly different:

- **chapter 4 (system design):** reference the eval harness as a design-validation tool. justify the choice of Promptfoo + custom scorers vs rolling our own (literature awareness, focus on novel contribution).
- **chapter 5 (implementation):** dedicate a subsection to the harness. emphasise the **custom shopping-domain scorers** (groundedness against live Convex, factuality vs DB snapshot, embedding-based theme fidelity). these are the original engineering contribution.
- **chapter 6 (evaluation methodology):** describe the dataset curation rules, the multi-grader approach (programmatic + LLM-judge), and the bias-mitigation choices (cross-family judge, separated reporting). cite the position-bias and self-preference-bias literature.
- **chapter 7 (results):** include the pareto plots and the ranked config table generated by `thesisExport.ts`. discuss which configuration we ended up shipping and why.
- **chapter 8 (discussion):** discuss the limits of the harness — small dataset, judge biases, seeded-data limitations — and where the user study results complemented or contradicted it.

framing the eval contribution as "domain-specific scorers on top of an OSS framework" is **stronger**, not weaker, than "we built our own framework." it shows the student knows the tooling landscape and can identify where original work belongs.

---

## relationship to the user study

unchanged. the harness measures system properties (correctness, cost, latency, judge-perceived quality). the user study measures human properties (trust, intrusiveness, control). both are needed; the harness lets us pick the best configuration objectively before spending user-study time on it.

---

## validity threats specific to the harness

- **dataset size is small** — 25 questions can't cover every failure mode. mitigate by reporting per-category breakdowns and growing the dataset over time
- **LLM-judges have known biases** — mitigated by cross-family judge selection, randomised option order (built into Promptfoo's `model-graded`), and separated reporting of programmatic vs judge scores
- **seeded catalogue is small** — mitigate by noting this in chapter 8 and including hard-lookup edge cases in the dataset
- **judge cost is not zero** — included in the cost column of every result row so reported "cost per run" reflects real operating cost
- **the runner replicates production code paths but does not replicate user behavior** — the user study fills that gap; the harness explicitly does not claim to predict UX outcomes

---

## status

**not started.** this document describes the target. see `docs/PLAN.md` phase 8 for progress tracking.

scaffolding lives at `packages/eval/`. the first thing to wire up is `phase 8.1` — getting one row through `advisorProvider.ts` against the existing dev Convex deployment. everything else builds on that foundation.
