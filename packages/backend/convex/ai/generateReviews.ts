"use node";

import { internalAction } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { generateObject } from "ai";
import { selectModel } from "./models";
import { z } from "zod";

// -- review profiles --

type ReviewProfile = {
  name: string;
  minReviews: number;
  maxReviews: number;
  // target distribution as percentages: [1★, 2★, 3★, 4★, 5★]
  distribution: [number, number, number, number, number];
  promptHint: string;
};

const PROFILES: ReviewProfile[] = [
  {
    name: "loved",
    minReviews: 20,
    maxReviews: 35,
    distribution: [3, 2, 10, 25, 60],
    promptHint:
      "This is a well-loved product. Most buyers are very happy. A few have minor complaints but overall sentiment is strongly positive.",
  },
  {
    name: "polarizing",
    minReviews: 25,
    maxReviews: 50,
    distribution: [20, 10, 10, 15, 45],
    promptHint:
      "This is a POLARIZING product — people either love it or hate it. Create a genuine split: some buyers adore a specific feature while others find it a dealbreaker. The disagreement should be about the SAME aspect of the product (e.g., some love the firm mattress, others find it too hard).",
  },
  {
    name: "mediocre",
    minReviews: 15,
    maxReviews: 25,
    distribution: [5, 15, 40, 30, 10],
    promptHint:
      "This is a mediocre product. Most reviews are lukewarm — 'it's fine', 'does the job', 'nothing special'. The product works but doesn't impress. Common theme: decent value for the price but don't expect premium quality.",
  },
  {
    name: "few",
    minReviews: 3,
    maxReviews: 8,
    distribution: [10, 10, 20, 30, 30],
    promptHint: "This product has very few reviews. Generate a small number with varied opinions.",
  },
];

function getProfileForProduct(productId: string): ReviewProfile {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash * 31 + productId.charCodeAt(i)) | 0;
  }
  const bucket = Math.abs(hash) % 100;

  if (bucket < 40) return PROFILES[0]; // loved (40%)
  if (bucket < 65) return PROFILES[1]; // polarizing (25%)
  if (bucket < 85) return PROFILES[2]; // mediocre (20%)
  return PROFILES[3]; // few (15%)
}

function computeTargetRatings(
  total: number,
  distribution: [number, number, number, number, number],
): [number, number, number, number, number] {
  const raw = distribution.map((pct) => Math.round((pct / 100) * total));
  const diff = total - raw.reduce((a, b) => a + b, 0);
  const maxIdx = raw.indexOf(Math.max(...raw));
  raw[maxIdx] += diff;
  return raw as [number, number, number, number, number];
}

// -- prompt builder --

function buildPrompt(
  product: {
    title: string;
    brand: string;
    category: string;
    subcategory?: string;
    price: number;
    description: string;
    specifications?: Record<string, string>;
  },
  profile: ReviewProfile,
  totalReviews: number,
  targetRatings: [number, number, number, number, number],
): string {
  const specs = product.specifications
    ? Object.entries(product.specifications)
        .map(([k, val]) => `  ${k}: ${val}`)
        .join("\n")
    : "  (none listed)";

  const categoryLine = product.subcategory
    ? `${product.category} > ${product.subcategory}`
    : product.category;

  return `Generate exactly ${totalReviews} realistic customer reviews for this product.
Each review should feel like a real person wrote it on an e-commerce site.

Product: ${product.title}
Brand: ${product.brand}
Category: ${categoryLine}
Price: $${product.price}
Description: ${product.description}
Specs:
${specs}

Sentiment profile: ${profile.promptHint}

Target rating distribution (follow this closely):
- 5 stars: ${targetRatings[4]} reviews
- 4 stars: ${targetRatings[3]} reviews
- 3 stars: ${targetRatings[2]} reviews
- 2 stars: ${targetRatings[1]} reviews
- 1 star: ${targetRatings[0]} reviews

Requirements:
- Each review 1-4 sentences. Vary length naturally — some are one-liners, some are detailed.
- Mention SPECIFIC product attributes (build quality, performance, value, durability, design, etc.)
- Positive reviews: mention SPECIFIC things they like, not generic "great product!"
- Negative reviews: mention SPECIFIC complaints, not generic "terrible, don't buy"
- Create 2-3 recurring POSITIVE themes that multiple reviewers mention independently (e.g., "great battery life" in 8+ reviews)
- Create 1-2 recurring NEGATIVE themes that multiple reviewers mention (e.g., "scratches easily" in 4+ reviews)
- Vary writing styles: some verbose, some terse, some use caps for emphasis, a few have minor typos
- Some reviews mention how long they've owned the product ("after 3 months...", "day one impressions...")
- A few reviews compare to competitors or previous products they owned
- Names should be diverse (different ethnicities and genders)
- Do NOT use the exact phrases from specs/description — reviewers paraphrase in their own words
- Return exactly ${totalReviews} reviews`;
}

