import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // -- categories --
  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    icon: v.optional(v.string()),
    parentId: v.optional(v.id("categories")),
    order: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_parent", ["parentId", "order"]),

  // -- products --
  products: defineTable({
    title: v.string(),
    description: v.string(),
    categoryId: v.id("categories"),
    category: v.string(),
    subcategory: v.optional(v.string()),
    price: v.number(),
    originalPrice: v.optional(v.number()),
    brand: v.string(),
    tags: v.array(v.string()),
    rating: v.number(),
    reviewCount: v.number(),
    images: v.array(v.string()),
    specifications: v.optional(v.record(v.string(), v.string())),
    stock: v.number(),
    isDeal: v.boolean(),
    dealExpiresAt: v.optional(v.number()),
    purchaseCount: v.number(),
    trendingScore: v.optional(v.number()),
    useCases: v.optional(v.array(v.string())),
    goodFor: v.optional(v.array(v.string())),
    discountPercent: v.optional(v.number()),
    embedding: v.optional(v.array(v.float64())),
  })
    .index("by_category", ["category"])
    .index("by_category_and_price", ["category", "price"])
    .index("by_category_and_rating", ["category", "rating"])
    .index("by_category_and_reviewCount", ["category", "reviewCount"])
    .index("by_category_and_purchaseCount", ["category", "purchaseCount"])
    .index("by_isDeal", ["isDeal", "dealExpiresAt"])
    .index("by_purchaseCount", ["purchaseCount"])
    .index("by_category_and_brand", ["category", "brand"])
    .index("by_category_and_discountPercent", ["category", "discountPercent"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["category"],
    })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 128,
      filterFields: ["category"],
    }),

  // -- reviews --
  reviews: defineTable({
    productId: v.id("products"),
    clerkUserId: v.string(),
    userName: v.string(),
    rating: v.number(),
    text: v.string(),
    createdAt: v.number(),
  })
    .index("by_product", ["productId", "createdAt"])
    .index("by_user", ["clerkUserId"]),

  // -- cart items --
  cartItems: defineTable({
    clerkUserId: v.string(),
    productId: v.id("products"),
    quantity: v.number(),
  })
    .index("by_user", ["clerkUserId"])
    .index("by_user_and_product", ["clerkUserId", "productId"]),

  // -- favorites --
  favorites: defineTable({
    clerkUserId: v.string(),
    productId: v.id("products"),
    createdAt: v.number(),
  })
    .index("by_user", ["clerkUserId", "createdAt"])
    .index("by_user_and_product", ["clerkUserId", "productId"]),

  // -- orders --
  orders: defineTable({
    clerkUserId: v.string(),
    orderNumber: v.number(),
    items: v.array(
      v.object({
        productId: v.id("products"),
        title: v.string(),
        image: v.string(),
        price: v.number(),
        quantity: v.number(),
      }),
    ),
    total: v.number(),
    status: v.union(v.literal("delivered"), v.literal("cancelled")),
    shippingAddress: v.object({
      name: v.string(),
      address: v.string(),
      city: v.string(),
      phone: v.string(),
    }),
    createdAt: v.number(),
  })
    .index("by_user", ["clerkUserId", "createdAt"])
    .index("by_user_and_status", ["clerkUserId", "status", "createdAt"]),

  // -- user preferences (phase 3) --
  userPreferences: defineTable({
    clerkUserId: v.string(),
    favoriteCategories: v.array(v.string()),
    priceRange: v.object({
      min: v.number(),
      max: v.number(),
    }),
    favoriteBrands: v.array(v.string()),
    interestTags: v.array(v.string()),
    updatedAt: v.number(),
  }).index("by_user", ["clerkUserId"]),

  // -- co-occurrences (phase 3) --
  productCoOccurrences: defineTable({
    productId: v.id("products"),
    relatedProductId: v.id("products"),
    score: v.number(),
  }).index("by_product_and_score", ["productId", "score"]),

  // -- co-occurrence aggregation (phase 3, temporary) --
  coOccurrenceAggregation: defineTable({
    productIdA: v.id("products"),
    productIdB: v.id("products"),
    count: v.number(),
    batchId: v.string(),
  })
    .index("by_batch", ["batchId"])
    .index("by_product_pair", ["productIdA", "productIdB"]),

  // -- behavior sessions (phase 4) --
  behaviorSessions: defineTable({
    clerkUserId: v.optional(v.string()),
    sessionId: v.string(),
    productsViewed: v.array(
      v.object({
        productId: v.id("products"),
        dwellTimeMs: v.number(),
        scrollDepth: v.number(),
        cursorHoverMs: v.number(),
        viewedReviews: v.boolean(),
        timestamp: v.number(),
      }),
    ),
    currentPage: v.string(),
    cartProductIds: v.array(v.id("products")),
    updatedAt: v.number(),
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["clerkUserId"]),

  // -- AI suggestions (phase 6) --
  suggestions: defineTable({
    clerkUserId: v.optional(v.string()),
    sessionId: v.string(),
    triggerType: v.string(),
    triggerProductId: v.id("products"),
    suggestedProducts: v.array(
      v.object({
        productId: v.id("products"),
        reason: v.string(),
      }),
    ),
    message: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("ready"),
      v.literal("shown"),
      v.literal("dismissed"),
      v.literal("clicked"),
    ),
    createdAt: v.number(),
  }).index("by_session_and_status", ["sessionId", "status"]),
});
