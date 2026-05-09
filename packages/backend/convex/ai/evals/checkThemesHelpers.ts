// internal query for checkThemes.ts. lives in its own file because checkThemes
// is a "use node" action and Convex disallows mixing v8 (queries) with node
// (actions) in the same file.

import { v } from "convex/values";
import { internalQuery } from "../../_generated/server";

export const getReviewsWithEmbeddings = internalQuery({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();
    return reviews
      .filter(
        (r): r is typeof r & { embedding: number[] } =>
          Array.isArray(r.embedding) && r.embedding.length > 0,
      )
      .map((r) => ({
        text: r.text,
        embedding: r.embedding,
      }));
  },
});
