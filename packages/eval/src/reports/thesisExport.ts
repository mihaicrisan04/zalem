// reads packages/eval/results/latest.json and emits LaTeX tables + pareto
// plots into thesis/figures/. invoked via:
//   bun --filter @zalem/eval eval:export
//
// outputs (deferred to phase 8.5):
//   - thesis/figures/eval-ranked-configs.tex
//   - thesis/figures/eval-pareto-cost-quality.pdf
//   - thesis/figures/eval-pareto-latency-quality.pdf
//   - thesis/figures/eval-per-category.tex
//
// the composite-score weights live here, NOT in promptfooconfig.yaml, so
// they can be tweaked and re-rendered without re-running the sweep.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

const COMPOSITE_WEIGHTS = {
  quality: 0.3,
  correctness: 0.25,
  cost: 0.2,
  latency: 0.15,
  efficiency: 0.1,
};

const RESULTS_PATH = resolve(here, "../../results/latest.json");

function main() {
  const raw = readFileSync(RESULTS_PATH, "utf8");
  const results = JSON.parse(raw) as unknown;

  // TODO(phase-8.5):
  //   1. parse Promptfoo results JSON (results.results[].vars + .gradingResult)
  //   2. for each provider, aggregate per-row scores into:
  //        qualityScore     = avg of llm-rubric / model-graded scores
  //        correctnessScore = avg of programmatic scorer scores (binary→0/1)
  //        avgCostUsd       = sum of tokenUsage × per-model price
  //        p95LatencyMs     = p95 of metadata.timings.totalMs
  //        efficiencyScore  = avg of toolCallEfficiency
  //   3. compute composite per provider with COMPOSITE_WEIGHTS
  //   4. emit LaTeX `tabular` ranked by composite
  //   5. emit pareto-front PDFs (recharts → headless chrome → PDF, OR
  //      a simple python plot via uv-managed env if we want to add that
  //      later — but keep node-only for v1)

  console.log("results loaded; export not implemented yet");
  void results;
  void COMPOSITE_WEIGHTS;
}

main();
