import {
  query,
  action,
  internalQuery,
  internalMutation,
  internalAction,
} from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import type { Id, Doc } from "./_generated/dataModel";
import {
  rankBySimilarity,
  buildCoOccurrenceMatrix,
  getTopCoOccurrences,
  computeTrendingScores,
  derivePreferences,
  applyMMR,
  type ProductAttrs,
  type ScoredItemWithMeta,
} from "./recommendationHelpers";

// -- public queries --

export const similarProducts = query({
  args: {
    productId: v.id("products"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const product = await ctx.db.get(args.productId);
    if (!product) return [];

    const candidates = await ctx.db
      .query("products")
      .withIndex("by_category", (q) => q.eq("category", product.category))
      .collect();

    const maxPrice = Math.max(...candidates.map((p) => p.price), 1);
    const toAttrs = (p: Doc<"products">): ProductAttrs => ({
      _id: p._id,
      category: p.category,
      brand: p.brand,
      tags: p.tags,
      useCases: p.useCases ?? undefined,
      goodFor: p.goodFor ?? undefined,
      price: p.price,
      rating: p.rating,
    });

    const scored = rankBySimilarity(toAttrs(product), candidates.map(toAttrs), maxPrice, limit * 2);

    const withMeta: ScoredItemWithMeta[] = scored.map((s) => {
      const p = candidates.find((c) => c._id === s._id)!;
      return { ...s, category: p.category, brand: p.brand };
    });

    const reranked = applyMMR(withMeta, 0.7, limit);
    const productIds = reranked.map((r) => r._id);
    return candidates.filter((p) => productIds.includes(p._id));
  },
});

export const frequentlyBoughtTogether = query({
  args: {
    productId: v.id("products"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 4;
    const coOccurrences = await ctx.db
      .query("productCoOccurrences")
      .withIndex("by_product_and_score", (q) => q.eq("productId", args.productId))
      .order("desc")
      .take(limit);

    const products = await Promise.all(
      coOccurrences.map(async (co) => {
        const product = await ctx.db.get(co.relatedProductId);
        return product ? { ...product, coScore: co.score } : null;
      }),
    );

    return products.filter(Boolean);
  },
});

export const trending = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    let products;
    if (args.category) {
      products = await ctx.db
        .query("products")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .collect();
    } else {
      products = await ctx.db.query("products").collect();
    }

    // sort by trendingScore if available, fallback to purchaseCount
    return products
      .sort((a, b) => (b.trendingScore ?? b.purchaseCount) - (a.trendingScore ?? a.purchaseCount))
      .slice(0, limit);
  },
});

