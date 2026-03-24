import { createTool } from "@convex-dev/agent";
import { z } from "zod/v3";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";

export const getProductDetails = createTool({
  description:
    "Get detailed information about a specific product including price, rating, specs, and description. Use when the user asks about a product they are viewing or mentions a product by name.",
  inputSchema: z.object({
    productId: z.string().describe("The product ID to look up"),
  }),
  execute: async (ctx, { productId }): Promise<Record<string, unknown>> => {
    const product = await ctx.runQuery(api.products.get, {
      id: productId as Id<"products">,
    });
    if (!product) return { error: "Product not found" };
    return {
      id: product._id,
      title: product.title,
      category: product.category,
      brand: product.brand,
      price: product.price,
      originalPrice: product.originalPrice,
      rating: product.rating,
      reviewCount: product.reviewCount,
      stock: product.stock,
      description: product.description,
      specifications: product.specifications,
      discountPercent: product.discountPercent,
    };
  },
});

export const searchProducts = createTool({
  description:
    "Search the product catalog by name or description. Use when the user wants to find products (e.g. 'find me a laptop', 'show me headphones').",
  inputSchema: z.object({
    query: z.string().describe("Search query text"),
    limit: z.number().optional().describe("Max results to return (default 5, max 8)"),
  }),
  execute: async (ctx, { query, limit }): Promise<Record<string, unknown>[]> => {
    const numItems = Math.min(limit ?? 5, 8);
    const results = await ctx.runQuery(api.products.search, {
      query,
      paginationOpts: { cursor: null, numItems },
    });
    return results.page.map((p: any) => ({
      id: p._id,
      title: p.title,
      category: p.category,
      brand: p.brand,
      price: p.price,
      rating: p.rating,
      reviewCount: p.reviewCount,
    }));
  },
});

export const getRecommendations = createTool({
  description:
    "Get product recommendations related to a specific product. Use 'similar' for alternatives, 'frequently_bought_together' for complementary products, 'trending' for popular items.",
  inputSchema: z.object({
    productId: z.string().describe("The product ID to get recommendations for"),
    type: z
      .enum(["similar", "frequently_bought_together", "trending"])
      .optional()
      .describe("Type of recommendations (default: similar)"),
  }),
  execute: async (ctx, { productId, type }): Promise<Record<string, unknown>[]> => {
    const id = productId as Id<"products">;
    const recType = type ?? "similar";

    let products: any[];
    switch (recType) {
      case "similar":
        products = await ctx.runQuery(api.recommendations.similarProducts, {
          productId: id,
          limit: 6,
        });
        break;
      case "frequently_bought_together":
        products = await ctx.runQuery(api.recommendations.frequentlyBoughtTogether, {
          productId: id,
          limit: 6,
        });
        break;
      case "trending":
        products = await ctx.runQuery(api.recommendations.trending, { limit: 6 });
        break;
    }

    return products.map((p: any) => ({
      id: p._id,
      title: p.title,
      category: p.category,
      brand: p.brand,
      price: p.price,
      rating: p.rating,
      source: recType,
    }));
  },
});

export const getCartContents = createTool({
  description:
    "Get the current contents of the user's shopping cart. Use when the user mentions their cart, asks about checkout, or wants suggestions based on what they're buying.",
  inputSchema: z.object({}),
  execute: async (ctx): Promise<Record<string, unknown>[]> => {
    const items = await ctx.runQuery(api.cart.list);
    return items.map((item: any) => ({
      id: item.product?._id,
      title: item.product?.title,
      category: item.product?.category,
      price: item.product?.price,
      quantity: item.quantity,
    }));
  },
});

export const getReviewsSummary = createTool({
  description:
    "Get review statistics and sample reviews for a product. Use when the user asks what buyers think, whether a product is good, or wants to understand pros and cons.",
  inputSchema: z.object({
    productId: z.string().describe("The product ID to get reviews for"),
  }),
  execute: async (ctx, { productId }): Promise<Record<string, unknown>> => {
    const id = productId as Id<"products">;

    const [aggregate, reviewsPage] = await Promise.all([
      ctx.runQuery(api.reviews.getAggregateByProduct, { productId: id }),
      ctx.runQuery(api.reviews.listByProduct, {
        productId: id,
        paginationOpts: { cursor: null, numItems: 5 },
      }),
    ]);

    return {
      total: aggregate?.total ?? 0,
      average: aggregate?.average ?? 0,
      distribution: aggregate?.distribution ?? [0, 0, 0, 0, 0],
      topReviews: reviewsPage.page.map((r: any) => ({
        rating: r.rating,
        text: r.text,
        userName: r.userName,
      })),
    };
  },
});
