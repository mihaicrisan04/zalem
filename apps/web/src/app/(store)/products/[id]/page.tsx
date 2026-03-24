"use client";

import { use } from "react";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import type { Id } from "@zalem/backend/convex/_generated/dataModel";

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ProductDetailClient productId={id as Id<"products">} />;
}
