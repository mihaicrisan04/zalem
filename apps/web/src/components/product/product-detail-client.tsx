"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { Heart, ShoppingCart } from "lucide-react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { api } from "@zalem/backend/convex/_generated/api";
import type { Id } from "@zalem/backend/convex/_generated/dataModel";
import { Button } from "@zalem/ui/components/optics/button";
import { Badge } from "@zalem/ui/components/optics/badge";
import { Separator } from "@zalem/ui/components/optics/separator";
import { Spinner } from "@zalem/ui/components/optics/spinner";
import { StarRating } from "@zalem/ui/components/optics/star-rating";
import { cn } from "@zalem/ui/lib/utils";
import { ProductRow } from "@/components/product-row";
import { ReviewSection } from "./review-section";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { useFavoritedIds } from "@/hooks/use-favorited-ids";
import { useProductEngagement } from "@/hooks/use-product-engagement";
import { useBehaviorTrackerContext } from "@/hooks/use-behavior-tracker";
import { useReadinessSignals } from "@/hooks/use-readiness-signals";
import { QuestionChip } from "@/components/question-chips";

const SECTION_IDS = ["description", "specifications", "reviews"] as const;
type SectionId = (typeof SECTION_IDS)[number];

export function ProductDetailClient({ productId }: { productId: Id<"products"> }) {
  const product = useQuery(api.products.get, { id: productId });
  const isFavorited = useQuery(api.favorites.isProductFavorited, { productId });
  const similarProducts = useQuery(api.recommendations.similarProducts, {
    productId,
    limit: 10,
  });
  const fbtProducts = useQuery(api.recommendations.frequentlyBoughtTogether, {
    productId,
    limit: 4,
  });
  const allRelatedIds = [
    ...(similarProducts?.map((p) => p._id) ?? []),
    ...(fbtProducts?.map((p: any) => p._id) ?? []),
  ];
  const relatedFavIds = useFavoritedIds(allRelatedIds);
  const { isSignedIn } = useAuth();
  const addToCart = useMutation(api.cart.add);
  const toggleFavorite = useMutation(api.favorites.toggle);
  const { recentlyViewedIds, addToRecentlyViewed } = useRecentlyViewed();
  const recentProducts = useQuery(
    api.products.getByIds,
    recentlyViewedIds.length > 0 ? { ids: recentlyViewedIds as any } : "skip",
  );

  // image gallery state
  const [selectedImage, setSelectedImage] = useState(0);
  const [hoveredImage, setHoveredImage] = useState<number | null>(null);
  const displayedImage = hoveredImage ?? selectedImage;

  // sticky tab nav — scoped to the sections container
  const [activeSection, setActiveSection] = useState<SectionId>("description");
  const sectionsContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<SectionId, HTMLElement | null>>({
    description: null,
    specifications: null,
    reviews: null,
  });

  // observe which section is in viewport
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute("data-section") as SectionId;
            if (id) setActiveSection(id);
          }
        }
      },
      { rootMargin: "-40% 0px -50% 0px" },
    );

    for (const section of SECTION_IDS) {
      const el = sectionRefs.current[section];
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [product]);

  const scrollToSection = useCallback((section: SectionId) => {
    const el = sectionRefs.current[section];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 120;
      window.scrollTo({ top, behavior: "smooth" });
    }
  }, []);

  // behavior tracking
  const { ref: engagementRef, engagement } = useProductEngagement(productId);
  const tracker = useBehaviorTrackerContext();

  useEffect(() => {
    if (product) tracker.trackProduct(engagement, product.category);
  }, [engagement.dwellTimeMs, engagement.scrollDepth, product?.category]);

  useEffect(() => {
    if (activeSection === "reviews") tracker.setViewedReviews(productId);
  }, [activeSection, productId]);

  const readiness = useReadinessSignals(tracker.state, {
    isProductDetailPage: true,
    currentProductId: productId,
    activeTab: activeSection,
  });

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
    <div ref={engagementRef} className="container mx-auto px-4 py-6">
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
          <div className="bg-muted relative aspect-square overflow-hidden rounded-xl">
            <Image
              src={product.images[displayedImage] ?? product.images[0]}
              alt={product.title}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-all duration-300"
              priority
            />
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pt-1 pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onMouseEnter={() => setHoveredImage(i)}
                  onMouseLeave={() => setHoveredImage(null)}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    "relative size-16 shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-all",
                    selectedImage === i
                      ? "border-primary ring-primary/20 ring-2"
                      : hoveredImage === i
                        ? "border-primary/50"
                        : "border-transparent hover:border-muted-foreground/30",
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
          <h1 className="text-2xl font-bold leading-tight">{product.title}</h1>

          {/* rating */}
          <div
            onClick={() => scrollToSection("reviews")}
            className="flex cursor-pointer items-center gap-2 hover:opacity-80"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && scrollToSection("reviews")}
          >
            <StarRating defaultValue={Math.round(product.rating)} size="sm" disabled />
            <span className="text-muted-foreground text-sm">
              {product.rating.toFixed(1)} ({product.reviewCount} reviews)
            </span>
          </div>

          {/* price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold tracking-tight">
              {product.price.toFixed(2)} lei
            </span>
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
            <Button
              variant="outline"
              size="lg"
              className={cn(
                "h-11 cursor-pointer",
                isFavorited ? "text-red-500 hover:text-red-600" : "hover:text-red-500",
              )}
              onClick={handleToggleFavorite}
            >
              <motion.div
                animate={{
                  scale: isFavorited ? [1, 1.3, 1] : 1,
                  rotate: isFavorited ? [0, -10, 10, 0] : 0,
                }}
                transition={{ duration: 0.3 }}
              >
                <Heart className="size-5" fill={isFavorited ? "currentColor" : "none"} />
              </motion.div>
            </Button>
          </div>

          {/* brand */}
          <p className="text-muted-foreground text-sm">
            Brand: <span className="text-foreground font-medium">{product.brand}</span>
          </p>
        </div>
      </div>

      {/* sections container — sticky nav is scoped to this */}
      <div ref={sectionsContainerRef} className="relative mt-12">
        {/* sticky section nav — stays within the sections container */}
        <div className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-16 z-20 -mx-4 border-b backdrop-blur">
          <div className="container mx-auto flex px-4">
            {SECTION_IDS.map((section) => (
              <button
                key={section}
                onClick={() => scrollToSection(section)}
                className={cn(
                  "border-b-2 px-5 py-3 text-sm font-medium capitalize transition-colors",
                  activeSection === section
                    ? "text-primary border-primary"
                    : "text-muted-foreground hover:text-foreground border-transparent",
                )}
              >
                {section}
              </button>
            ))}
          </div>
        </div>

        {/* all sections rendered */}
        <div className="mt-8 space-y-16">
          {/* description */}
          <section
            ref={(el) => {
              sectionRefs.current.description = el;
            }}
            data-section="description"
          >
            <h2 className="mb-4 text-lg font-bold">Description</h2>
            <p className="text-muted-foreground max-w-prose leading-relaxed">
              {product.description}
            </p>
          </section>

          {/* specifications */}
          <section
            ref={(el) => {
              sectionRefs.current.specifications = el;
            }}
            data-section="specifications"
          >
            <h2 className="mb-4 text-lg font-bold">Specifications</h2>
            {product.specifications ? (
              <div className="bg-muted/30 max-w-xl overflow-hidden rounded-lg border">
                {Object.entries(product.specifications).map(([key, value], i) => (
                  <div
                    key={key}
                    className={cn("flex px-4 py-3 text-sm", i % 2 === 0 ? "bg-muted/20" : "")}
                  >
                    <span className="text-muted-foreground w-44 shrink-0 font-medium">{key}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No specifications available.</p>
            )}
          </section>

          {/* reviews */}
          <section
            ref={(el) => {
              sectionRefs.current.reviews = el;
            }}
            data-section="reviews"
          >
            <div className="mb-6 flex items-center gap-4">
              <h2 className="text-lg font-bold">Reviews ({product.reviewCount})</h2>
              {readiness.activeChips.find((c) => c.type === "review_engagement") && (
                <QuestionChip
                  chip={readiness.activeChips.find((c) => c.type === "review_engagement")!}
                  onDismiss={readiness.dismissChip}
                />
              )}
            </div>
            <ReviewSection productId={product._id} />
          </section>
        </div>
      </div>

      {/* frequently bought together */}
      {fbtProducts && fbtProducts.length > 0 && (
        <>
          <Separator className="my-10" />
          <ProductRow
            title="Frequently bought together"
            products={fbtProducts as any}
            isLoading={false}
            favoritedIds={relatedFavIds}
          />
        </>
      )}

      {/* similar products */}
      <Separator className="my-10" />
      {readiness.activeChips.find((c) => c.type === "comparison_behavior") && (
        <div className="mb-4">
          <QuestionChip
            chip={readiness.activeChips.find((c) => c.type === "comparison_behavior")!}
            onDismiss={readiness.dismissChip}
          />
        </div>
      )}
      <ProductRow
        title="Similar products"
        products={similarProducts}
        isLoading={similarProducts === undefined}
        favoritedIds={relatedFavIds}
      />

      {/* recently viewed */}
      {recentProducts && recentProducts.length > 1 && (
        <>
          <Separator className="my-10" />
          <ProductRow
            title="Recently viewed"
            products={recentProducts.filter((p: any) => p._id !== productId) as any}
            favoritedIds={relatedFavIds}
          />
        </>
      )}
    </div>
  );
}
