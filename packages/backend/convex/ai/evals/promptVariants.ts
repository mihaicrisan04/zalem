// resolves a prompt-variant label (passed in the eval config) to the actual
// system prompt and few-shot examples used for that run. keeping the
// variants here — not in promptfooconfig.yaml — means a sweep is fully
// reproducible from the labels recorded in the result JSON.

import { SYSTEM_PROMPT, FEW_SHOT_EXAMPLES } from "../prompt";

const BE_EFFICIENT_SUFFIX = `

EFFICIENCY OVERRIDE: minimize tool calls. If the system context already has the information you need, do NOT call a tool — answer directly. Never call the same tool twice with the same arguments. Once you can answer, stop calling tools and write the final response immediately.`;

export type PromptVariant = "current" | "be-efficient" | "no-fewshot";

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
    default:
      throw new Error(
        `unknown promptVariant: "${variant}". valid: current | be-efficient | no-fewshot`,
      );
  }
}
