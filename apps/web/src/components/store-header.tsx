"use client";

import Image from "next/image";
import Link from "next/link";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Heart, ShoppingCart, User, Sparkles } from "lucide-react";
import { api } from "@zalem/backend/convex/_generated/api";
import { Button } from "@zalem/ui/components/optics/button";
import { Badge } from "@zalem/ui/components/optics/badge";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@zalem/ui/components/optics/hover-card";
import { SearchBar } from "./search-bar";

function PreviewSkeleton() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2.5 p-1.5">
          <div className="bg-muted size-9 shrink-0 animate-pulse rounded" />
          <div className="flex-1 space-y-1.5">
            <div className="bg-muted h-3 w-3/4 animate-pulse rounded" />
            <div className="bg-muted h-2.5 w-1/2 animate-pulse rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FavoritesPreview() {
  const favorites = useQuery(api.favorites.list);
  if (favorites === undefined) return <PreviewSkeleton />;
  if (favorites.length === 0) {
    return <p className="text-muted-foreground py-2 text-center">No favorites yet</p>;
  }
  const items = favorites.slice(0, 4);
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
        Favorites ({favorites.length})
      </p>
      {items.map((fav) =>
        fav?.product ? (
          <Link
            key={fav._id}
            href={`/products/${fav.product._id}` as any}
            className="hover:bg-accent flex items-center gap-2.5 rounded-md p-1.5 transition-colors"
          >
            <div className="relative size-9 shrink-0 overflow-hidden rounded">
              <Image
                src={fav.product.images[0]}
                alt=""
                fill
                sizes="36px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{fav.product.title}</p>
              <p className="text-muted-foreground text-[11px]">
                {fav.product.price.toFixed(2)} lei
              </p>
            </div>
          </Link>
        ) : null,
      )}
      {favorites.length > 4 && (
        <p className="text-muted-foreground text-center text-[11px]">
          +{favorites.length - 4} more
        </p>
      )}
      <Link
        href={"/favorites" as any}
        className="text-primary block pt-1 text-center text-xs font-medium hover:underline"
      >
        View all favorites
      </Link>
    </div>
  );
}

function CartPreview() {
  const cartItems = useQuery(api.cart.list);
  if (cartItems === undefined) return <PreviewSkeleton />;
  if (cartItems.length === 0) {
    return <p className="text-muted-foreground py-2 text-center">Your cart is empty</p>;
  }
  const items = cartItems.slice(0, 3);
  const total = cartItems.reduce(
    (sum, item) => sum + (item?.product?.price ?? 0) * item.quantity,
    0,
  );
  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-[11px] font-medium uppercase tracking-wide">
        Cart ({cartItems.length} items)
      </p>
      {items.map((item) =>
        item?.product ? (
          <Link
            key={item._id}
            href={`/products/${item.product._id}` as any}
            className="hover:bg-accent flex items-center gap-2.5 rounded-md p-1.5 transition-colors"
          >
            <div className="relative size-9 shrink-0 overflow-hidden rounded">
              <Image
                src={item.product.images[0]}
                alt=""
                fill
                sizes="36px"
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{item.product.title}</p>
              <p className="text-muted-foreground text-[11px]">
                {item.quantity} x {item.product.price.toFixed(2)} lei
              </p>
            </div>
          </Link>
        ) : null,
      )}
      {cartItems.length > 3 && (
        <p className="text-muted-foreground text-center text-[11px]">
          +{cartItems.length - 3} more items
        </p>
      )}
      <div className="border-t pt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Total</span>
          <span className="font-bold">{total.toFixed(2)} lei</span>
        </div>
      </div>
      <Link
        href={"/cart" as any}
        className="text-primary block text-center text-xs font-medium hover:underline"
      >
        View cart
      </Link>
    </div>
  );
}

export function StoreHeader() {
  const { isSignedIn } = useAuth();
  const cartCount = useQuery(api.cart.count) ?? 0;
  const favCount = useQuery(api.favorites.count) ?? 0;

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center gap-6 px-4">
        {/* logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Sparkles className="text-primary size-5" />
          <span className="text-xl font-bold tracking-tight">zalem</span>
        </Link>

        {/* search bar */}
        <div className="mx-auto max-w-xl flex-1">
          <SearchBar />
        </div>

        {/* right section */}
        <div className="flex shrink-0 items-center gap-1">
          {isSignedIn ? (
            <>
              {/* favorites */}
              <HoverCard>
                <HoverCardTrigger render={<div />}>
                  <div className="relative">
                    <Button
                      render={<Link href={"/favorites" as any} />}
                      variant="ghost"
                      size="lg"
                      nativeButton={false}
                      className="gap-2 text-sm"
                    >
                      <Heart className="size-[18px]" />
                      <span className="hidden sm:inline">Favorites</span>
                    </Button>
                    {favCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 size-5 justify-center rounded-full p-0 text-[10px]"
                      >
                        {favCount > 99 ? "99+" : favCount}
                      </Badge>
                    )}
                  </div>
                </HoverCardTrigger>
                <HoverCardContent side="bottom" align="end" className="w-72">
                  <FavoritesPreview />
                </HoverCardContent>
              </HoverCard>

              {/* cart */}
              <HoverCard>
                <HoverCardTrigger render={<div />}>
                  <div className="relative">
                    <Button
                      render={<Link href={"/cart" as any} />}
                      variant="ghost"
                      size="lg"
                      nativeButton={false}
                      className="gap-2 text-sm"
                    >
                      <ShoppingCart className="size-[18px]" />
                      <span className="hidden sm:inline">Cart</span>
                    </Button>
                    {cartCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-1 -right-1 size-5 justify-center rounded-full p-0 text-[10px]"
                      >
                        {cartCount > 99 ? "99+" : cartCount}
                      </Badge>
                    )}
                  </div>
                </HoverCardTrigger>
                <HoverCardContent side="bottom" align="end" className="w-72">
                  <CartPreview />
                </HoverCardContent>
              </HoverCard>

              <div className="ml-2">
                <UserButton />
              </div>
            </>
          ) : (
            <>
              <Button
                render={<Link href={"/cart" as any} />}
                variant="ghost"
                size="lg"
                nativeButton={false}
                className="gap-2 text-sm"
              >
                <ShoppingCart className="size-[18px]" />
                <span className="hidden sm:inline">Cart</span>
              </Button>
              <SignInButton mode="modal">
                <Button variant="outline" size="lg" className="gap-2 text-sm">
                  <User className="size-[18px]" />
                  <span className="hidden sm:inline">Sign in</span>
                </Button>
              </SignInButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
