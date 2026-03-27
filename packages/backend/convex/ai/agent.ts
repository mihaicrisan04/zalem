import { Agent } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { selectModel } from "./models";
import { SYSTEM_PROMPT } from "./prompt";
import {
  getProductDetails,
  searchProducts,
  getRecommendations,
  getCartContents,
  getReviewsSummary,
} from "./tools";

export const shoppingAdvisor = new Agent(components.agent, {
  name: "Shopping Advisor",
  languageModel: selectModel("conversational"),
  instructions: SYSTEM_PROMPT,
  tools: {
    getProductDetails,
    searchProducts,
    getRecommendations,
    getCartContents,
    getReviewsSummary,
  },
  maxSteps: 5,
});

// expose as a mutation so the client can create a thread instantly
// (before the streaming action starts, so useUIMessages can subscribe)
export const createThread = shoppingAdvisor.createThreadMutation();
