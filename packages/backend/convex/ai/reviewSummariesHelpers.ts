import { internalAction, internalMutation, internalQuery, query } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

// -- public query: get cached summary for a product --

export const getSummary = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reviewSummaries")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .unique();
  },
});

// -- internal queries --

export const getProductInfo = internalQuery({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.productId);
    if (!product) return null;
    return {
      title: product.title,
      category: product.category,
      reviewCount: product.reviewCount,
    };
  },
});

export const getAllReviewsForProduct = internalQuery({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();
    return reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      text: r.text,
    }));
  },
});

export const getProductsNeedingSummary = internalQuery({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    const result = [];

    for (const product of products) {
      if (product.reviewCount < 3) continue;

      const existing = await ctx.db
        .query("reviewSummaries")
        .withIndex("by_product", (q) => q.eq("productId", product._id))
        .unique();

      // needs summary if: no summary exists, or review count changed, or older than 7 days
      const stale =
        !existing ||
        existing.reviewCount !== product.reviewCount ||
        Date.now() - existing.generatedAt > 7 * 24 * 60 * 60 * 1000;

      if (stale) {
        result.push(product._id);
      }
    }

    return result;
  },
});

// -- internal mutations --

export const setReviewEmbeddings = internalMutation({
  args: {
    updates: v.array(
      v.object({
        reviewId: v.id("reviews"),
        embedding: v.array(v.float64()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const update of args.updates) {
      await ctx.db.patch(update.reviewId, { embedding: update.embedding });
    }
  },
});

export const upsertSummary = internalMutation({
  args: {
    productId: v.id("products"),
    reviewCount: v.number(),
    averageRating: v.number(),
    positives: v.array(
      v.object({
        theme: v.string(),
        count: v.number(),
        quote: v.string(),
        reviewId: v.id("reviews"),
      }),
    ),
    negatives: v.array(
      v.object({
        theme: v.string(),
        count: v.number(),
        quote: v.string(),
        reviewId: v.id("reviews"),
      }),
    ),
    conflicts: v.array(
      v.object({
        topic: v.string(),
        positiveCount: v.number(),
        negativeCount: v.number(),
        summary: v.string(),
      }),
    ),
    bestFor: v.array(v.string()),
    generatedAt: v.number(),
    modelUsed: v.string(),
    validationPassed: v.boolean(),
    validationDetails: v.optional(
      v.object({
        quotesVerified: v.number(),
        quotesFailed: v.number(),
        themesVerified: v.number(),
        themesFailed: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("reviewSummaries")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .unique();

    if (existing) {
      await ctx.db.replace(existing._id, args);
    } else {
      await ctx.db.insert("reviewSummaries", args);
    }
  },
});

export const invalidateSummary = internalMutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("reviewSummaries")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

// -- orchestrator: generate summaries for all stale products --

const CHUNK_SIZE = 30;

export const generateAll = internalAction({
  args: {},
  handler: async (ctx): Promise<{ totalProducts: number; totalChunks: number }> => {
    const productIds = await ctx.runQuery(
      internal.ai.reviewSummariesHelpers.getProductsNeedingSummary,
      {},
    );

    console.log(`Found ${productIds.length} products needing review summaries`);

    if (productIds.length === 0) return { totalProducts: 0, totalChunks: 0 };

    await ctx.scheduler.runAfter(0, internal.ai.reviewSummariesHelpers.processChunk, {
      productIds,
      chunkIndex: 0,
    });

    return {
      totalProducts: productIds.length,
      totalChunks: Math.ceil(productIds.length / CHUNK_SIZE),
    };
  },
});

export const processChunk = internalAction({
  args: {
    productIds: v.array(v.id("products")),
    chunkIndex: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    const start = args.chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, args.productIds.length);
    const chunk = args.productIds.slice(start, end);
    const totalChunks = Math.ceil(args.productIds.length / CHUNK_SIZE);

    console.log(
      `Summary chunk ${args.chunkIndex + 1}/${totalChunks} (products ${start + 1}-${end} of ${args.productIds.length})`,
    );

    let successCount = 0;
    let failCount = 0;

    for (const productId of chunk) {
      try {
        await ctx.runAction(internal.ai.reviewSummaries.generateForProduct, { productId });
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed summary for ${productId}:`, error);
      }
    }

    console.log(
      `Summary chunk ${args.chunkIndex + 1}/${totalChunks}: ${successCount} ok, ${failCount} failed`,
    );

    if (end < args.productIds.length) {
      await ctx.scheduler.runAfter(0, internal.ai.reviewSummariesHelpers.processChunk, {
        productIds: args.productIds,
        chunkIndex: args.chunkIndex + 1,
      });
    } else {
      console.log(`All summary chunks complete! ${args.productIds.length} products processed.`);
    }
  },
});