export const forYou = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const identity = await ctx.auth.getUserIdentity();

    // anonymous → global trending
    if (!identity) {
      return ctx.db.query("products").withIndex("by_purchaseCount").order("desc").take(limit);
    }

    const userId = identity.subject;

    // get user's orders
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("clerkUserId", userId))
      .collect();
    const deliveredOrders = orders.filter((o) => o.status === "delivered");

    // get user's favorites
    const favorites = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("clerkUserId", userId))
      .collect();

    // collect purchased product IDs
    const purchasedIds = new Set<string>();
    for (const order of deliveredOrders) {
      for (const item of order.items) {
        purchasedIds.add(item.productId);
      }
    }

    const purchaseCount = purchasedIds.size;

    // get user preferences
    const prefs = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("clerkUserId", userId))
      .unique();

    // candidate collection
    const candidateScores = new Map<string, number>();

    if (purchaseCount >= 3) {
      // tier 1: co-occurrence from recent purchases + content similarity + category preference
      const recentPurchaseIds = [...purchasedIds].slice(0, 10);
      for (const pid of recentPurchaseIds) {
        const coOccs = await ctx.db
          .query("productCoOccurrences")
          .withIndex("by_product_and_score", (q) => q.eq("productId", pid as Id<"products">))
          .order("desc")
          .take(5);
        for (const co of coOccs) {
          if (!purchasedIds.has(co.relatedProductId)) {
            candidateScores.set(
              co.relatedProductId,
              (candidateScores.get(co.relatedProductId) ?? 0) + co.score,
            );
          }
        }
      }
    } else if (purchaseCount >= 1) {
      // tier 2: content-based similar to purchased + category trending
      for (const pid of purchasedIds) {
        const product = await ctx.db.get(pid as Id<"products">);
        if (!product) continue;
        const similar = await ctx.db
          .query("products")
          .withIndex("by_category", (q) => q.eq("category", product.category))
          .take(20);
        for (const s of similar) {
          if (!purchasedIds.has(s._id)) {
            candidateScores.set(s._id, (candidateScores.get(s._id) ?? 0) + 0.5);
          }
        }
      }
    } else if (favorites.length > 0) {
      // tier 3: similar to favorited items + trending
      for (const fav of favorites.slice(0, 5)) {
        const product = await ctx.db.get(fav.productId);
        if (!product) continue;
        const similar = await ctx.db
          .query("products")
          .withIndex("by_category", (q) => q.eq("category", product.category))
          .take(20);
        for (const s of similar) {
          if (s._id !== fav.productId) {
            candidateScores.set(s._id, (candidateScores.get(s._id) ?? 0) + 0.3);
          }
        }
      }
    }

    // if we have candidates, score and rank them
    if (candidateScores.size > 0) {
      // boost products in preferred categories
      if (prefs) {
        const prefCats = new Set(prefs.favoriteCategories);
        for (const [id, score] of candidateScores) {
          const product = await ctx.db.get(id as Id<"products">);
          if (product && prefCats.has(product.category)) {
            candidateScores.set(id, score * 1.3);
          }
        }
      }

      const sorted = [...candidateScores.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit * 2);

      const products = await Promise.all(
        sorted.map(async ([id]) => ctx.db.get(id as Id<"products">)),
      );

      const valid = products.filter(Boolean) as Doc<"products">[];

      // apply MMR
      const withMeta: ScoredItemWithMeta[] = valid.map((p) => ({
        _id: p._id,
        score: candidateScores.get(p._id) ?? 0,
        category: p.category,
        brand: p.brand,
      }));

      const reranked = applyMMR(withMeta, 0.7, limit);
      const ids = reranked.map((r) => r._id);
      return valid.filter((p) => ids.includes(p._id)).slice(0, limit);
    }

    // fallback: global trending
    return ctx.db.query("products").withIndex("by_purchaseCount").order("desc").take(limit);
  },
});

export const forCart = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("clerkUserId", identity.subject))
      .collect();

    if (cartItems.length === 0) return [];

    const cartProductIds = new Set(cartItems.map((i) => i.productId as string));
    const aggregated = new Map<string, number>();

    for (const cartItem of cartItems) {
      const coOccs = await ctx.db
        .query("productCoOccurrences")
        .withIndex("by_product_and_score", (q) => q.eq("productId", cartItem.productId))
        .order("desc")
        .take(10);

      for (const co of coOccs) {
        if (!cartProductIds.has(co.relatedProductId)) {
          aggregated.set(
            co.relatedProductId,
            (aggregated.get(co.relatedProductId) ?? 0) + co.score,
          );
        }
      }
    }

    const sorted = [...aggregated.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);

    const products = await Promise.all(
      sorted.map(async ([id]) => ctx.db.get(id as Id<"products">)),
    );

    return products.filter(Boolean);
  },
});

// -- internal queries --

export const getAllDeliveredOrders = internalQuery({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();
    return orders.filter((o) => o.status === "delivered");
  },
});

export const getAllProducts = internalQuery({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("products").collect();
  },
});

// -- internal mutations --

export const clearCoOccurrences = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("productCoOccurrences").collect();
    for (const row of all) {
      await ctx.db.delete(row._id);
    }
  },
});

