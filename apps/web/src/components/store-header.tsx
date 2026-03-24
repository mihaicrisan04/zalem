"use client";

import Link from "next/link";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Heart, ShoppingCart, User, Sparkles } from "lucide-react";
import { api } from "@zalem/backend/convex/_generated/api";
import { Button } from "@zalem/ui/components/optics/button";
import { Badge } from "@zalem/ui/components/optics/badge";
import { SearchBar } from "./search-bar";

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

              <UserButton />
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
