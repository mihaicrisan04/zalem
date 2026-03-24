import { google } from "@ai-sdk/google";

export type QueryType =
  | "conversational"
  | "comparison"
  | "personalized_advice"
  | "review_summary"
  | "quick_qa"
  | "homepage_hero";

const FLASH = "gemini-3-flash-preview";
const FLASH_LITE = "gemini-3.1-flash-lite-preview";

const MODEL_MAP: Record<QueryType, string> = {
  conversational: FLASH,
  comparison: FLASH,
  personalized_advice: FLASH,
  review_summary: FLASH_LITE,
  quick_qa: FLASH_LITE,
  homepage_hero: FLASH_LITE,
};

export function selectModel(queryType: QueryType) {
  return google(MODEL_MAP[queryType]);
}
