"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { Minus, Plus, Trash2, Heart } from "lucide-react";
import { toast } from "sonner";
import { api } from "@zalem/backend/convex/_generated/api";
import { Button } from "@zalem/ui/components/optics/button";
import { Separator } from "@zalem/ui/components/optics/separator";
import { Spinner } from "@zalem/ui/components/optics/spinner";
import { useFavoritedIds } from "@/hooks/use-favorited-ids";
import { cn } from "@zalem/ui/lib/utils";

export default function CartPage() {
  const { isSignedIn } = useAuth();
  const cartItems = useQuery(api.cart.list);
  const removeFromCart = useMutation(api.cart.remove);
  const updateQuantity = useMutation(api.cart.updateQuantity);
  const toggleFavorite = useMutation(api.favorites.toggle);

  const productIds =
    (cartItems?.map((item) => item?.product?._id).filter(Boolean) as string[]) ?? [];
  const favoritedIds = useFavoritedIds(productIds);
  const favSet = new Set(favoritedIds);

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">My Cart</h1>
        <p className="text-muted-foreground mt-2">Sign in to view your cart.</p>
      </div>
    );
  }

  if (cartItems === undefined) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="mb-4 text-2xl font-bold">My Cart</h1>
        <p className="text-muted-foreground mb-6">Your cart is empty.</p>
        <Button render={<Link href="/" />} nativeButton={false}>
          Browse products
        </Button>
      </div>
    );
  }

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item?.product?.price ?? 0) * item.quantity,
    0,
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">My Cart ({cartItems.length} items)</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* cart items */}
        <div className="space-y-4 lg:col-span-2">
          {cartItems.map((item) => {
            if (!item?.product) return null;
            const { product } = item;
            const isFav = favSet.has(product._id);
            return (
              <div key={item._id} className="flex gap-4 rounded-lg border p-4">
                <Link
                  href={`/products/${product._id}` as any}
                  className="relative size-24 shrink-0 overflow-hidden rounded-md"
                >
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/products/${product._id}` as any}
                    className="line-clamp-2 text-sm font-medium hover:underline"
                  >
                    {product.title}
                  </Link>
                  <p className="mt-1 text-lg font-bold">{product.price.toFixed(2)} lei</p>

                  <div className="mt-2 flex items-center gap-3">
                    {/* quantity stepper */}
                    <div className="flex items-center rounded-md border">
                      <button
                        onClick={() =>
                          updateQuantity({ productId: product._id, quantity: item.quantity - 1 })
                        }
                        className="hover:bg-accent px-2 py-1"
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="min-w-8 px-2 text-center text-sm">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateQuantity({ productId: product._id, quantity: item.quantity + 1 })
                        }
                        className="hover:bg-accent px-2 py-1"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>

                    <button
                      onClick={async () => {
                        const added = await toggleFavorite({ productId: product._id });
                        toast.success(added ? "Saved to favorites" : "Removed from favorites");
                      }}
                      className={cn(
                        "cursor-pointer transition-all hover:scale-110 active:scale-95",
                        isFav
                          ? "text-red-500 hover:text-red-600"
                          : "text-muted-foreground hover:text-red-500",
                      )}
                    >
                      <Heart className="size-4" fill={isFav ? "currentColor" : "none"} />
                    </button>

                    <button
                      onClick={() => removeFromCart({ productId: product._id })}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold">{(product.price * item.quantity).toFixed(2)} lei</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* order summary */}
        <div className="h-fit rounded-lg border p-6 lg:sticky lg:top-20">
          <h2 className="mb-4 text-lg font-bold">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{subtotal.toFixed(2)} lei</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-green-600">Free</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{subtotal.toFixed(2)} lei</span>
            </div>
          </div>
          <Button
            className="mt-6 h-11 w-full text-sm"
            size="lg"
            render={<Link href={"/checkout" as any} />}
            nativeButton={false}
          >
            Continue to checkout
          </Button>
        </div>
      </div>
    </div>
  );
}
