import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { internal } from "./_generated/api";
import { ConvexError } from "convex/values";

export const listByProduct = query({
  args: {
    productId: v.id("products"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    return ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const getAggregateByProduct = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();

    const distribution = [0, 0, 0, 0, 0]; // index 0 = 1 star, index 4 = 5 stars
    let sum = 0;
    for (const review of reviews) {
      distribution[review.rating - 1]++;
      sum += review.rating;
    }

    return {
      total: reviews.length,
      average: reviews.length > 0 ? sum / reviews.length : 0,
      distribution,
    };
  },
});

export const create = mutation({
  args: {
    productId: v.id("products"),
    rating: v.number(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    await ctx.db.insert("reviews", {
      productId: args.productId,
      clerkUserId: identity.subject,
      userName: identity.name ?? "Anonymous",
      rating: args.rating,
      text: args.text,
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.reviews.updateProductRating, {
      productId: args.productId,
    });
  },
});

export const updateProductRating = internalMutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();

    const reviewCount = reviews.length;
    const rating =
      reviewCount > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount : 0;

    await ctx.db.patch(args.productId, {
      rating: Math.round(rating * 10) / 10,
      reviewCount,
    });
  },
});
