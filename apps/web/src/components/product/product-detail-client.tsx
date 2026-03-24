"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { Heart, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { api } from "@zalem/backend/convex/_generated/api";
import type { Id } from "@zalem/backend/convex/_generated/dataModel";
import { Button } from "@zalem/ui/components/optics/button";
import { Badge } from "@zalem/ui/components/optics/badge";
import { Separator } from "@zalem/ui/components/optics/separator";
import { Spinner } from "@zalem/ui/components/optics/spinner";
import { cn } from "@zalem/ui/lib/utils";
import { ProductRow } from "@/components/product-row";
import { ReviewSection } from "./review-section";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { useFavoritedIds } from "@/hooks/use-favorited-ids";

export function ProductDetailClient({ productId }: { productId: Id<"products"> }) {
  const product = useQuery(api.products.get, { id: productId });
  const isFavorited = useQuery(api.favorites.isProductFavorited, { productId });
  const similarProducts = useQuery(api.products.listTrending, {
    category: product?.category,
    limit: 10,
  });
  const similarFiltered = similarProducts?.filter((p) => p._id !== productId);
  const similarFavIds = useFavoritedIds(similarFiltered?.map((p) => p._id) ?? []);
  const { isSignedIn } = useAuth();
  const addToCart = useMutation(api.cart.add);
  const toggleFavorite = useMutation(api.favorites.toggle);
  const { addToRecentlyViewed } = useRecentlyViewed();
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"description" | "specs" | "reviews">("description");

  useEffect(() => {
    if (product) addToRecentlyViewed(product._id);
  }, [product, addToRecentlyViewed]);

  if (!product) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

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
    <div className="container mx-auto px-4 py-6">
      {/* breadcrumb */}
      <nav className="text-muted-foreground mb-6 flex items-center gap-1 text-sm">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link
          href={
            `/categories/${product.category.toLowerCase().replace(/ & /g, "-").replace(/ /g, "-")}` as any
          }
          className="hover:text-foreground"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-foreground line-clamp-1">{product.title}</span>
      </nav>

      {/* main content: gallery + info */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* image gallery */}
        <div>
          <div className="bg-muted relative aspect-square overflow-hidden rounded-lg">
            <Image
              src={product.images[selectedImage] ?? product.images[0]}
              alt={product.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    "relative size-16 shrink-0 overflow-hidden rounded-md border-2",
                    selectedImage === i ? "border-primary" : "border-transparent",
                  )}
                >
                  <Image src={img} alt="" fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* product info */}
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{product.title}</h1>

          {/* rating */}
          <button
            onClick={() => setActiveTab("reviews")}
            className="text-muted-foreground flex items-center gap-2 text-sm hover:underline"
          >
            <span className="text-yellow-500">{"★".repeat(Math.round(product.rating))}</span>
            <span>
              {product.rating.toFixed(1)} ({product.reviewCount} reviews)
            </span>
          </button>

          {/* price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold">{product.price.toFixed(2)} lei</span>
            {product.originalPrice && (
              <>
                <span className="text-muted-foreground text-xl line-through">
                  {product.originalPrice.toFixed(2)} lei
                </span>
                <Badge variant="destructive">-{product.discountPercent}%</Badge>
              </>
            )}
          </div>

          {/* stock */}
          <p
            className={cn(
              "text-sm font-medium",
              product.stock > 0 ? "text-green-600" : "text-red-600",
            )}
          >
            {product.stock > 0 ? `In stock (${product.stock} available)` : "Out of stock"}
          </p>

          <Separator />

          {/* actions */}
          <div className="flex gap-3">
            <Button
              className="h-11 flex-1 text-sm"
              size="lg"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              <ShoppingCart className="mr-2 size-5" />
              Add to cart
            </Button>
            <Button variant="outline" size="lg" className="h-11" onClick={handleToggleFavorite}>
              <Heart className="size-5" fill={isFavorited ? "currentColor" : "none"} />
            </Button>
          </div>

          {/* brand */}
          <p className="text-muted-foreground text-sm">
            Brand: <span className="text-foreground font-medium">{product.brand}</span>
          </p>
        </div>
      </div>

      {/* tabs */}
      <div className="mt-10">
        <div className="flex border-b">
          {(["description", "specs", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-4 py-2 text-sm font-medium capitalize transition-colors",
                activeTab === tab
                  ? "text-primary border-primary border-b-2"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab === "specs" ? "Specifications" : tab}
            </button>
          ))}
        </div>

        <div className="py-6">
          {activeTab === "description" && (
            <p className="text-muted-foreground max-w-prose leading-relaxed">
              {product.description}
            </p>
          )}

          {activeTab === "specs" && product.specifications && (
            <div className="max-w-lg">
              {Object.entries(product.specifications).map(([key, value]) => (
                <div key={key} className="flex border-b py-2.5">
                  <span className="text-muted-foreground w-40 shrink-0 text-sm">{key}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "reviews" && <ReviewSection productId={product._id} />}
        </div>
      </div>

      {/* similar products */}
      <Separator className="my-8" />
      <ProductRow
        title="Similar products"
        products={similarFiltered}
        isLoading={similarProducts === undefined}
        favoritedIds={similarFavIds}
      />
    </div>
  );
}
