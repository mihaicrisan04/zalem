"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { generateObject, embedMany } from "ai";
import { selectModel, embeddingModel } from "./models";
import { z } from "zod";

// -- zod schema for structured LLM output --

const summaryOutputSchema = z.object({
  positives: z
    .array(
      z.object({
        theme: z.string().describe("Short theme label, e.g. 'battery life'"),
        count: z.number().int().describe("How many reviews mention this theme"),
        quoteReviewIndex: z
          .number()
          .int()
          .describe("Index of the review to quote (0-based, from the provided list)"),
        quote: z.string().describe("Verbatim quote from that review (exact substring)"),
      }),
    )
    .describe("2-5 positive themes, ordered by count descending"),
  negatives: z
    .array(
      z.object({
        theme: z.string(),
        count: z.number().int(),
        quoteReviewIndex: z.number().int(),
        quote: z.string(),
      }),
    )
    .describe("0-3 negative themes"),
  conflicts: z
    .array(
      z.object({
        topic: z.string().describe("The aspect reviewers disagree on"),
        positiveCount: z.number().int(),
        negativeCount: z.number().int(),
        summary: z
          .string()
          .describe(
            "One sentence describing the split, e.g. 'Most love the feel, but 9 report wobble after 6 months'",
          ),
      }),
    )
    .describe("0-2 genuine conflicts where reviewers disagree on the SAME aspect"),
  bestFor: z.array(z.string()).describe("1-3 use cases derived from what reviewers actually say"),
});

// -- prompt builder --

function buildSummaryPrompt(
  product: { title: string; category: string },
  reviews: { index: number; rating: number; text: string }[],
): string {
  const reviewLines = reviews
    .map((r) => `[R${r.index}] ${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)} ${r.text}`)
    .join("\n");

  return `Analyze these ${reviews.length} customer reviews for "${product.title}" (${product.category}).
Extract themes that ACTUALLY appear in the reviews. Never invent themes.

Reviews:
${reviewLines}

Instructions:
- Extract 2-5 positive themes with accurate counts of how many reviews mention each
- Extract 0-3 negative themes with counts
- Identify 0-2 genuine CONFLICTS where reviewers disagree on the SAME aspect
- For each theme, pick ONE representative quote — it must be an EXACT substring from the review at the index you reference
- quoteReviewIndex must match the [R#] number of the review you're quoting
- Counts must be plausible: no theme count can exceed ${reviews.length}
- Only include themes mentioned by 2+ reviews
- bestFor: 1-3 use cases based on what reviewers actually say, not product specs`;
}

// -- validation: check quotes against actual review text --

function validateQuotes(
  themes: { quoteReviewIndex: number; quote: string }[],
  reviews: { index: number; text: string }[],
): { verified: number; failed: number; cleanedThemes: typeof themes } {
  let verified = 0;
  let failed = 0;
  const cleaned = [];

  for (const theme of themes) {
    const review = reviews.find((r) => r.index === theme.quoteReviewIndex);
    if (!review) {
      failed++;
      continue;
    }

    // check if quote is an exact substring (case-insensitive, trimmed)
    const quoteNorm = theme.quote.trim().toLowerCase();
    const textNorm = review.text.toLowerCase();

    if (textNorm.includes(quoteNorm) || fuzzyMatch(quoteNorm, textNorm)) {
      verified++;
      cleaned.push(theme);
    } else {
      failed++;
      // still include the theme but flag that the quote couldn't be verified
      cleaned.push(theme);
    }
  }

  return { verified, failed, cleanedThemes: cleaned };
}

// simple fuzzy: check if 80%+ of words in quote appear in review text
function fuzzyMatch(quote: string, text: string): boolean {
  const quoteWords = quote.split(/\s+/).filter((w) => w.length > 3);
  if (quoteWords.length === 0) return false;
  const matchCount = quoteWords.filter((w) => text.includes(w)).length;
  return matchCount / quoteWords.length >= 0.8;
}

// -- embedding-backed theme validation --
// embed each claimed theme, then cosine-search the review embeddings
// to verify the theme actually appears in multiple reviews

