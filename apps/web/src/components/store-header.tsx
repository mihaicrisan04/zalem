"use client";

import Link from "next/link";
import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Heart, ShoppingCart, User } from "lucide-react";
import { api } from "@zalem/backend/convex/_generated/api";
import { Button } from "@zalem/ui/components/optics/button";
import { Badge } from "@zalem/ui/components/optics/badge";
import { ModeToggle } from "./mode-toggle";
import { SearchBar } from "./search-bar";

export function StoreHeader() {
  const { isSignedIn } = useAuth();
  const cartCount = useQuery(api.cart.count) ?? 0;

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container mx-auto flex h-14 items-center gap-4 px-4">
        {/* logo */}
        <Link href="/" className="flex items-center gap-2 text-lg font-bold">
          zalem
        </Link>

        {/* search bar - takes most width */}
        <div className="mx-auto max-w-2xl flex-1">
          <SearchBar />
        </div>

        {/* right section */}
        <div className="flex items-center gap-1">
          <ModeToggle />

          {isSignedIn ? (
            <>
              <Button
                render={<Link href={"/favorites" as any} />}
                variant="ghost"
                size="icon"
                nativeButton={false}
              >
                <Heart className="size-5" />
              </Button>

              <div className="relative">
                <Button
                  render={<Link href={"/cart" as any} />}
                  variant="ghost"
                  size="icon"
                  nativeButton={false}
                >
                  <ShoppingCart className="size-5" />
                </Button>
                {cartCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 size-5 justify-center rounded-full p-0 text-xs"
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
                size="icon"
                nativeButton={false}
              >
                <ShoppingCart className="size-5" />
              </Button>
              <SignInButton mode="modal">
                <Button variant="ghost" size="icon">
                  <User className="size-5" />
                </Button>
              </SignInButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
