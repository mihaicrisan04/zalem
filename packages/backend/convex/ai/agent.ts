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
  // gpt-oss-120b is aggressive with tool calls; give it enough headroom to
  // finish a chain of tool calls AND still have a step left to write the
  // final text answer. each AI SDK "step" is one LLM invocation — at 5 we
  // were running out of budget before the model got to answer.
  maxSteps: 12,
});

import { mutation } from "../_generated/server";
import { v } from "convex/values";

// public mutation so the client can create a thread instantly
// (before the streaming action starts, so useUIMessages can subscribe)
export const createThread = mutation({
  args: { userId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Sign in to use the advisor");

    const { threadId } = await shoppingAdvisor.createThread(ctx, {
      userId: args.userId ?? identity.subject,
    });
    return { threadId };
  },
});
