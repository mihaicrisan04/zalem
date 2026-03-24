import { mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const upsertSession = mutation({
  args: {
    sessionId: v.string(),
    clerkUserId: v.optional(v.string()),
    currentPage: v.string(),
    productsViewed: v.array(
      v.object({
        productId: v.id("products"),
        dwellTimeMs: v.number(),
        scrollDepth: v.number(),
        cursorHoverMs: v.number(),
        viewedReviews: v.boolean(),
        timestamp: v.number(),
      }),
    ),
    cartProductIds: v.array(v.id("products")),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("behaviorSessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .unique();

    if (existing) {
      // merge productsViewed: update existing entries, add new ones
      const merged = [...existing.productsViewed];

      for (const incoming of args.productsViewed) {
        const idx = merged.findIndex((p) => p.productId === incoming.productId);
        if (idx >= 0) {
          // update with max/cumulative values
          merged[idx] = {
            productId: incoming.productId,
            dwellTimeMs: Math.max(merged[idx].dwellTimeMs, incoming.dwellTimeMs),
            scrollDepth: Math.max(merged[idx].scrollDepth, incoming.scrollDepth),
            cursorHoverMs: Math.max(merged[idx].cursorHoverMs, incoming.cursorHoverMs),
            viewedReviews: merged[idx].viewedReviews || incoming.viewedReviews,
            timestamp: Math.max(merged[idx].timestamp, incoming.timestamp),
          };
        } else {
          merged.push(incoming);
        }
      }

      await ctx.db.patch(existing._id, {
        productsViewed: merged,
        currentPage: args.currentPage,
        cartProductIds: args.cartProductIds,
        clerkUserId: args.clerkUserId ?? existing.clerkUserId,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("behaviorSessions", {
        sessionId: args.sessionId,
        clerkUserId: args.clerkUserId,
        productsViewed: args.productsViewed,
        currentPage: args.currentPage,
        cartProductIds: args.cartProductIds,
        updatedAt: Date.now(),
      });
    }
  },
});
