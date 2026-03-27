import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

const CHUNK_SIZE = 40;

export const generateReviewsForAll = internalAction({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    totalProducts: number;
    totalChunks: number;
  }> => {
    const allProductIds: Id<"products">[] = await ctx.runQuery(
      internal.ai.generateReviewsHelpers.getAllProductIds,
      {},
    );

    console.log(
      `Starting review generation for ${allProductIds.length} products in chunks of ${CHUNK_SIZE}`,
    );

    await ctx.scheduler.runAfter(0, internal.ai.generateReviewsOrchestrator.processChunk, {
      allProductIds,
      chunkIndex: 0,
    });

    return {
      totalProducts: allProductIds.length,
      totalChunks: Math.ceil(allProductIds.length / CHUNK_SIZE),
    };
  },
});

export const processChunk = internalAction({
  args: {
    allProductIds: v.array(v.id("products")),
    chunkIndex: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    const start = args.chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, args.allProductIds.length);
    const chunk = args.allProductIds.slice(start, end);
    const totalChunks = Math.ceil(args.allProductIds.length / CHUNK_SIZE);

    console.log(
      `Processing chunk ${args.chunkIndex + 1}/${totalChunks} (products ${start + 1}-${end} of ${args.allProductIds.length})`,
    );

    let successCount = 0;
    let failCount = 0;

    for (const productId of chunk) {
      try {
        await ctx.runAction(internal.ai.generateReviews.generateReviewsForProduct, { productId });
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to generate reviews for ${productId}:`, error);
      }
    }

    console.log(
      `Chunk ${args.chunkIndex + 1}/${totalChunks} complete: ${successCount} succeeded, ${failCount} failed`,
    );

    if (end < args.allProductIds.length) {
      await ctx.scheduler.runAfter(0, internal.ai.generateReviewsOrchestrator.processChunk, {
        allProductIds: args.allProductIds,
        chunkIndex: args.chunkIndex + 1,
      });
    } else {
      console.log(
        `All chunks complete! Generated reviews for ${args.allProductIds.length} products.`,
      );
    }
  },
});
