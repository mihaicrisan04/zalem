import { internalMutation, internalQuery } from "../_generated/server";
import { v } from "convex/values";

// -- internal queries (Convex runtime, no Node.js) --

export const getProductForReview = internalQuery({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;
    return {
      _id: product._id,
      title: product.title,
      brand: product.brand,
      category: product.category,
      subcategory: product.subcategory,
      price: product.price,
      description: product.description,
      specifications: product.specifications,
    };
  },
});

export const getAllProductIds = internalQuery({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    return products.map((p) => p._id);
  },
});

// -- internal mutations --

export const deleteReviewsForProduct = internalMutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();

    for (const review of reviews) {
      await ctx.db.delete(review._id);
    }
    return reviews.length;
  },
});

export const insertReviewsBatch = internalMutation({
  args: {
    reviews: v.array(
      v.object({
        productId: v.id("products"),
        clerkUserId: v.string(),
        userName: v.string(),
        rating: v.number(),
        text: v.string(),
        createdAt: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const review of args.reviews) {
      await ctx.db.insert("reviews", review);
    }
  },
});

export const updateProductRating = internalMutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();

    if (reviews.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await ctx.db.patch(args.productId, {
        rating: Math.round(avg * 10) / 10,
        reviewCount: reviews.length,
      });
    } else {
      await ctx.db.patch(args.productId, {
        rating: 0,
        reviewCount: 0,
      });
    }
  },
});
