"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { shoppingAdvisor } from "./agent";
import { FEW_SHOT_EXAMPLES } from "./prompt";

export const requestAdvice = action({
  args: {
    threadId: v.optional(v.string()),
    question: v.string(),
    productId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to use the advisor");
    }

    const userId = identity.subject;

    // prepend product context if available
    const prompt = args.productId
      ? `[Context: viewing product ${args.productId}]\n${args.question}`
      : args.question;

    if (args.threadId) {
      const { thread } = await shoppingAdvisor.continueThread(ctx, {
        threadId: args.threadId,
      });
      const result = await thread.generateText({ prompt });
      return { threadId: args.threadId, text: result.text };
    }

    const { threadId, thread } = await shoppingAdvisor.createThread(ctx, {
      userId,
    });

    const result = await thread.generateText({
      prompt,
      messages: FEW_SHOT_EXAMPLES,
    });

    return { threadId, text: result.text };
  },
});
