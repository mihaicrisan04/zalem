// custom Promptfoo provider — calls the eval-only Convex action
// `ai.evals.runOnce.runOnce`, which runs the real shoppingAdvisor agent
// with the per-row config and returns the full result blob.
//
// see docs/eval-system-plan.md § "the data flow for one eval row"
//
// note: we deliberately use `anyApi` (convex's untyped escape hatch) instead
// of importing `api` from `@zalem/backend/convex/_generated/api`. importing
// the typed api forces TypeScript to check every backend `.ts` file
// transitively (backend uses a more lenient tsconfig than ours), which
// would surface ~40 pre-existing strictness errors unrelated to this work.
// we self-type the FunctionReference instead so eval stays well-typed at
// the call site without dragging in the whole backend.

import { anyApi, type FunctionReference } from "convex/server";
import { convex, evalAuthSecret } from "../lib/convexClient";

type ProviderConfig = {
  modelId: string;
  reasoningEffort: "none" | "low" | "medium" | "high";
  maxSteps: number;
  promptVariant: string;
  providerOrder?: string[];
};

type RowVars = {
  question?: string;
  productId?: string;
  recentlyViewedIds?: string[];
  expectedTools?: string[];
  expectedProductIds?: string[];
  checkReviewFidelity?: boolean;
  maxAcceptableToolCalls?: number;
  category?: string;
};

type RunOnceArgs = {
  authSecret: string;
  question: string;
  productId?: string;
  recentlyViewedIds?: string[];
  config: ProviderConfig;
  sweepLabel?: string;
};

type RunOnceResult = {
  finalText: string;
  parts: unknown[];
  usage: { input: number; output: number; reasoning: number; total: number };
  timings: {
    startedAt: number;
    firstDeltaAt: number;
    finishedAt: number;
    ttftMs: number;
    totalMs: number;
  };
  dbSnapshot: Record<string, { price: number; rating: number }>;
  threadId: string;
  finishReason: string;
  stepsUsed: number;
  toolCalls: Array<{ toolName?: string; toolCallId?: string; args?: unknown }>;
};

// `anyApi` is typed as a deeply-recursive Proxy where every property is
// optional, which trips `noUncheckedIndexedAccess`. cast the chain to a
// concrete FunctionReference once at the top so call sites stay clean.
const runOnceRef = (anyApi as unknown as { ai: { evals: { runOnce: { runOnce: unknown } } } }).ai
  .evals.runOnce.runOnce as FunctionReference<"action", "public", RunOnceArgs, RunOnceResult>;

export default class AdvisorProvider {
  private readonly config: ProviderConfig;
  private readonly label: string;
  private readonly sweepLabel: string;

  constructor(options: { id?: string; config: ProviderConfig; label?: string }) {
    this.config = options.config;
    this.label = options.label ?? options.config.modelId;
    this.sweepLabel = process.env.PROMPTFOO_SWEEP_LABEL ?? "ad-hoc";
  }

  id() {
    return `advisor-${this.label}`;
  }

  async callApi(prompt: string, context: { vars: RowVars }) {
    const vars = context.vars;
    // prompt comes pre-interpolated from the YAML template `"{{question}}"`
    const question = prompt || vars.question || "";

    // Promptfoo injects extra fields (e.g. `basePath`) into the provider config
    // object. Convex's strict validator rejects unknown fields, so we whitelist
    // exactly what runOnce expects before passing it through.
    const cleanConfig: ProviderConfig = {
      modelId: this.config.modelId,
      reasoningEffort: this.config.reasoningEffort,
      maxSteps: this.config.maxSteps,
      promptVariant: this.config.promptVariant,
      ...(this.config.providerOrder ? { providerOrder: this.config.providerOrder } : {}),
    };

    try {
      const result = await convex.action(runOnceRef, {
        authSecret: evalAuthSecret,
        question,
        productId: vars.productId,
        recentlyViewedIds: vars.recentlyViewedIds,
        config: cleanConfig,
        sweepLabel: this.sweepLabel,
      });

      return {
        output: result.finalText,
        tokenUsage: {
          prompt: result.usage.input,
          completion: result.usage.output,
          total: result.usage.total,
        },
        cached: false,
        cost: undefined, // populated downstream by thesisExport.ts using per-model pricing
        metadata: {
          parts: result.parts,
          usage: result.usage,
          timings: result.timings,
          dbSnapshot: result.dbSnapshot,
          threadId: result.threadId,
          finishReason: result.finishReason,
          stepsUsed: result.stepsUsed,
          toolCalls: result.toolCalls,
          providerConfig: this.config,
        },
      };
    } catch (err) {
      return {
        output: "",
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }
}
