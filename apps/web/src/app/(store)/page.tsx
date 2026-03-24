"use client";

import { useQuery } from "convex/react";
import { api } from "@zalem/backend/convex/_generated/api";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { DealsSection } from "@/components/home/deals-section";
import { CategoryGrid } from "@/components/home/category-grid";
import { ProductRow } from "@/components/product-row";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";

export default function HomePage() {
  const trending = useQuery(api.products.listTrending, {});
  const { recentlyViewedIds } = useRecentlyViewed();
  const recentProducts = useQuery(
    api.products.getByIds,
    recentlyViewedIds.length > 0 ? { ids: recentlyViewedIds as any } : "skip",
  );

  return (
    <div className="container mx-auto space-y-10 px-4 py-6">
      <HeroCarousel />
      <DealsSection />
      <ProductRow title="Trending" products={trending} isLoading={trending === undefined} />
      <ProductRow
        title="Recommended for you"
        products={trending}
        isLoading={trending === undefined}
      />
      <CategoryGrid />
      {recentProducts && recentProducts.length > 0 && (
        <ProductRow title="Recently viewed" products={recentProducts as any} />
      )}
    </div>
  );
}