async function validateThemesWithEmbeddings(
  themes: { theme: string; count: number }[],
  reviewEmbeddings: { embedding: number[]; text: string }[],
): Promise<{ verified: number; failed: number }> {
  if (themes.length === 0 || reviewEmbeddings.length === 0) {
    return { verified: 0, failed: 0 };
  }

  const themeTexts = themes.map((t) => t.theme);
  const { embeddings: themeEmbeddings } = await embedMany({
    model: embeddingModel,
    values: themeTexts,
  });

  let verified = 0;
  let failed = 0;

  for (let i = 0; i < themes.length; i++) {
    const themeEmb = themeEmbeddings[i];
    // count how many reviews have cosine similarity > 0.35 with this theme
    let semanticMatches = 0;
    for (const reviewEmb of reviewEmbeddings) {
      const sim = cosineSimilarity(themeEmb, reviewEmb.embedding);
      if (sim > 0.35) semanticMatches++;
    }

    // theme should appear in at least 2 reviews semantically
    if (semanticMatches >= 2) {
      verified++;
    } else {
      failed++;
    }
  }

  return { verified, failed };
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// -- main action: generate summary for a single product --

export const generateForProduct = internalAction({
  args: { productId: v.id("products") },
  handler: async (
    ctx,
    args,
  ): Promise<{ success: boolean; reviewCount?: number; validationPassed?: boolean }> => {
    // 1. fetch product info
    const product = await ctx.runQuery(internal.ai.reviewSummariesHelpers.getProductInfo, {
      productId: args.productId,
    });
    if (!product) {
      console.error(`Product ${args.productId} not found`);
      return { success: false };
    }

    // 2. fetch all reviews for this product
    const reviews: { _id: Id<"reviews">; rating: number; text: string }[] = await ctx.runQuery(
      internal.ai.reviewSummariesHelpers.getAllReviewsForProduct,
      { productId: args.productId },
    );

    if (reviews.length < 3) {
      console.log(`Skipping ${product.title}: only ${reviews.length} reviews (min 3)`);
      return { success: true, reviewCount: reviews.length };
    }

    console.log(`Summarizing ${reviews.length} reviews for: ${product.title}`);

    // 3. embed all reviews
    const { embeddings: reviewEmbeddings } = await embedMany({
      model: embeddingModel,
      values: reviews.map((r) => r.text),
    });

    // store embeddings on reviews (batch)
    const embeddingUpdates = reviews.map((r, i) => ({
      reviewId: r._id,
      embedding: reviewEmbeddings[i],
    }));

    for (let i = 0; i < embeddingUpdates.length; i += 25) {
      await ctx.runMutation(internal.ai.reviewSummariesHelpers.setReviewEmbeddings, {
        updates: embeddingUpdates.slice(i, i + 25),
      });
    }

    // 4. call Flash-Lite for structured theme extraction
    const indexedReviews = reviews.map((r, i) => ({
      index: i,
      rating: r.rating,
      text: r.text,
    }));

    const prompt = buildSummaryPrompt(product, indexedReviews);

    const result = await generateObject({
      model: selectModel("review_summary"),
      schema: summaryOutputSchema,
      prompt,
    });

    const output = result.object;

    // 5. validate quotes
    const allThemes = [...output.positives, ...output.negatives];
    const quoteValidation = validateQuotes(allThemes, indexedReviews);

    // 6. validate themes with embeddings
    const reviewEmbData = reviews.map((r, i) => ({
      embedding: reviewEmbeddings[i],
      text: r.text,
    }));
    const allThemeLabels = [...output.positives, ...output.negatives].map((t) => ({
      theme: t.theme,
      count: t.count,
    }));
    const themeValidation = await validateThemesWithEmbeddings(allThemeLabels, reviewEmbData);

    const validationPassed = quoteValidation.failed <= 1 && themeValidation.failed === 0;

    // 7. map quoteReviewIndex → reviewId for storage
    const mapThemes = (themes: (typeof output.positives)[number][]) =>
      themes.map((t) => ({
        theme: t.theme,
        count: t.count,
        quote: t.quote,
        reviewId: reviews[t.quoteReviewIndex]?._id ?? reviews[0]._id,
      }));

    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    // 8. upsert summary
    await ctx.runMutation(internal.ai.reviewSummariesHelpers.upsertSummary, {
      productId: args.productId,
      reviewCount: reviews.length,
      averageRating: Math.round(avg * 10) / 10,
      positives: mapThemes(output.positives),
      negatives: mapThemes(output.negatives),
      conflicts: output.conflicts,
      bestFor: output.bestFor,
      generatedAt: Date.now(),
      modelUsed: "google/gemini-3.1-flash-lite-preview",
      validationPassed,
      validationDetails: {
        quotesVerified: quoteValidation.verified,
        quotesFailed: quoteValidation.failed,
        themesVerified: themeValidation.verified,
        themesFailed: themeValidation.failed,
      },
    });

    console.log(
      `Done: ${product.title} — ${output.positives.length} positive, ${output.negatives.length} negative themes, ${output.conflicts.length} conflicts. Validation: ${validationPassed ? "PASS" : "FAIL"} (quotes ${quoteValidation.verified}/${quoteValidation.verified + quoteValidation.failed}, themes ${themeValidation.verified}/${themeValidation.verified + themeValidation.failed})`,
    );

    return { success: true, reviewCount: reviews.length, validationPassed };
  },
});
