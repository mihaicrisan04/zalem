"use node";

// eval-only: takes a list of theme strings claimed by the agent (e.g.
// "buyers love the battery life") and returns, for each, how many reviews
// of the given product semantically match it (cosine similarity ≥ 0.35).
//
// generalises `validateThemesWithEmbeddings` from ../reviewSummaries.ts so
// the eval scorer (`reviewThemeFidelity.ts`) can verify natural-language
// claims, not just structured output from the summary pipeline.
//
// auth bypass via the same CONVEX_EVAL_SECRET env var as runOnce.

import { v } from "convex/values";
import { embedMany } from "ai";
import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { embeddingModel } from "../models";

const SIMILARITY_THRESHOLD = 0.35;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    dot += ai * bi;
    normA += ai * ai;
    normB += bi * bi;
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export const checkThemes = action({
  args: {
    authSecret: v.string(),
    productId: v.string(),
    themes: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const expected = process.env.CONVEX_EVAL_SECRET;
    if (!expected) throw new Error("CONVEX_EVAL_SECRET is not set on this Convex deployment");
    if (args.authSecret !== expected) throw new Error("invalid eval secret");

    if (args.themes.length === 0) {
      return { themes: [] as Array<{ theme: string; semanticMatches: number }> };
    }

    // pull all reviews + their embeddings for this product
    const reviewsWithEmb = await ctx.runQuery(
      internal.ai.evals.checkThemesHelpers.getReviewsWithEmbeddings,
      { productId: args.productId as Id<"products"> },
    );

    if (reviewsWithEmb.length === 0) {
      return {
        themes: args.themes.map((theme) => ({ theme, semanticMatches: 0 })),
        note: "no reviews with embeddings found for this product",
      };
    }

    // embed the claimed themes in one batch call
    const { embeddings: themeEmbeddings } = await embedMany({
      model: embeddingModel,
      values: args.themes,
    });

    const results = args.themes.map((theme, i) => {
      const themeEmb = themeEmbeddings[i];
      if (!themeEmb) return { theme, semanticMatches: 0 };
      let semanticMatches = 0;
      for (const r of reviewsWithEmb) {
        if (cosineSimilarity(themeEmb, r.embedding) >= SIMILARITY_THRESHOLD) {
          semanticMatches++;
        }
      }
      return { theme, semanticMatches };
    });

    return { themes: results };
  },
});
