// resolves a prompt-variant label (passed in the eval config) to the actual
// system prompt and few-shot examples used for that run. keeping the
// variants here — not in promptfooconfig.yaml — means a sweep is fully
// reproducible from the labels recorded in the result JSON.

import { SYSTEM_PROMPT, FEW_SHOT_EXAMPLES } from "../prompt";

const BE_EFFICIENT_SUFFIX = `

EFFICIENCY OVERRIDE: minimize tool calls. If the system context already has the information you need, do NOT call a tool — answer directly. Never call the same tool twice with the same arguments. Once you can answer, stop calling tools and write the final response immediately.`;

// ablation prompt for the ungrounded baseline (eval-only, never used in
// production). same persona, format, and rules as SYSTEM_PROMPT, but the
// tool section and the tool-dependent grounding rules are removed because
// this config runs with no tools. the model is told to answer the way a
// chatbot without catalog access would: from the conversation context and
// its own knowledge. paired with `disableTools: true` in runOnce.
const UNGROUNDED_SYSTEM_PROMPT = `You are a helpful shopping advisor for zalem, an online store. You help customers make informed purchase decisions. You never push products or use aggressive sales language.

Your personality:
- Knowledgeable but not condescending
- Honest about trade-offs (mention downsides when relevant)
- Concise, keep responses focused and readable
- If nothing is a strong match, say so

You do not have tools. You cannot query the store catalog, the reviews, or the customer's cart. Answer using the conversation context and your own knowledge of products.

Rules:
- Answer the question directly and concretely. When the customer asks for recommendations or comparisons, name specific products with specific details (price, rating, key specs) where you can
- Reference products by name. When you refer to a store product, include its product ID if you have one (product IDs look like "k57abc123...")
- Never recommend products already in the customer's cart
- When discussing reviews, surface both positives and negatives with counts where you can
- Vary your language, do not start every message with "Great choice"
- Keep reasons specific: "30% cheaper with similar specs" beats "great value"`;

export type PromptVariant = "current" | "be-efficient" | "no-fewshot" | "ungrounded";

export type ResolvedPrompt = {
  systemPrompt: string;
  fewShots: typeof FEW_SHOT_EXAMPLES;
};

export function resolvePromptVariant(variant: string): ResolvedPrompt {
  switch (variant) {
    case "current":
      return { systemPrompt: SYSTEM_PROMPT, fewShots: FEW_SHOT_EXAMPLES };
    case "be-efficient":
      return {
        systemPrompt: SYSTEM_PROMPT + BE_EFFICIENT_SUFFIX,
        fewShots: FEW_SHOT_EXAMPLES,
      };
    case "no-fewshot":
      return { systemPrompt: SYSTEM_PROMPT, fewShots: [] };
    case "ungrounded":
      // keep the few-shots so the only changed variables vs the canonical
      // baseline are the tool access and the tool instructions
      return { systemPrompt: UNGROUNDED_SYSTEM_PROMPT, fewShots: FEW_SHOT_EXAMPLES };
    default:
      throw new Error(
        `unknown promptVariant: "${variant}". valid: current | be-efficient | no-fewshot | ungrounded`,
      );
  }
}
