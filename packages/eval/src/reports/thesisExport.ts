// reads packages/eval/results/latest.json and emits thesis-ready artefacts
// into thesis/figures/. invoked via:
//   bun --filter @zalem/eval eval:export
//
// outputs:
//   thesis/figures/eval-ranked-configs.tex     LaTeX tabular, ranked by composite
//   thesis/figures/eval-pareto-cost-quality.csv     pgfplots data (cost, quality)
//   thesis/figures/eval-pareto-cost-quality.tex     pgfplots scatter snippet
//   thesis/figures/eval-pareto-latency-quality.csv  pgfplots data (latency, quality)
//   thesis/figures/eval-pareto-latency-quality.tex  pgfplots scatter snippet
//   thesis/figures/eval-per-category.tex            programmatic-correctness by category
//
// composite-score weights live HERE, not in promptfooconfig.yaml, so they can
// be tweaked and re-rendered without re-running the sweep.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const RESULTS_PATH = resolve(here, "../../results/latest.json");
const FIGURES_DIR = resolve(here, "../../../../thesis/figures");

const COMPOSITE_WEIGHTS = {
  quality: 0.3,
  correctness: 0.25,
  cost: 0.2,
  latency: 0.15,
  efficiency: 0.1,
};

// per-1M-token OpenRouter prices (rough; update as pricing changes).
// used only when the result row doesn't carry a `cost` field already.
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  "openai/gpt-oss-120b": { input: 0.15, output: 0.6 },
  "openai/gpt-oss-20b": { input: 0.1, output: 0.5 },
  "google/gemini-3.1-flash-lite-preview": { input: 0.1, output: 0.4 },
  "google/gemini-3-flash": { input: 0.5, output: 3.0 },
  "anthropic/claude-haiku-4-5": { input: 1.0, output: 5.0 },
};

type ProviderConfig = {
  modelId: string;
  reasoningEffort: string;
  maxSteps: number;
  promptVariant: string;
  providerOrder?: string[];
};

type ResultRow = {
  success: boolean;
  error?: string;
  latencyMs?: number;
  cost?: number;
  response?: {
    output?: string;
    metadata?: {
      providerConfig?: ProviderConfig;
      usage?: { input: number; output: number; reasoning: number; total: number };
      stepsUsed?: number;
    };
  };
  testCase?: {
    description?: string;
    vars?: { category?: string };
  };
  gradingResult?: {
    componentResults?: Array<{
      assertion?: { type?: string; metric?: string; value?: unknown };
      pass: boolean;
      score: number;
      reason?: string;
    }>;
  };
};

function configKey(c: ProviderConfig): string {
  return `${c.modelId.split("/").pop()}|${c.reasoningEffort}|ms${c.maxSteps}|${c.promptVariant}`;
}

function configLabel(c: ProviderConfig): string {
  const short = c.modelId.split("/").pop() ?? c.modelId;
  return `${short} · ${c.reasoningEffort} · ms${c.maxSteps} · ${c.promptVariant}`;
}

function p95(xs: number[]): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const idx = Math.ceil(sorted.length * 0.95) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))] ?? 0;
}

function mean(xs: number[]): number {
  return xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length;
}

function rowCost(r: ResultRow): number {
  if (typeof r.cost === "number" && r.cost > 0) return r.cost;
  const usage = r.response?.metadata?.usage;
  const modelId = r.response?.metadata?.providerConfig?.modelId;
  if (!usage || !modelId) return 0;
  const price = MODEL_PRICING[modelId];
  if (!price) return 0;
  return (usage.input * price.input + usage.output * price.output) / 1_000_000;
}

type ProviderAgg = {
  key: string;
  label: string;
  config: ProviderConfig;
  rows: ResultRow[];
  succeededRows: number;
  qualityScore: number;
  correctnessScore: number;
  efficiencyScore: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  totalCostUsd: number;
  avgCostUsd: number;
  composite: number;
  perCategoryCorrectness: Record<string, number>;
};

