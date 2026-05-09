// builds a per-run OpenRouter LanguageModel from the eval config. mirrors
// `selectModel(queryType)` in ../models.ts but parameterised on every knob the
// eval sweep cares about (modelId, reasoningEffort, providerOrder).
//
// kept separate from models.ts so the production routing stays a fixed
// `(queryType) → model` mapping while evals can iterate over arbitrary configs.

import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter();

export type ReasoningEffort = "none" | "low" | "medium" | "high";

export type EvalModelConfig = {
  modelId: string;
  reasoningEffort: ReasoningEffort;
  providerOrder?: string[];
};

export function buildEvalModel(config: EvalModelConfig) {
  // gpt-oss family supports configurable reasoning + per-call provider routing
  if (config.modelId.startsWith("openai/gpt-oss")) {
    return openrouter(config.modelId, {
      reasoning: config.reasoningEffort === "none" ? undefined : { effort: config.reasoningEffort },
      provider: config.providerOrder
        ? {
            order: config.providerOrder,
            allow_fallbacks: true,
            sort: "throughput",
          }
        : undefined,
    });
  }

  // gemini and others — no reasoning toggle, no provider routing
  return openrouter(config.modelId);
}
