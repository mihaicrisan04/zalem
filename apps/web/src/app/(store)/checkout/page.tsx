"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@zalem/backend/convex/_generated/api";
import { Button } from "@zalem/ui/components/optics/button";
import { Separator } from "@zalem/ui/components/optics/separator";
import { Spinner } from "@zalem/ui/components/optics/spinner";
import { toast } from "sonner";

export default function CheckoutPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const cartItems = useQuery(api.cart.list);
  const checkout = useMutation(api.orders.checkout);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
  });

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Sign in to checkout.</p>
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

  const cartEmpty = cartItems.length === 0;
  useEffect(() => {
    if (cartEmpty) router.push("/cart" as any);
  }, [cartEmpty, router]);

  if (cartEmpty) return null;

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item?.product?.price ?? 0) * item.quantity,
    0,
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name || !form.address || !form.city || !form.phone) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const orderId = await checkout({ shippingAddress: form });
      router.push(`/checkout/success?orderId=${orderId}` as any);
    } catch {
      toast.error("Checkout failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

      {/* order summary */}
      <div className="mb-8 rounded-lg border p-4">
        <h2 className="mb-3 font-semibold">Order summary</h2>
        <div className="space-y-2 text-sm">
          {cartItems.map((item) =>
            item?.product ? (
              <div key={item._id} className="flex justify-between">
                <span className="line-clamp-1 flex-1">
                  {item.product.title} x{item.quantity}
                </span>
                <span className="ml-4 font-medium">
                  {(item.product.price * item.quantity).toFixed(2)} lei
                </span>
              </div>
            ) : null,
          )}
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{subtotal.toFixed(2)} lei</span>
          </div>
        </div>
      </div>

      {/* address form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h2 className="font-semibold">Delivery address</h2>
        {(["name", "address", "city", "phone"] as const).map((field) => (
          <div key={field}>
            <label htmlFor={field} className="mb-1 block text-sm font-medium capitalize">
              {field}
            </label>
            <input
              id={field}
              type={field === "phone" ? "tel" : "text"}
              value={form[field]}
              onChange={updateField(field)}
              required
              className="bg-background w-full rounded-md border px-3 py-2 text-sm"
              placeholder={field === "phone" ? "+40 7xx xxx xxx" : `Enter ${field}`}
            />
          </div>
        ))}

        <Button type="submit" className="h-11 w-full text-sm" size="lg" disabled={isSubmitting}>
          {isSubmitting ? "Placing order..." : "Place order"}
        </Button>
      </form>
    </div>
  );
}
