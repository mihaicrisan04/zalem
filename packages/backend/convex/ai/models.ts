import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter();

export type QueryType =
  | "conversational"
  | "comparison"
  | "personalized_advice"
  | "review_summary"
  | "quick_qa"
  | "homepage_hero";

const FLASH = "google/gemini-3-flash-preview";
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
  return openrouter(MODEL_MAP[queryType]);
}

export const embeddingModel = openrouter.textEmbeddingModel("google/gemini-embedding-001");
