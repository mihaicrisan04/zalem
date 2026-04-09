import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter();

export type QueryType =
  | "conversational"
  | "comparison"
  | "personalized_advice"
  | "review_summary"
  | "quick_qa"
  | "homepage_hero";

// conversational tier — gpt-oss-120b via Cerebras on OpenRouter
// ~1700-3000 tok/s, native reasoning tokens, tool calling
const FLASH = "openai/gpt-oss-120b";

// batch tier — Gemini Flash Lite for one-shot structured extraction
// (review summaries, hero copy, quick_qa). Reasoning not needed here.
const FLASH_LITE = "google/gemini-3.1-flash-lite-preview";

const MODEL_MAP: Record<QueryType, string> = {
  conversational: FLASH,
  comparison: FLASH,
  personalized_advice: FLASH,
  review_summary: FLASH_LITE,
  quick_qa: FLASH_LITE,
  homepage_hero: FLASH_LITE,
};

export function selectModel(queryType: QueryType) {
  const modelId = MODEL_MAP[queryType];

  // gpt-oss models support configurable reasoning effort and benefit from
  // high-throughput provider routing (Cerebras > Groq > others).
  if (modelId.startsWith("openai/gpt-oss")) {
    return openrouter(modelId, {
      reasoning: { effort: "medium" },
      provider: {
        order: ["cerebras", "groq"],
        allow_fallbacks: true,
        sort: "throughput",
      },
    });
  }

  return openrouter(modelId);
}

export const embeddingModel = openrouter.textEmbeddingModel("google/gemini-embedding-001");
