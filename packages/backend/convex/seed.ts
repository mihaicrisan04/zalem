import { action, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// -- category definitions --

const CATEGORIES = [
  {
    name: "Smartphones",
    slug: "smartphones",
    icon: "Smartphone",
    children: [
      { name: "Android Phones", slug: "android-phones" },
      { name: "iPhones", slug: "iphones" },
      { name: "Phone Cases", slug: "phone-cases" },
    ],
  },
  {
    name: "Laptops",
    slug: "laptops",
    icon: "Laptop",
    children: [
      { name: "Gaming Laptops", slug: "gaming-laptops" },
      { name: "Ultrabooks", slug: "ultrabooks" },
      { name: "Laptop Accessories", slug: "laptop-accessories" },
    ],
  },
  {
    name: "Tablets",
    slug: "tablets",
    icon: "Tablet",
    children: [
      { name: "iPads", slug: "ipads" },
      { name: "Android Tablets", slug: "android-tablets" },
    ],
  },
  {
    name: "Audio",
    slug: "audio",
    icon: "Headphones",
    children: [
      { name: "Headphones", slug: "headphones" },
      { name: "Speakers", slug: "speakers" },
      { name: "Earbuds", slug: "earbuds" },
    ],
  },
  {
    name: "Home & Kitchen",
    slug: "home-kitchen",
    icon: "Home",
    children: [
      { name: "Furniture", slug: "furniture" },
      { name: "Kitchen", slug: "kitchen" },
      { name: "Lighting", slug: "lighting" },
      { name: "Decoration", slug: "decoration" },
    ],
  },
  {
    name: "Fashion",
    slug: "fashion",
    icon: "Shirt",
    children: [
      { name: "Men's Clothing", slug: "mens-clothing" },
      { name: "Women's Clothing", slug: "womens-clothing" },
      { name: "Shoes", slug: "shoes" },
      { name: "Watches", slug: "watches" },
      { name: "Sunglasses", slug: "sunglasses" },
    ],
  },
  {
    name: "Beauty",
    slug: "beauty",
    icon: "Sparkles",
    children: [
      { name: "Skincare", slug: "skincare" },
      { name: "Fragrances", slug: "fragrances" },
    ],
  },
  {
    name: "Sports & Auto",
    slug: "sports-auto",
    icon: "Bike",
    children: [
      { name: "Sports Equipment", slug: "sports-equipment" },
      { name: "Automotive", slug: "automotive" },
      { name: "Motorcycle", slug: "motorcycle" },
    ],
  },
];

// map DummyJSON categories to our categories
const CATEGORY_MAP: Record<string, { parent: string; sub?: string }> = {
  smartphones: { parent: "Smartphones", sub: "Android Phones" },
  laptops: { parent: "Laptops" },
  tablets: { parent: "Tablets" },
  "mobile-accessories": { parent: "Smartphones", sub: "Phone Cases" },
  furniture: { parent: "Home & Kitchen", sub: "Furniture" },
  "home-decoration": { parent: "Home & Kitchen", sub: "Decoration" },
  "kitchen-accessories": { parent: "Home & Kitchen", sub: "Kitchen" },
  groceries: { parent: "Home & Kitchen", sub: "Kitchen" },
  fragrances: { parent: "Beauty", sub: "Fragrances" },
  "skin-care": { parent: "Beauty", sub: "Skincare" },
  beauty: { parent: "Beauty", sub: "Skincare" },
  tops: { parent: "Fashion", sub: "Women's Clothing" },
  "womens-dresses": { parent: "Fashion", sub: "Women's Clothing" },
  "womens-jewellery": { parent: "Fashion", sub: "Women's Clothing" },
  "womens-bags": { parent: "Fashion", sub: "Women's Clothing" },
  "womens-shoes": { parent: "Fashion", sub: "Shoes" },
  "womens-watches": { parent: "Fashion", sub: "Watches" },
  "mens-shirts": { parent: "Fashion", sub: "Men's Clothing" },
  "mens-shoes": { parent: "Fashion", sub: "Shoes" },
  "mens-watches": { parent: "Fashion", sub: "Watches" },
  sunglasses: { parent: "Fashion", sub: "Sunglasses" },
  vehicle: { parent: "Sports & Auto", sub: "Automotive" },
  motorcycle: { parent: "Sports & Auto", sub: "Motorcycle" },
  "sports-accessories": { parent: "Sports & Auto", sub: "Sports Equipment" },
};

// -- seed action --

export const run = action({
  args: {},
  handler: async (ctx) => {
    // check if already seeded
    const existingCategories = await ctx.runQuery(internal.seed.checkSeeded, {});
    if (existingCategories > 0) {
      return "Already seeded. Delete all data first to re-seed.";
    }

    // 1. insert categories
    const categoryMap = await ctx.runMutation(internal.seed.insertCategories, {});

    // 2. fetch products from DummyJSON and insert
    const response = await fetch("https://dummyjson.com/products?limit=0");
    const data = (await response.json()) as {
      products: DummyProduct[];
    };

    const productIds: Id<"products">[] = [];
    const batchSize = 20;

    for (let i = 0; i < data.products.length; i += batchSize) {
      const batch = data.products.slice(i, i + batchSize);
      const mapped = batch
        .map((p) => mapProduct(p, categoryMap))
        .filter(Boolean) as MappedProduct[];

      if (mapped.length > 0) {
        const ids = await ctx.runMutation(internal.seed.insertProductsBatch, {
          products: mapped,
        });
        productIds.push(...(ids as Id<"products">[]));
      }
    }

    // 3. generate reviews
    const { faker } = await import("@faker-js/faker");
    faker.seed(42);

    const reviewBatches = [];
    for (const productId of productIds) {
      const numReviews = faker.number.int({ min: 1, max: 8 });
      for (let i = 0; i < numReviews; i++) {
        reviewBatches.push({
          productId,
          clerkUserId: `fake_user_${faker.number.int({ min: 1, max: 50 })}`,
          userName: faker.person.fullName(),
          rating: faker.helpers.weightedArrayElement([
            { value: 5, weight: 40 },
            { value: 4, weight: 30 },
            { value: 3, weight: 15 },
            { value: 2, weight: 10 },
            { value: 1, weight: 5 },
          ]),
          text: faker.helpers.arrayElement([
            faker.lorem.sentences({ min: 1, max: 3 }),
            `${faker.commerce.productAdjective()} product! ${faker.lorem.sentence()}`,
            `${faker.helpers.arrayElement(["Great", "Good", "Decent", "Amazing", "Terrible", "Disappointing"])} quality. ${faker.lorem.sentence()}`,
          ]),
          createdAt: Date.now() - faker.number.int({ min: 0, max: 90 * 24 * 60 * 60 * 1000 }),
        });
      }
    }

    for (let i = 0; i < reviewBatches.length; i += 25) {
      const batch = reviewBatches.slice(i, i + 25);
      await ctx.runMutation(internal.seed.insertReviewsBatch, {
        reviews: batch,
      });
    }

    // 4. generate orders
    const personas = [
      { id: "tech", categories: ["Smartphones", "Laptops", "Tablets", "Audio"], weight: 3 },
      { id: "home", categories: ["Home & Kitchen"], weight: 2 },
      { id: "fashion", categories: ["Fashion", "Beauty"], weight: 2 },
      { id: "sports", categories: ["Sports & Auto"], weight: 1 },
    ];

    const allProducts = (await ctx.runMutation(internal.seed.getAllProducts, {})) as {
      _id: Id<"products">;
      title: string;
      category: string;
      price: number;
      images: string[];
    }[];

    for (let batch = 0; batch < 10; batch++) {
      const orders = [];
      for (let i = 0; i < 50; i++) {
        const userId = `fake_user_${faker.number.int({ min: 1, max: 50 })}`;
        const persona = faker.helpers.weightedArrayElement(
          personas.map((p) => ({ value: p, weight: p.weight })),
        );
        const numItems = faker.number.int({ min: 1, max: 5 });

        const eligibleProducts = allProducts.filter((p) => persona.categories.includes(p.category));
        if (eligibleProducts.length === 0) continue;

        const items = [];
        let total = 0;
        const selected = faker.helpers.arrayElements(
          eligibleProducts,
          Math.min(numItems, eligibleProducts.length),
        );

        for (const product of selected) {
          const qty = faker.number.int({ min: 1, max: 3 });
          items.push({
            productId: product._id,
            title: product.title,
            image: product.images[0] ?? "",
            price: product.price,
            quantity: qty,
          });
          total += product.price * qty;
        }

        orders.push({
          clerkUserId: userId,
          orderNumber: batch * 50 + i + 1001,
          items,
          total: Math.round(total * 100) / 100,
          status: faker.helpers.weightedArrayElement([
            { value: "delivered" as const, weight: 85 },
            { value: "cancelled" as const, weight: 15 },
          ]),
          shippingAddress: {
            name: faker.person.fullName(),
            address: faker.location.streetAddress(),
            city: faker.location.city(),
            phone: faker.phone.number(),
          },
          createdAt: Date.now() - faker.number.int({ min: 0, max: 90 * 24 * 60 * 60 * 1000 }),
        });
      }

      await ctx.runMutation(internal.seed.insertOrdersBatch, { orders });
    }

    // 5. update product ratings from reviews
    for (let i = 0; i < productIds.length; i += 25) {
      const batch = productIds.slice(i, i + 25);
      await ctx.runMutation(internal.seed.updateProductRatings, {
        productIds: batch,
      });
    }

    return `Seeded ${productIds.length} products, ${reviewBatches.length} reviews, ~500 orders`;
  },
});

// -- internal queries/mutations --

export const checkSeeded = internalQuery({
  args: {},
  handler: async (ctx) => {
    const cats = await ctx.db.query("categories").take(1);
    return cats.length;
  },
});

export const insertCategories = internalMutation({
  args: {},
  handler: async (ctx) => {
    const categoryMap: Record<string, Id<"categories">> = {};

    for (let i = 0; i < CATEGORIES.length; i++) {
      const cat = CATEGORIES[i];
      const parentId = await ctx.db.insert("categories", {
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        order: i,
      });
      categoryMap[cat.name] = parentId;

      for (let j = 0; j < cat.children.length; j++) {
        const child = cat.children[j];
        const childId = await ctx.db.insert("categories", {
          name: child.name,
          slug: child.slug,
          parentId,
          order: j,
        });
        categoryMap[child.name] = childId;
      }
    }

    return categoryMap;
  },
});

export const insertProductsBatch = internalMutation({
  args: {
    products: v.array(
      v.object({
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
        discountPercent: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const ids = [];
    for (const product of args.products) {
      const id = await ctx.db.insert("products", product);
      ids.push(id);
    }
    return ids;
  },
});

export const insertReviewsBatch = internalMutation({
  args: {
    reviews: v.array(
      v.object({
        productId: v.id("products"),
        clerkUserId: v.string(),
        userName: v.string(),
        rating: v.number(),
        text: v.string(),
        createdAt: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const review of args.reviews) {
      await ctx.db.insert("reviews", review);
    }
  },
});

export const insertOrdersBatch = internalMutation({
  args: {
    orders: v.array(
      v.object({
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
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const order of args.orders) {
      await ctx.db.insert("orders", order);
    }
  },
});

export const getAllProducts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    return products.map((p) => ({
      _id: p._id,
      title: p.title,
      category: p.category,
      price: p.price,
      images: p.images,
    }));
  },
});

export const updateProductRatings = internalMutation({
  args: { productIds: v.array(v.id("products")) },
  handler: async (ctx, args) => {
    for (const productId of args.productIds) {
      const reviews = await ctx.db
        .query("reviews")
        .withIndex("by_product", (q) => q.eq("productId", productId))
        .collect();

      if (reviews.length > 0) {
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await ctx.db.patch(productId, {
          rating: Math.round(avg * 10) / 10,
          reviewCount: reviews.length,
        });
      }
    }
  },
});

// -- helpers --

interface DummyProduct {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand?: string;
  images: string[];
  thumbnail: string;
  dimensions?: { width: number; height: number; depth: number };
  weight?: number;
  warrantyInformation?: string;
  shippingInformation?: string;
}

interface MappedProduct {
  title: string;
  description: string;
  categoryId: Id<"categories">;
  category: string;
  subcategory?: string;
  price: number;
  originalPrice?: number;
  brand: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  images: string[];
  specifications?: Record<string, string>;
  stock: number;
  isDeal: boolean;
  dealExpiresAt?: number;
  purchaseCount: number;
  discountPercent?: number;
}

function mapProduct(
  p: DummyProduct,
  categoryMap: Record<string, Id<"categories">>,
): MappedProduct | null {
  const mapping = CATEGORY_MAP[p.category];
  if (!mapping) return null;

  const categoryId = categoryMap[mapping.parent];
  if (!categoryId) return null;

  const originalPrice =
    p.discountPercentage > 0
      ? Math.round((p.price / (1 - p.discountPercentage / 100)) * 100) / 100
      : undefined;

  const discountPercent = p.discountPercentage > 0 ? Math.round(p.discountPercentage) : undefined;

  const specs: Record<string, string> = {};
  if (p.brand) specs["Brand"] = p.brand;
  if (p.dimensions)
    specs["Dimensions"] =
      `${p.dimensions.width} x ${p.dimensions.height} x ${p.dimensions.depth} cm`;
  if (p.weight) specs["Weight"] = `${p.weight} kg`;
  if (p.warrantyInformation) specs["Warranty"] = p.warrantyInformation;
  if (p.shippingInformation) specs["Shipping"] = p.shippingInformation;

  return {
    title: p.title,
    description: p.description,
    categoryId,
    category: mapping.parent,
    subcategory: mapping.sub,
    price: p.price,
    originalPrice,
    brand: p.brand ?? "Generic",
    tags: p.tags ?? [],
    rating: p.rating,
    reviewCount: 0,
    images: p.images.length > 0 ? p.images : [p.thumbnail],
    specifications: Object.keys(specs).length > 0 ? specs : undefined,
    stock: p.stock,
    isDeal: p.discountPercentage > 15,
    dealExpiresAt: p.discountPercentage > 15 ? Date.now() + 7 * 24 * 60 * 60 * 1000 : undefined,
    purchaseCount: Math.floor(Math.random() * 500),
    discountPercent,
  };
}
