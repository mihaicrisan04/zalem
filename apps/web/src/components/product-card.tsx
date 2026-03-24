"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import { api } from "@zalem/backend/convex/_generated/api";
import type { Id } from "@zalem/backend/convex/_generated/dataModel";
import { Button } from "@zalem/ui/components/optics/button";
import { Badge } from "@zalem/ui/components/optics/badge";
import { cn } from "@zalem/ui/lib/utils";

export interface ProductData {
  _id: Id<"products">;
  title: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  images: string[];
  brand: string;
  isDeal: boolean;
  stock: number;
  discountPercent?: number;
}

export function ProductCard({
  product,
  isFavorited = false,
}: {
  product: ProductData;
  isFavorited?: boolean;
}) {
  const { isSignedIn } = useAuth();
  const addToCart = useMutation(api.cart.add);
  const toggleFavorite = useMutation(api.favorites.toggle);

  const handleAddToCart = async () => {
    if (!isSignedIn) {
      toast.error("Sign in to add items to your cart");
      return;
    }
    await addToCart({ productId: product._id });
    toast.success("Added to cart");
  };

  const handleToggleFavorite = async () => {
    if (!isSignedIn) {
      toast.error("Sign in to save favorites");
      return;
    }
    const added = await toggleFavorite({ productId: product._id });
    toast.success(added ? "Added to favorites" : "Removed from favorites");
  };

  return (
    <div className="bg-card group relative flex flex-col overflow-hidden rounded-lg border">
      {/* image */}
      <Link
        href={`/products/${product._id}` as any}
        className="bg-muted relative aspect-square overflow-hidden"
      >
        <Image
          src={product.images[0]}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform group-hover:scale-105"
        />
      </Link>

      {/* discount badge */}
      {product.discountPercent && product.discountPercent > 0 && (
        <Badge variant="destructive" className="absolute top-2 left-2 text-xs">
          -{product.discountPercent}%
        </Badge>
      )}

      {/* deal badge */}
      {product.isDeal && <Badge className="absolute top-2 left-2 mt-6 text-xs">Deal</Badge>}

      {/* favorite toggle */}
      <button
        onClick={handleToggleFavorite}
        className={cn(
          "absolute top-2 right-2 rounded-full bg-white/80 p-1.5 shadow-sm transition-colors hover:bg-white",
          isFavorited && "text-red-500",
        )}
      >
        <Heart className="size-4" fill={isFavorited ? "currentColor" : "none"} />
      </button>

      {/* info */}
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link
          href={`/products/${product._id}` as any}
          className="line-clamp-2 text-sm font-medium leading-tight hover:underline"
        >
          {product.title}
        </Link>

        {/* rating */}
        <div className="text-muted-foreground flex items-center gap-1 text-xs">
          <span className="text-yellow-500">{"★".repeat(Math.round(product.rating))}</span>
          <span>({product.reviewCount})</span>
        </div>

        {/* price */}
        <div className="mt-auto flex items-baseline gap-2">
          <span className="text-lg font-bold">{product.price.toFixed(2)} lei</span>
          {product.originalPrice && (
            <span className="text-muted-foreground text-sm line-through">
              {product.originalPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* add to cart */}
        <Button
          size="sm"
          className="mt-1 w-full"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
        >
          <ShoppingCart className="mr-1.5 size-4" />
          {product.stock === 0 ? "Out of stock" : "Add to cart"}
        </Button>
      </div>
    </div>
  );
}
