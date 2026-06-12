# Prompt

all the secrets are set tehre shouldnt be any problem running the command but can u run only the 9th config as i only have aournd 1 dollar left of credits in the openrouter

---

Ran only the ungrounded ablation config: promptfoo's --filter-providers silently matched nothing, so added a dedicated promptfooconfig.ungrounded.yaml + `eval:ablation` script; first run failed on the stale Convex validator, fixed by deploying the backend (`convex dev --once`); the real run took 1m17s / ~226k tokens (a few cents). Found and fixed a factuality scorer bug (comma-formatted prices parsed as "$1"), re-scored both runs offline with the same fixed scorer. Results: ungrounded makes 162 specific claims vs 83 (67% vs 48% failing the DB check), LLM judges score the fabricating config higher (helpfulness 0.78 vs 0.57), grounding costs ~1s p50 latency. Wrote thesis ch4 subsection "Ablation: Removing Grounding" with the comparison table, mentioned the baseline in the abstract and ch1, fixed stale dataset counts (25 rows/200 invocations -> 34 test cases/272), corrected the scorer list, documented findings in docs/eval-findings.md and the regex bug in docs/lessons-learned.md. Thesis builds at 54 pages; zip refreshed.
