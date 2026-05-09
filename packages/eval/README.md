# @zalem/eval

LLM evaluation harness for the zalem shopping advisor. Promptfoo runner +
custom Convex-aware scorers. see `docs/eval-system-plan.md` for the full
architecture.

## tldr

```bash
# from monorepo root
bun install                                  # picks up promptfoo as a devDep
bun --filter @zalem/eval eval                # one-off, default config
bun --filter @zalem/eval eval:sweep          # full sweep, bypasses cache
bun --filter @zalem/eval eval:view           # local web UI on :15500
bun --filter @zalem/eval eval:export         # LaTeX tables → thesis/figures/
```

## what this package is

a thin layer on top of [Promptfoo](https://promptfoo.dev) that:

- declares the 9-config sweep matrix in `promptfooconfig.yaml`
- provides a custom JS provider (`src/providers/advisorProvider.ts`) that
  calls the real Convex `shoppingAdvisor` agent through a dedicated
  eval-only action (`ai.evals.runOnce` — to be added in phase 8.2)
- ships shopping-domain scorers in `src/scorers/`:
  - `hasFinalAnswer.ts` — non-empty text part exists
  - `groundedness.ts` — every cited productId exists in Convex
  - `factuality.ts` — claimed prices/ratings match the DB snapshot
  - `reviewThemeFidelity.ts` — claimed review themes match the corpus
  - `toolCallEfficiency.ts` — duplicate-call + step-budget scoring
- defines the YAML dataset in `src/datasets/shopping-v1.yaml`

## why Promptfoo

short version: it's the runner, dataset manager, and dashboard, all
free / MIT / local. our actual contribution lives in the scorers and
the dataset, not in the test infrastructure. see
`docs/eval-system-plan.md` § "what is Promptfoo".

## env vars required

create `packages/eval/.env`:

```
CONVEX_EVAL_URL=https://<your-eval-deployment>.convex.cloud
CONVEX_EVAL_SECRET=<random shared secret — must match the env on Convex>
OPENROUTER_API_KEY=<inherited by the Convex deployment>
ANTHROPIC_API_KEY=<for the Claude Haiku 4.5 judge — phase 8.4>
```

never point `CONVEX_EVAL_URL` at production. eval threads are flagged
`isEval: true` and filtered out of normal queries, but the eval also
runs real LLM calls and burns real OpenRouter credits.

## directory map

```
packages/eval/
├── promptfooconfig.yaml          # the only Promptfoo config
├── src/
│   ├── providers/advisorProvider.ts   # the agent shim
│   ├── scorers/*.ts                   # 5 custom scorers
│   ├── datasets/shopping-v1.yaml      # 25-row dataset (4 seeded so far)
│   ├── lib/                            # shared Convex client + helpers
│   └── reports/thesisExport.ts        # JSON → LaTeX/PDF
├── scripts/                            # bash wrappers around the bun scripts
└── results/                            # gitignored — JSON output per run
```

## status

phase 8.1 scaffolding only. the provider is a stub until phase 8.2 lands
the `ai.evals.runOnce` Convex action. the scorers compile and run but
the data they grade is `[stub]`. follow the TODO comments in each file
for what to wire next.