export const insertCoOccurrencesBatch = internalMutation({
  args: {
    pairs: v.array(
      v.object({
        productIdA: v.string(),
        productIdB: v.string(),
        score: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const pair of args.pairs) {
      await ctx.db.insert("productCoOccurrences", {
        productId: pair.productIdA as Id<"products">,
        relatedProductId: pair.productIdB as Id<"products">,
        score: pair.score,
      });
    }
  },
});

export const patchTrendingScoresBatch = internalMutation({
  args: {
    scores: v.array(
      v.object({
        productId: v.string(),
        score: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const entry of args.scores) {
      await ctx.db.patch(entry.productId as Id<"products">, {
        trendingScore: entry.score,
      });
    }
  },
});

export const deriveUserPreferencesForUser = internalMutation({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("clerkUserId", args.clerkUserId))
      .collect();

    const deliveredOrders = orders.filter((o) => o.status === "delivered");
    if (deliveredOrders.length === 0) return;

    // build product lookup
    const allProductIds = new Set<string>();
    for (const order of deliveredOrders) {
      for (const item of order.items) {
        allProductIds.add(item.productId);
      }
    }

    const productLookup = new Map<string, { category: string; brand: string; tags: string[] }>();
    for (const pid of allProductIds) {
      const product = await ctx.db.get(pid as Id<"products">);
      if (product) {
        productLookup.set(pid, {
          category: product.category,
          brand: product.brand,
          tags: product.tags,
        });
      }
    }

    const prefs = derivePreferences(deliveredOrders, productLookup);

    // upsert
    const existing = await ctx.db
      .query("userPreferences")
      .withIndex("by_user", (q) => q.eq("clerkUserId", args.clerkUserId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...prefs,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("userPreferences", {
        clerkUserId: args.clerkUserId,
        ...prefs,
        updatedAt: Date.now(),
      });
    }
  },
});

// -- internal actions (orchestrators) --

export const recomputeCoOccurrences = internalAction({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.runQuery(internal.recommendations.getAllDeliveredOrders, {});

    const orderItems = orders.map((o: { items: { productId: string }[] }) =>
      o.items.map((i) => ({ productId: i.productId })),
    );

    const matrix = buildCoOccurrenceMatrix(orderItems, 2);
    const pairs = getTopCoOccurrences(matrix, 20);

    // clear existing
    await ctx.runMutation(internal.recommendations.clearCoOccurrences, {});

    // insert in batches of 200
    for (let i = 0; i < pairs.length; i += 200) {
      const batch = pairs.slice(i, i + 200).map((p) => ({
        productIdA: p.productIdA,
        productIdB: p.productIdB,
        score: p.score,
      }));
      await ctx.runMutation(internal.recommendations.insertCoOccurrencesBatch, { pairs: batch });
    }

    console.log(`Recomputed co-occurrences: ${pairs.length} pairs from ${orders.length} orders`);
  },
});

export const recomputeTrendingScores = internalAction({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.runQuery(internal.recommendations.getAllDeliveredOrders, {});

    const purchases: { productId: string; timestamp: number }[] = [];
    for (const order of orders) {
      for (const item of order.items) {
        purchases.push({
          productId: item.productId,
          timestamp: order.createdAt,
        });
      }
    }

    const scores = computeTrendingScores(purchases, Date.now(), 0.05);

    // patch in batches of 100
    const entries = [...scores.entries()].map(([productId, score]) => ({
      productId,
      score: Math.round(score * 1000) / 1000,
    }));

    for (let i = 0; i < entries.length; i += 100) {
      const batch = entries.slice(i, i + 100);
      await ctx.runMutation(internal.recommendations.patchTrendingScoresBatch, { scores: batch });
    }

    console.log(
      `Recomputed trending scores for ${entries.length} products from ${purchases.length} purchases`,
    );
  },
});

export const deriveAllUserPreferences = internalAction({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.runQuery(internal.recommendations.getAllDeliveredOrders, {});

    const userIds = [...new Set(orders.map((o: { clerkUserId: string }) => o.clerkUserId))];

    for (const userId of userIds) {
      await ctx.runMutation(internal.recommendations.deriveUserPreferencesForUser, {
        clerkUserId: userId,
      });
    }

    console.log(`Derived preferences for ${userIds.length} users`);
  },
});

// -- public initialization action (run once after seeding) --

export const initialize = action({
  args: {},
  handler: async (ctx) => {
    await ctx.runAction(internal.recommendations.recomputeCoOccurrences, {});
    await ctx.runAction(internal.recommendations.recomputeTrendingScores, {});
    await ctx.runAction(internal.recommendations.deriveAllUserPreferences, {});
    return "Recommendation data initialized successfully";
  },
});
