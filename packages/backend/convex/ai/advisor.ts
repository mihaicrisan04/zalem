"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { shoppingAdvisor } from "./agent";
import { FEW_SHOT_EXAMPLES } from "./prompt";

// -- context assembly (runs on every request) --

async function assembleContext(
  ctx: any,
  args: {
    productId?: string;
    recentlyViewedIds?: string[];
  },
): Promise<Array<{ role: "system"; content: string }>> {
  const contextParts: string[] = [];

  // 1. current product details + review summary
  if (args.productId) {
    try {
      const product = await ctx.runQuery(api.products.get, {
        id: args.productId as Id<"products">,
      });
      if (product) {
        const desc =
          product.description.length > 200
            ? `${product.description.slice(0, 200)}...`
            : product.description;

        const specEntries = product.specifications
          ? Object.entries(product.specifications).slice(0, 5)
          : [];
        const specsLine =
          specEntries.length > 0
            ? `\nKey specs: ${specEntries.map(([k, val]) => `${k}: ${val}`).join(", ")}`
            : "";

        const priceLine = product.originalPrice
          ? `$${product.price} (was $${product.originalPrice}, ${product.discountPercent}% off)`
          : `$${product.price}`;

        contextParts.push(
          `CURRENT PRODUCT (ID: ${product._id}): ${product.title} by ${product.brand}\nCategory: ${product.category}${product.subcategory ? ` > ${product.subcategory}` : ""}\nPrice: ${priceLine}\nRating: ${product.rating}/5 (${product.reviewCount} reviews)\n${desc}${specsLine}`,
        );
      }

      const summary = await ctx.runQuery(api.ai.reviewSummariesHelpers.getSummary, {
        productId: args.productId as Id<"products">,
      });
      if (summary) {
        const pos = summary.positives.map((t: any) => `${t.theme} (${t.count})`).join(", ");
        const neg = summary.negatives.map((t: any) => `${t.theme} (${t.count})`).join(", ");
        const conflicts = summary.conflicts
          .map((c: any) => `${c.topic}: ${c.positiveCount} agree vs ${c.negativeCount} disagree`)
          .join("; ");

        let reviewLine = `REVIEW THEMES (${summary.reviewCount} reviews analyzed):`;
        if (pos) reviewLine += `\nPositives: ${pos}`;
        if (neg) reviewLine += `\nNegatives: ${neg}`;
        if (conflicts) reviewLine += `\nDivided opinions: ${conflicts}`;
        if (summary.bestFor.length > 0) reviewLine += `\nBest for: ${summary.bestFor.join(", ")}`;
        contextParts.push(reviewLine);
      }
    } catch {
      // product fetch failed, continue without context
    }
  }

  // 2. cart contents
  try {
    const cartItems = await ctx.runQuery(api.cart.list);
    if (cartItems.length > 0) {
      const cartLine = cartItems
        .map((item: any) =>
          item.product ? `${item.product.title} ($${item.product.price} x${item.quantity})` : null,
        )
        .filter(Boolean)
        .join(", ");
      if (cartLine) {
        contextParts.push(`CART CONTENTS: ${cartLine}`);
      }
    }
  } catch {
    // cart fetch failed, continue
  }

  // 3. recently viewed products
  if (args.recentlyViewedIds && args.recentlyViewedIds.length > 0) {
    try {
      const ids = args.recentlyViewedIds.slice(0, 5) as Id<"products">[];
      const products = await ctx.runQuery(api.products.getByIds, { ids });
      if (products.length > 0) {
        const recentLine = products
          .map((p: any) => `${p.title} (ID: ${p._id}, $${p.price}, ${p.category})`)
          .join(", ");
        contextParts.push(`RECENTLY VIEWED: ${recentLine}`);
      }
    } catch {
      // recent views fetch failed, continue
    }
  }

  if (contextParts.length === 0) return [];

  return [
    {
      role: "system" as const,
      content: `Current user context (use this to give relevant, specific answers):\n\n${contextParts.join("\n\n")}`,
    },
  ];
}

// -- main action --

export const requestAdvice = action({
  args: {
    threadId: v.optional(v.string()),
    question: v.string(),
    productId: v.optional(v.string()),
    recentlyViewedIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Sign in to use the advisor");
    }

    const userId = identity.subject;

    // assemble context on every request (not saved to thread)
    const contextMessages = await assembleContext(ctx, {
      productId: args.productId,
      recentlyViewedIds: args.recentlyViewedIds,
    });

    // continue existing thread
    if (args.threadId) {
      const { thread } = await shoppingAdvisor.continueThread(ctx, {
        threadId: args.threadId,
      });
      const result = await thread.streamText(
        {
          prompt: args.question,
          messages: contextMessages,
        },
        { saveStreamDeltas: true },
      );
      // consume the stream so the action waits for completion
      await result.consumeStream();
      return { threadId: args.threadId, text: result.text };
    }

    // new thread
    const { threadId, thread } = await shoppingAdvisor.createThread(ctx, {
      userId,
    });

    const result = await thread.streamText(
      {
        prompt: args.question,
        messages: [...contextMessages, ...FEW_SHOT_EXAMPLES],
      },
      { saveStreamDeltas: true },
    );
    await result.consumeStream();

    return { threadId, text: result.text };
  },
});