// -- zod schema for structured output --

const reviewsSchema = z.object({
  reviews: z.array(
    z.object({
      userName: z.string(),
      rating: z.number().int().min(1).max(5),
      text: z.string(),
    }),
  ),
});

// -- single product generation --

export const generateReviewsForProduct = internalAction({
  args: { productId: v.id("products") },
  returns: v.union(
    v.object({ success: v.literal(false), error: v.string() }),
    v.object({
      success: v.literal(true),
      product: v.string(),
      profile: v.string(),
      reviewCount: v.number(),
    }),
  ),
  handler: async (
    ctx,
    args,
  ): Promise<
    | { success: false; error: string }
    | { success: true; product: string; profile: string; reviewCount: number }
  > => {
    const product = await ctx.runQuery(internal.ai.generateReviewsHelpers.getProductForReview, {
      productId: args.productId,
    });
    if (!product) {
      console.error(`Product ${args.productId} not found, skipping`);
      return { success: false, error: "product not found" };
    }

    const profile = getProfileForProduct(args.productId);
    // deterministic count from hash
    let hash = 0;
    for (let i = 0; i < args.productId.length; i++) {
      hash = (hash * 17 + args.productId.charCodeAt(i)) | 0;
    }
    const range = profile.maxReviews - profile.minReviews;
    const totalReviews = profile.minReviews + (Math.abs(hash) % (range + 1));
    const targetRatings = computeTargetRatings(totalReviews, profile.distribution);

    console.log(`Generating ${totalReviews} reviews (${profile.name}) for: ${product.title}`);

    const prompt = buildPrompt(product, profile, totalReviews, targetRatings);

    const result = await generateObject({
      model: selectModel("review_summary"),
      schema: reviewsSchema,
      prompt,
    });

    const generated = result.object.reviews;

    // delete old reviews
    await ctx.runMutation(internal.ai.generateReviewsHelpers.deleteReviewsForProduct, {
      productId: args.productId,
    });

    // insert new reviews in batches of 25
    const now = Date.now();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

    for (let i = 0; i < generated.length; i += 25) {
      const batch = generated.slice(i, i + 25).map((r, idx) => ({
        productId: args.productId,
        clerkUserId: `fake_user_${((i + idx) % 50) + 1}`,
        userName: r.userName,
        rating: r.rating,
        text: r.text,
        createdAt: now - Math.floor(((i + idx) / generated.length) * ninetyDaysMs),
      }));

      await ctx.runMutation(internal.ai.generateReviewsHelpers.insertReviewsBatch, {
        reviews: batch,
      });
    }

    // update product rating
    await ctx.runMutation(internal.ai.generateReviewsHelpers.updateProductRating, {
      productId: args.productId,
    });

    console.log(`Done: ${product.title} — ${generated.length} reviews inserted`);

    return {
      success: true,
      product: product.title,
      profile: profile.name,
      reviewCount: generated.length,
    };
  },
});