function aggregate(results: ResultRow[]): ProviderAgg[] {
  const buckets = new Map<string, { config: ProviderConfig; rows: ResultRow[] }>();
  for (const r of results) {
    const cfg = r.response?.metadata?.providerConfig;
    if (!cfg) continue;
    const key = configKey(cfg);
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { config: cfg, rows: [] };
      buckets.set(key, bucket);
    }
    bucket.rows.push(r);
  }

  const aggs: ProviderAgg[] = [];
  for (const { config, rows } of buckets.values()) {
    const succeededRows = rows.filter((r) => !r.error && r.response?.output).length;

    const qualityScores: number[] = [];
    const correctnessScores: number[] = [];
    const efficiencyScores: number[] = [];

    for (const r of rows) {
      const comps = r.gradingResult?.componentResults ?? [];
      for (const c of comps) {
        const isJudge = c.assertion?.type === "llm-rubric";
        const isEfficiency =
          typeof c.reason === "string" &&
          (c.reason.startsWith("F1=") ||
            c.reason.includes("dedupeRatio") ||
            c.reason.includes("vacuously efficient") ||
            c.reason.includes("no tools expected"));
        if (isJudge) qualityScores.push(c.score);
        else if (isEfficiency) efficiencyScores.push(c.score);
        else correctnessScores.push(c.score);
      }
    }

    const latencies = rows
      .map((r) => r.latencyMs ?? r.response?.metadata?.usage)
      .filter((x): x is number => typeof x === "number");
    // fall back to wall-clock latency from metadata if Promptfoo's latencyMs is absent
    const latenciesMs = rows
      .map((r) => r.latencyMs)
      .filter((x): x is number => typeof x === "number");

    const costs = rows.map(rowCost);
    const totalCostUsd = costs.reduce((a, b) => a + b, 0);

    const perCategoryCorrectness: Record<string, { sum: number; n: number }> = {};
    for (const r of rows) {
      const cat = r.testCase?.vars?.category ?? "unknown";
      const comps = r.gradingResult?.componentResults ?? [];
      const programmatic = comps.filter(
        (c) =>
          c.assertion?.type !== "llm-rubric" &&
          !(typeof c.reason === "string" && c.reason.startsWith("F1=")),
      );
      const score = mean(programmatic.map((c) => c.score));
      const bucket = perCategoryCorrectness[cat] ?? { sum: 0, n: 0 };
      bucket.sum += score;
      bucket.n += 1;
      perCategoryCorrectness[cat] = bucket;
    }
    const perCategoryFinal: Record<string, number> = {};
    for (const [cat, { sum, n }] of Object.entries(perCategoryCorrectness)) {
      perCategoryFinal[cat] = n === 0 ? 0 : sum / n;
    }

    aggs.push({
      key: configKey(config),
      label: configLabel(config),
      config,
      rows,
      succeededRows,
      qualityScore: mean(qualityScores),
      correctnessScore: mean(correctnessScores),
      efficiencyScore: mean(efficiencyScores),
      avgLatencyMs: mean(latenciesMs),
      p95LatencyMs: p95(latenciesMs),
      totalCostUsd,
      avgCostUsd: rows.length === 0 ? 0 : totalCostUsd / rows.length,
      composite: 0, // computed after we know the per-sweep min/max for cost + latency
      perCategoryCorrectness: perCategoryFinal,
    });

    // suppress unused 'latencies' lint
    void latencies;
  }

  // composite — cost and latency are normalised against the best (cheapest /
  // fastest) provider in this sweep so the score is comparable across runs.
  const minCost = Math.min(...aggs.map((a) => a.avgCostUsd).filter((x) => x > 0));
  const maxCost = Math.max(...aggs.map((a) => a.avgCostUsd));
  const minLatency = Math.min(...aggs.map((a) => a.avgLatencyMs).filter((x) => x > 0));
  const maxLatency = Math.max(...aggs.map((a) => a.avgLatencyMs));

  for (const a of aggs) {
    const costPenalty = maxCost <= minCost ? 0 : (a.avgCostUsd - minCost) / (maxCost - minCost);
    const latencyPenalty =
      maxLatency <= minLatency ? 0 : (a.avgLatencyMs - minLatency) / (maxLatency - minLatency);
    a.composite =
      COMPOSITE_WEIGHTS.quality * a.qualityScore +
      COMPOSITE_WEIGHTS.correctness * a.correctnessScore +
      COMPOSITE_WEIGHTS.cost * (1 - costPenalty) +
      COMPOSITE_WEIGHTS.latency * (1 - latencyPenalty) +
      COMPOSITE_WEIGHTS.efficiency * a.efficiencyScore;
  }

  return aggs.sort((a, b) => b.composite - a.composite);
}

// ── LaTeX emitters ─────────────────────────────────────────────────────────

function escTex(s: string): string {
  return s.replace(/&/g, "\\&").replace(/_/g, "\\_").replace(/%/g, "\\%");
}

function emitRankedTable(aggs: ProviderAgg[]): string {
  const rows = aggs
    .map(
      (a, i) =>
        `${i + 1} & ${escTex(a.label)} & ${a.qualityScore.toFixed(3)} & ` +
        `${a.correctnessScore.toFixed(3)} & ${a.efficiencyScore.toFixed(3)} & ` +
        `\\$${a.avgCostUsd.toFixed(4)} & ${a.p95LatencyMs.toFixed(0)} & ` +
        `\\textbf{${a.composite.toFixed(3)}} \\\\`,
    )
    .join("\n");

  return `% generated by packages/eval/src/reports/thesisExport.ts — do not edit by hand
\\begin{tabular}{rlrrrrrr}
\\toprule
\\# & configuration & quality & correctness & efficiency & avg cost & p95 latency (ms) & composite \\\\
\\midrule
${rows}
\\bottomrule
\\end{tabular}
`;
}

