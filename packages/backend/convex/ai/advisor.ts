"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { shoppingAdvisor } from "./agent";
import { FEW_SHOT_EXAMPLES } from "./prompt";

export const requestAdvice = action({
  args: {
    threadId: v.optional(v.string()),
    question: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to use the advisor");
    }

    const userId = identity.subject;

    if (args.threadId) {
      const { thread } = await shoppingAdvisor.continueThread(ctx, {
        threadId: args.threadId,
      });
      const result = await thread.generateText({
        prompt: args.question,
      });
      return { threadId: args.threadId, text: result.text };
    }

    const { threadId, thread } = await shoppingAdvisor.createThread(ctx, {
      userId,
    });

    const result = await thread.generateText({
      prompt: args.question,
      messages: FEW_SHOT_EXAMPLES,
    });

    return { threadId, text: result.text };
  },
});
