"use client";

import { useQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { api } from "@zalem/backend/convex/_generated/api";
import { ProductGrid } from "@/components/product-grid";
import { ProductGridSkeleton } from "@/components/product-card-skeleton";
import { Button } from "@zalem/ui/components/optics/button";

export default function FavoritesPage() {
  const { isSignedIn } = useAuth();
  const favorites = useQuery(api.favorites.list);

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">My Favorites</h1>
        <p className="text-muted-foreground mt-2">Sign in to view your favorites.</p>
      </div>
    );
  }

  if (favorites === undefined) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="mb-6 text-2xl font-bold">My Favorites</h1>
        <ProductGridSkeleton count={8} />
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">My Favorites</h1>
        <p className="text-muted-foreground mb-6">You haven&apos;t saved any favorites yet.</p>
        <Button render={<Link href="/" />} nativeButton={false}>
          Browse products
        </Button>
      </div>
    );
  }

  const products = favorites.map((f) => f.product).filter(Boolean);
  const favoritedIds = products.map((p) => p!._id);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">My Favorites ({products.length})</h1>
      <ProductGrid products={products as any} favoritedIds={favoritedIds} />
    </div>
  );
}
