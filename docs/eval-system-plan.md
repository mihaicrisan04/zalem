# custom eval system plan

a purpose-built evaluation harness for measuring and comparing LLM configurations in the `zalem` advisor. the goal is to turn model selection, prompt design, and parameter tuning into a data-driven process instead of vibes — and to produce thesis-quality evidence at the same time.

---

## motivation

the advisor has many moving parts that all affect quality, latency, and cost:

- **model choice** — gpt-oss-120b vs gpt-oss-20b vs gemini-3-flash vs gemini-3.1-flash-lite
- **reasoning effort** — none / low / medium / high
- **step budget** — `maxSteps` 5 / 10 / 12 / 15
- **system prompt variants** — current / terse / no few-shots / "avoid redundant tool calls"
- **provider routing** — cerebras vs groq vs auto
- **tool set** — which tools are exposed

right now these are chosen by intuition and by patching bugs as they appear — e.g. we bumped `maxSteps` from 5 → 12 after seeing the agent get cut off mid-turn. that worked, but it was a reactive fix, not a measured decision. for a thesis, every such choice needs to be defended with numbers.

this document describes a small, self-contained eval harness that runs inside the zalem Convex backend, stores results in the same database, and exposes a dashboard for ranking runs.

---

## goals

the eval system must answer four questions about any given configuration:

1. **is it correct?** — does the assistant produce a grounded, complete final answer?
2. **is it efficient?** — how many tokens, tool calls, and steps did it take?
3. **is it fast?** — what is the end-to-end and time-to-first-content latency?
4. **is it cheap?** — what does a run cost in real dollars across input / output / reasoning tokens?

secondary goals:

- enable side-by-side comparison of any two configurations
- produce a pareto front of (quality, cost) and (quality, latency)
- generate tables that drop straight into the thesis results chapter
- surface regressions when the system prompt or model is changed

explicit non-goals:

- not a general-purpose eval framework — we only care about the advisor shopping use case
- not a replacement for the small user study — human evaluation still matters for trust/intrusiveness
- not a CI gate — runs are triggered manually, not on every commit

---

## architecture overview

```
┌───────────────────────────────────────────────────────────────┐
│                      eval dataset                             │
│  ~20-30 curated shopping questions with expected behavior     │
│  tags (tools that should fire, product IDs that should be     │
│  cited, categories that should be mentioned).                 │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌───────────────────────────────────────────────────────────────┐
│                      eval runner                              │
│  a Convex action that takes a config { modelId, reasoning,    │
│  maxSteps, promptVariant, provider } and streams every        │
│  dataset question through a fresh throwaway thread.           │
│                                                               │
│  for each question it captures:                               │
│   - all message parts (text + tool calls + reasoning)         │
│   - token usage breakdown (input / output / reasoning)        │
│   - timing (start → first delta → last delta → finish)       │
│   - finishReason + whether a text part was produced           │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌───────────────────────────────────────────────────────────────┐
│                      scoring pipeline                         │
│                                                               │
│  programmatic scorers (no LLM cost):                          │
│   - hasFinalAnswer: is there a non-empty text part?           │
│   - groundedness: do cited productIds exist in Convex?        │
│   - factuality: do cited prices/ratings match DB snapshots?   │
│   - toolCallEfficiency: dup calls, unused results             │
│   - stepBudgetUsage: how close to maxSteps                    │
│                                                               │
│  LLM-as-judge scorers (small, cheap model):                   │
│   - completeness: does the answer address the question?      │
│   - helpfulness: would a shopper find this actionable?       │
│   - tradeoff surfacing: are downsides mentioned when relevant?│
│   - tool appropriateness: were the right tools called?       │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌───────────────────────────────────────────────────────────────┐
│                      result storage                           │
│  evalRuns (config + aggregate scores + totals)                │
│  evalRunResults (per-question details)                        │
│  evalDatasets (versioned question sets)                       │
└────────────────────────────┬──────────────────────────────────┘
                             │
                             ▼
┌───────────────────────────────────────────────────────────────┐
│                      eval dashboard                           │
│  admin-only Next.js page at /admin/evals                      │
│   - run list, sortable by composite / cost / latency / quality│
│   - per-run detail with side-by-side question table          │
│   - pareto charts (cost vs quality, latency vs quality)      │
│   - diff view between any two runs                           │
│   - CSV / JSON export for the thesis                         │
└───────────────────────────────────────────────────────────────┘
```

---

## dataset design

the dataset lives in `packages/backend/convex/ai/evals/dataset.ts` as a versioned, hand-curated array of question specs. each spec has:

```ts
type EvalQuestion = {
  id: string; // stable slug, e.g. "compare-keyboards-01"
  category:
    | "simple_qa" // "What's the price of this keyboard?"
    | "product_validation" // "Is this product worth it?"
    | "comparison" // "How do these two phones compare?"
    | "recommendation" // "What laptop should I buy for coding?"
    | "review_summary" // "What do buyers think about this?"
    | "multi_turn" // 2-3 turn conversation
    | "edge_case"; // ambiguous / off-topic / empty catalog
  turns: Array<{
    role: "user";
    text: string;
    productId?: string; // simulates product-page context
  }>;
  expectations: {
    shouldCallTools?: string[]; // tool names that MUST appear
    shouldMentionProductIds?: string[]; // expected cited products
    shouldAvoidTools?: string[]; // tools that should NOT fire
    mustHaveFinalAnswer: true; // no config is allowed to skip the text
    maxAcceptableToolCalls?: number; // efficiency bar
  };
};
```

target size for phase 1: **25 questions**, with this distribution:

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

- each question references seeded products that actually exist in the dev database
- questions should be realistic — taken from the hardcoded suggestion chips and the few-shot examples as a starting point
- edge cases include ambiguous phrasing, off-topic requests, and empty-result queries
- the dataset is versioned — changing it bumps a `datasetVersion` field so old runs aren't compared against new questions

---

## the runner

the runner is a Convex action at `packages/backend/convex/ai/evals/runner.ts`:

```ts
export const runEval = action({
  args: {
    datasetVersion: v.string(),
    config: v.object({
      modelId: v.string(),
      reasoningEffort: v.union(v.literal("none"), v.literal("low"), v.literal("medium"), v.literal("high")),
      maxSteps: v.number(),
      providerOrder: v.optional(v.array(v.string())),
      promptVariant: v.string(),   // "current" | "terse" | "no-few-shot" | ...
    }),
    label: v.optional(v.string()), // human-readable tag for the dashboard
  },
  handler: async (ctx, args) => { ... },
});
```

for each question in the dataset the runner:

1. creates a throwaway thread (`shoppingAdvisor.createThread`) — isolated from real users
2. if the question has `productId`, injects it into the system context exactly like the advisor does in `requestAdvice`
3. calls `thread.streamText` with the configured model/reasoning/maxSteps
4. captures the full event stream: `onStepFinish`, `onChunk`, timing, token usage from `result.usage`
5. after consumeStream, reads back the stored message parts from the thread
6. runs the scoring pipeline
7. writes one row to `evalRunResults`
8. (optional) deletes the throwaway thread or marks it `isEval: true` so queries can filter it out

key points:

- the runner reuses the existing `selectModel()` factory but with an overridden `openrouter()` call that takes the per-run config (so we don't have to rebuild the whole agent on every run)
- runs happen sequentially to avoid rate limits and to make cost attribution clean
- the entire dataset run for one config takes roughly `25 × avg_turn_duration` — at gpt-oss-120b speeds that's maybe 2-5 minutes per full run
- the runner publishes progress to the dashboard via Convex reactivity (no polling needed)

---

## scoring pipeline

scorers live in `packages/backend/convex/ai/evals/scorers/` and each is a pure function with the signature:

```ts
type Scorer = (args: {
  question: EvalQuestion;
  messageParts: Array<MessagePart>;
  usage: TokenUsage;
  timing: Timing;
}) => Promise<{ score: number; notes?: string }>;
```

### programmatic scorers (free, fast, deterministic)

| scorer                 | what it checks                                                               | failing means                   |
| ---------------------- | ---------------------------------------------------------------------------- | ------------------------------- |
| `hasFinalAnswer`       | there is at least one non-empty `{ type: "text" }` part                      | catches the maxSteps-cutoff bug |
| `groundedness`         | every product ID cited in the answer exists in the Convex `products` table   | catches hallucinated IDs        |
| `factuality`           | prices / ratings in the answer match the DB snapshot taken at runtime        | catches fabricated numbers      |
| `expectedToolCoverage` | `expectations.shouldCallTools ⊆ actual tools called`                         | catches missed lookups          |
| `forbiddenToolCheck`   | `expectations.shouldAvoidTools ∩ actual tools called === ∅`                  | catches needless calls          |
| `toolCallEfficiency`   | ratio of unique tool calls to total; penalizes duplicates                    | catches the over-eager bug      |
| `stepBudgetUsage`      | `steps / maxSteps` — warns when close to the limit                           | catches near-misses             |
| `reasoningRatio`       | `reasoning_tokens / (output_tokens + reasoning_tokens)` — purely informative | n/a, just tracked               |

### LLM-as-judge scorers (uses a cheap model, e.g. `gemini-3.1-flash-lite` with `effort: "none"`)

| scorer                | judge prompt asks                                                       |
| --------------------- | ----------------------------------------------------------------------- |
| `completeness`        | "does the answer address the user's question? score 0-5"                |
| `helpfulness`         | "would a shopper find this actionable enough to make a decision? 0-5"   |
| `tradeoffSurfacing`   | "does the answer mention downsides or alternatives where relevant? 0-5" |
| `toolAppropriateness` | "given the question, were the right tools called, and no more? 0-5"     |
| `toneAlignment`       | "does the tone match an honest, non-pushy shopping advisor? 0-5"        |

each judge call runs with the cheapest lite model available, isolated from the main advisor (different thread, different system prompt). the judge only sees the user question and the assistant's final text — not the reasoning chain, to avoid reward hacking.

### composite score

the dashboard aggregates into a single number per run so runs can be ranked:

```
composite =
    0.30 × qualityScore        // avg of LLM judges
  + 0.25 × correctnessScore    // avg of programmatic scorers
  + 0.20 × (1 - costPenalty)   // cost vs best run in same dataset
  + 0.15 × (1 - latencyPenalty) // latency vs best run
  + 0.10 × efficiencyScore     // tool + step efficiency
```

the weights are configurable from the dashboard — the numbers above are a starting point, not gospel. the thesis will report the pareto front too, not just the composite, because aggregating away tradeoffs is exactly what this project is trying to avoid.

---

## storage

three new Convex tables, all kept in `packages/backend/convex/ai/evals/schema.ts` and imported into the main schema:

### `evalDatasets`

```
{
  version: string,          // "2026-04-09-a"
  questions: EvalQuestion[],
  createdAt: number,
  note?: string,
}
```

### `evalRuns`

```
{
  datasetVersion: string,
  config: { modelId, reasoningEffort, maxSteps, providerOrder, promptVariant },
  label?: string,
  startedAt: number,
  finishedAt?: number,
  status: "pending" | "running" | "done" | "failed",
  totals: {
    questions: number,
    passed: number,
    failed: number,
    avgLatencyMs: number,
    p95LatencyMs: number,
    avgCostUsd: number,
    totalCostUsd: number,
    avgCompositeScore: number,
  },
  createdBy: string,        // Clerk userId
}
```

### `evalRunResults`

one row per (run, question):

```
{
  runId: Id<"evalRuns">,
  questionId: string,
  messageParts: any,                  // full captured parts array
  usage: { input, output, reasoning, total },
  timing: { startedAt, firstDeltaAt, finishedAt, ttftMs, totalMs },
  scores: {
    hasFinalAnswer: 0 | 1,
    groundedness: number,
    factuality: number,
    expectedToolCoverage: number,
    forbiddenToolCheck: number,
    toolCallEfficiency: number,
    stepBudgetUsage: number,
    reasoningRatio: number,
    completeness: number,
    helpfulness: number,
    tradeoffSurfacing: number,
    toolAppropriateness: number,
    toneAlignment: number,
    composite: number,
  },
  costUsd: number,
  stepsUsed: number,
  toolCallsMade: number,
  finalTextLength: number,
  finishReason: string,
}
```

indexes:

- `evalRunResults` by `runId` + `questionId`
- `evalRuns` by `datasetVersion` + `finishedAt`

---

## dashboard (admin-only)

a new admin surface under `/admin/evals` in the web app. not linked from the main nav — accessed directly or via a thesis utility menu. guarded by a hardcoded list of admin Clerk IDs for simplicity.

### screens

1. **run list** — table of `evalRuns` sorted by composite, filterable by model / prompt variant / dataset version. columns: label, model, config summary, composite, avg cost, p95 latency, finished at.
2. **run detail** — config summary + totals + expandable per-question table showing the full message parts, scores, timing, and cost for each question.
3. **compare two runs** — side-by-side view of any two runs, question by question. highlights score deltas.
4. **pareto chart** — scatter of cost vs composite, latency vs composite, with runs as points and a tooltip showing config. uses `recharts` (already installed in `@zalem/ui`).
5. **export** — CSV and JSON download of any selected set of runs, for copy-pasting into the thesis.

### "trigger a run" form

a small form at the top of the dashboard that takes the config and kicks off a `runEval` action. shows live progress via Convex reactivity (question N of 25, current composite so far, estimated time remaining).

---

## configurations worth comparing (first batch)

the first eval sweep should produce a table like this in the thesis results chapter. planned first-batch configurations:

| label               | model                         | reasoning | maxSteps | prompt variant        |
| ------------------- | ----------------------------- | --------- | -------- | --------------------- |
| baseline-flash      | google/gemini-3-flash-preview | n/a       | 12       | current               |
| gpt-oss-120b-med    | openai/gpt-oss-120b           | medium    | 12       | current               |
| gpt-oss-120b-low    | openai/gpt-oss-120b           | low       | 12       | current               |
| gpt-oss-120b-high   | openai/gpt-oss-120b           | high      | 12       | current               |
| gpt-oss-20b-med     | openai/gpt-oss-20b            | medium    | 12       | current               |
| gpt-oss-20b-low     | openai/gpt-oss-20b            | low       | 12       | current               |
| oss-120b-tight      | openai/gpt-oss-120b           | medium    | 8        | "be efficient" prompt |
| oss-120b-loose      | openai/gpt-oss-120b           | medium    | 15       | current               |
| oss-120b-no-fewshot | openai/gpt-oss-120b           | medium    | 12       | no few-shot           |

that's 9 runs × 25 questions = ~225 API calls per sweep. at gpt-oss-120b prices that's well under a dollar per sweep.

the thesis can then report:

- which model gives the best composite
- how much quality you lose by dropping from medium to low reasoning
- whether the "be efficient" prompt variant reduces tool call count without hurting quality
- where each config sits on the cost / quality pareto front

---

## implementation plan (phased)

### phase 1 — minimum viable harness

- `evalQuestion` type + 25 hand-written questions
- `evalRuns` / `evalRunResults` / `evalDatasets` schema
- `runEval` action that loops questions and captures parts/usage/timing
- 5 programmatic scorers (hasFinalAnswer, groundedness, factuality, expectedToolCoverage, stepBudgetUsage)
- composite score computation
- a bare-bones admin page that lists runs and shows per-run details in a `<pre>` block

this alone already catches the bug class we hit (maxSteps cutoff) automatically, on any future config change.

### phase 2 — LLM judges + dashboard polish

- add the 5 LLM-as-judge scorers with a cheap model
- proper dashboard tables with sorting and filtering
- run-to-run comparison view
- cost + latency pareto charts via `recharts`

### phase 3 — thesis-ready presentation

- CSV / JSON export
- result tables formatted for the thesis results chapter
- a "canonical sweep" script that runs the first-batch configurations in one go and saves the results with a known label
- validity notes: small dataset size, judge model biases, seeded-data limitations

---

## how this fits the thesis

the eval harness is both an engineering contribution and the backbone of the thesis evaluation chapter.

- **chapter 4 (system design)** — reference the eval harness as a design-validation tool. explain why we need it: to defend model/prompt/parameter choices with numbers.
- **chapter 5 (implementation)** — dedicate a subsection to the harness. describe the dataset, the runner, the scoring pipeline, the dashboard.
- **chapter 6 (evaluation methodology)** — the harness provides the entire "system evaluation" layer. the results it produces feed directly into section 6.2 and populate the latency/cost/quality tables.
- **chapter 7 (results)** — include the pareto plots and the ranked config table. discuss which configuration we ended up shipping and why.
- **chapter 8 (discussion)** — discuss the limits of programmatic and LLM-judged evaluation, and where user study results complemented or contradicted the harness.

this is what separates the thesis from "an e-commerce app with AI": the app is the artifact, the eval harness is the measurement instrument, and the thesis argument is grounded in numbers the harness produced.

---

## relationship to the user study

the custom eval system does NOT replace the small user study described in `docs/bachelor-thesis/evaluation-plan.md`. the two serve different purposes:

| aspect         | custom eval harness                                   | user study                                        |
| -------------- | ----------------------------------------------------- | ------------------------------------------------- |
| scope          | model and prompt quality                              | human perception of trust, intrusiveness, control |
| method         | programmatic + LLM-as-judge scoring                   | Likert questionnaire + tasks                      |
| participants   | none (automated)                                      | 8–15 real users                                   |
| thesis chapter | 6.2 system evaluation                                 | 6.3 user evaluation                               |
| cost           | dollars per sweep                                     | researcher time                                   |
| what it proves | the system is efficient and produces grounded answers | the system is useful and not intrusive to humans  |

both are needed. the eval harness lets you pick the best configuration objectively before spending user-study participant time on it.

---

## validity threats specific to the harness

- **dataset size is small** — 25 questions can't cover every failure mode. mitigate by reporting per-category breakdowns and by growing the dataset over time.
- **LLM-as-judge has known biases** — judges prefer longer / more confident answers, and often favor outputs from the same model family. mitigate by using a judge that's different from every candidate model, and by reporting programmatic scores separately.
- **seeded dataset** — catalog is small and synthetic. mitigate by noting this in the discussion chapter and by including a few "hard lookup" questions that exercise edge cases.
- **judge cost is not zero** — every sweep pays for judge tokens too. budget it in the cost reporting so the cost column of the harness output reflects real operating cost.

---

## status

**not started.** this document describes the target. see `docs/PLAN.md` phase 8 for progress tracking.

the nearest related existing code is `packages/backend/convex/ai/advisor.ts` (streaming action to reuse for per-question runs) and `packages/backend/convex/ai/models.ts` (model factory to parameterize per run).
