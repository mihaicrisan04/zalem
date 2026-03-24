import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("clerkUserId", identity.subject))
      .collect();

    const withProducts = await Promise.all(
      items.map(async (item) => {
        const product = await ctx.db.get(item.productId);
        return product ? { ...item, product } : null;
      }),
    );

    return withProducts.filter(Boolean);
  },
});

export const add = mutation({
  args: { productId: v.id("products"), quantity: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const existing = await ctx.db
      .query("cartItems")
      .withIndex("by_user_and_product", (q) =>
        q.eq("clerkUserId", identity.subject).eq("productId", args.productId),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        quantity: existing.quantity + (args.quantity ?? 1),
      });
    } else {
      await ctx.db.insert("cartItems", {
        clerkUserId: identity.subject,
        productId: args.productId,
        quantity: args.quantity ?? 1,
      });
    }
  },
});

export const remove = mutation({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const item = await ctx.db
      .query("cartItems")
      .withIndex("by_user_and_product", (q) =>
        q.eq("clerkUserId", identity.subject).eq("productId", args.productId),
      )
      .unique();

    if (item) {
      await ctx.db.delete(item._id);
    }
  },
});

export const updateQuantity = mutation({
  args: { productId: v.id("products"), quantity: v.number() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const item = await ctx.db
      .query("cartItems")
      .withIndex("by_user_and_product", (q) =>
        q.eq("clerkUserId", identity.subject).eq("productId", args.productId),
      )
      .unique();

    if (!item) return;

    if (args.quantity <= 0) {
      await ctx.db.delete(item._id);
    } else {
      await ctx.db.patch(item._id, { quantity: args.quantity });
    }
  },
});

export const count = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;

    const items = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("clerkUserId", identity.subject))
      .collect();

    return items.reduce((sum, item) => sum + item.quantity, 0);
  },
});