function emitParetoCsv(aggs: ProviderAgg[], xKey: "cost" | "latency"): string {
  const header = `label,${xKey},quality,composite`;
  const lines = aggs.map((a) => {
    const x = xKey === "cost" ? a.avgCostUsd.toFixed(6) : a.avgLatencyMs.toFixed(1);
    return `"${a.label}",${x},${a.qualityScore.toFixed(4)},${a.composite.toFixed(4)}`;
  });
  return `${header}\n${lines.join("\n")}\n`;
}

function emitParetoTex(xKey: "cost" | "latency", csvName: string): string {
  const xLabel = xKey === "cost" ? "Average cost per query (USD)" : "Average latency (ms)";
  return `% generated by thesisExport.ts — do not edit by hand
% requires: \\usepackage{pgfplots}
\\begin{tikzpicture}
  \\begin{axis}[
    width=\\linewidth,
    height=8cm,
    xlabel={${xLabel}},
    ylabel={Quality (LLM-judge mean)},
    grid=both,
    nodes near coords,
    nodes near coords align={vertical},
    every node near coord/.append style={font=\\tiny}
  ]
    \\addplot+[only marks, mark=*, point meta=explicit symbolic]
      table[col sep=comma, x=${xKey}, y=quality, meta=label] {${csvName}};
  \\end{axis}
\\end{tikzpicture}
`;
}

function emitPerCategoryTable(aggs: ProviderAgg[]): string {
  const allCategories = new Set<string>();
  for (const a of aggs) {
    for (const cat of Object.keys(a.perCategoryCorrectness)) allCategories.add(cat);
  }
  const cats = [...allCategories].sort();
  const header = `configuration & ${cats.map(escTex).join(" & ")} \\\\`;
  const colSpec = `l${"r".repeat(cats.length)}`;
  const rows = aggs.map((a) => {
    const cells = cats.map((c) => (a.perCategoryCorrectness[c] ?? 0).toFixed(2));
    return `${escTex(a.label)} & ${cells.join(" & ")} \\\\`;
  });
  return `% generated by thesisExport.ts — do not edit by hand
\\begin{tabular}{${colSpec}}
\\toprule
${header}
\\midrule
${rows.join("\n")}
\\bottomrule
\\end{tabular}
`;
}

// ── main ───────────────────────────────────────────────────────────────────

function main() {
  const raw = readFileSync(RESULTS_PATH, "utf8");
  const parsed = JSON.parse(raw) as { results: { results: ResultRow[] } };
  const aggs = aggregate(parsed.results.results);

  if (aggs.length === 0) {
    console.error("no providers with provider config metadata found in results");
    process.exit(1);
  }

  mkdirSync(FIGURES_DIR, { recursive: true });

  const outRanked = resolve(FIGURES_DIR, "eval-ranked-configs.tex");
  writeFileSync(outRanked, emitRankedTable(aggs));

  const outCostCsv = resolve(FIGURES_DIR, "eval-pareto-cost-quality.csv");
  writeFileSync(outCostCsv, emitParetoCsv(aggs, "cost"));
  const outCostTex = resolve(FIGURES_DIR, "eval-pareto-cost-quality.tex");
  writeFileSync(outCostTex, emitParetoTex("cost", "eval-pareto-cost-quality.csv"));

  const outLatCsv = resolve(FIGURES_DIR, "eval-pareto-latency-quality.csv");
  writeFileSync(outLatCsv, emitParetoCsv(aggs, "latency"));
  const outLatTex = resolve(FIGURES_DIR, "eval-pareto-latency-quality.tex");
  writeFileSync(outLatTex, emitParetoTex("latency", "eval-pareto-latency-quality.csv"));

  const outPerCategory = resolve(FIGURES_DIR, "eval-per-category.tex");
  writeFileSync(outPerCategory, emitPerCategoryTable(aggs));

  console.log(`exported ${aggs.length} configurations to ${FIGURES_DIR}/`);
  console.log("ranked summary:");
  for (const [i, a] of aggs.entries()) {
    console.log(
      `  ${(i + 1).toString().padStart(2)}. ${a.label.padEnd(60)} ` +
        `composite=${a.composite.toFixed(3)} ` +
        `quality=${a.qualityScore.toFixed(3)} ` +
        `correctness=${a.correctnessScore.toFixed(3)} ` +
        `cost=$${a.avgCostUsd.toFixed(4)} ` +
        `p95=${a.p95LatencyMs.toFixed(0)}ms ` +
        `(n=${a.rows.length})`,
    );
  }
}

main();
