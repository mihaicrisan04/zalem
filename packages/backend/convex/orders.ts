import { query, mutation } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const listByUser = query({
  args: {
    status: v.optional(v.union(v.literal("delivered"), v.literal("cancelled"))),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { page: [], isDone: true, continueCursor: "" };

    if (args.status) {
      return ctx.db
        .query("orders")
        .withIndex("by_user_and_status", (q) =>
          q.eq("clerkUserId", identity.subject).eq("status", args.status!),
        )
        .order("desc")
        .paginate(args.paginationOpts);
    }

    return ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("clerkUserId", identity.subject))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const get = query({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const order = await ctx.db.get(args.id);
    if (!order || order.clerkUserId !== identity.subject) {
      throw new ConvexError("Order not found");
    }
    return order;
  },
});

export const checkout = mutation({
  args: {
    shippingAddress: v.object({
      name: v.string(),
      address: v.string(),
      city: v.string(),
      phone: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const cartItems = await ctx.db
      .query("cartItems")
      .withIndex("by_user", (q) => q.eq("clerkUserId", identity.subject))
      .collect();

    if (cartItems.length === 0) {
      throw new ConvexError("Cart is empty");
    }

    // snapshot products
    const items = [];
    let total = 0;
    for (const cartItem of cartItems) {
      const product = await ctx.db.get(cartItem.productId);
      if (!product) continue;
      items.push({
        productId: cartItem.productId,
        title: product.title,
        image: product.images[0] ?? "",
        price: product.price,
        quantity: cartItem.quantity,
      });
      total += product.price * cartItem.quantity;

      // increment purchase count
      await ctx.db.patch(cartItem.productId, {
        purchaseCount: product.purchaseCount + cartItem.quantity,
      });
    }

    // generate order number
    const lastOrder = await ctx.db.query("orders").order("desc").first();
    const orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1001;

    // create order
    const orderId = await ctx.db.insert("orders", {
      clerkUserId: identity.subject,
      orderNumber,
      items,
      total: Math.round(total * 100) / 100,
      status: "delivered",
      shippingAddress: args.shippingAddress,
      createdAt: Date.now(),
    });

    // clear cart
    for (const cartItem of cartItems) {
      await ctx.db.delete(cartItem._id);
    }

    return orderId;
  },
});
