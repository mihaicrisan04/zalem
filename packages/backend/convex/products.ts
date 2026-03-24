import { query } from "./_generated/server";
import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";

export const get = query({
  args: { id: v.id("products") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.id);
  },
});

export const listByCategory = query({
  args: {
    category: v.string(),
    sort: v.optional(
      v.union(
        v.literal("popular"),
        v.literal("newest"),
        v.literal("price_asc"),
        v.literal("price_desc"),
        v.literal("reviews"),
        v.literal("discount"),
      ),
    ),
    minPrice: v.optional(v.number()),
    maxPrice: v.optional(v.number()),
    brands: v.optional(v.array(v.string())),
    minRating: v.optional(v.number()),
    inStock: v.optional(v.boolean()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const sort = args.sort ?? "popular";

    let q;
    switch (sort) {
      case "popular":
        q = ctx.db
          .query("products")
          .withIndex("by_category_and_purchaseCount", (i) => i.eq("category", args.category))
          .order("desc");
        break;
      case "newest":
        q = ctx.db
          .query("products")
          .withIndex("by_category", (i) => i.eq("category", args.category))
          .order("desc");
        break;
      case "price_asc":
        q = ctx.db
          .query("products")
          .withIndex("by_category_and_price", (i) => i.eq("category", args.category))
          .order("asc");
        break;
      case "price_desc":
        q = ctx.db
          .query("products")
          .withIndex("by_category_and_price", (i) => i.eq("category", args.category))
          .order("desc");
        break;
      case "reviews":
        q = ctx.db
          .query("products")
          .withIndex("by_category_and_reviewCount", (i) => i.eq("category", args.category))
          .order("desc");
        break;
      case "discount":
        q = ctx.db
          .query("products")
          .withIndex("by_category_and_discountPercent", (i) => i.eq("category", args.category))
          .order("desc");
        break;
    }

    const { minPrice, maxPrice, minRating, inStock } = args;
    const hasFilters =
      minPrice !== undefined || maxPrice !== undefined || minRating !== undefined || inStock;

    const filtered = hasFilters
      ? q.filter((p) => {
          const conditions = [];
          if (minPrice !== undefined) conditions.push(p.gte(p.field("price"), minPrice));
          if (maxPrice !== undefined) conditions.push(p.lte(p.field("price"), maxPrice));
          if (minRating !== undefined) conditions.push(p.gte(p.field("rating"), minRating));
          if (inStock) conditions.push(p.gt(p.field("stock"), 0));
          return conditions.reduce((acc, c) => p.and(acc, c));
        })
      : q;

    const results = await filtered.paginate(args.paginationOpts);

    // client-side brand filter (after pagination to keep it simple)
    if (args.brands && args.brands.length > 0) {
      const brandSet = new Set(args.brands);
      return {
        ...results,
        page: results.page.filter((p) => brandSet.has(p.brand)),
      };
    }

    return results;
  },
});

export const listDeals = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const deals = await ctx.db
      .query("products")
      .withIndex("by_isDeal", (q) => q.eq("isDeal", true))
      .collect();
    return deals.filter((d) => !d.dealExpiresAt || d.dealExpiresAt > now).slice(0, 6);
  },
});

export const listTrending = query({
  args: { category: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    if (args.category) {
      const category = args.category;
      return ctx.db
        .query("products")
        .withIndex("by_category_and_purchaseCount", (q) => q.eq("category", category))
        .order("desc")
        .take(limit);
    }
    return ctx.db.query("products").withIndex("by_purchaseCount").order("desc").take(limit);
  },
});

export const search = query({
  args: {
    query: v.string(),
    category: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const filter = args.category ? { category: args.category } : undefined;
    return ctx.db
      .query("products")
      .withSearchIndex("search_title", (q) => {
        let sq = q.search("title", args.query);
        if (filter) {
          sq = sq.eq("category", filter.category);
        }
        return sq;
      })
      .paginate(args.paginationOpts);
  },
});

export const autocomplete = query({
  args: { query: v.string() },
  handler: async (ctx, args) => {
    if (args.query.length < 2) return [];
    const results = await ctx.db
      .query("products")
      .withSearchIndex("search_title", (q) => q.search("title", args.query))
      .take(8);
    return results.map((p) => ({
      _id: p._id,
      title: p.title,
      image: p.images[0] ?? "",
      price: p.price,
    }));
  },
});

export const getByIds = query({
  args: { ids: v.array(v.id("products")) },
  handler: async (ctx, args) => {
    const products = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return products.filter(Boolean);
  },
});
