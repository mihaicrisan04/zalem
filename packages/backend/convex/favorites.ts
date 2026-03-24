import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const favs = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("clerkUserId", identity.subject))
      .order("desc")
      .collect();

    const withProducts = await Promise.all(
      favs.map(async (fav) => {
        const product = await ctx.db.get(fav.productId);
        return product ? { ...fav, product } : null;
      }),
    );

    return withProducts.filter(Boolean);
  },
});

export const toggle = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_product", (q) =>
        q.eq("clerkUserId", identity.subject).eq("productId", args.productId),
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }

    await ctx.db.insert("favorites", {
      clerkUserId: identity.subject,
      productId: args.productId,
      createdAt: Date.now(),
    });
    return true;
  },
});

export const isProductFavorited = query({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return false;

    const fav = await ctx.db
      .query("favorites")
      .withIndex("by_user_and_product", (q) =>
        q.eq("clerkUserId", identity.subject).eq("productId", args.productId),
      )
      .unique();

    return fav !== null;
  },
});

export const batchCheck = query({
  args: { productIds: v.array(v.id("products")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const results = await Promise.all(
      args.productIds.map(async (productId) => {
        const fav = await ctx.db
          .query("favorites")
          .withIndex("by_user_and_product", (q) =>
            q.eq("clerkUserId", identity.subject).eq("productId", productId),
          )
          .unique();
        return fav ? productId : null;
      }),
    );

    return results.filter(Boolean) as string[];
  },
});
