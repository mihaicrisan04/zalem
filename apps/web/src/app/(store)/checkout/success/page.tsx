"use client";

import { use } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@zalem/ui/components/optics/button";

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = use(searchParams);

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <CheckCircle className="mx-auto size-16 text-green-600" />
      <h1 className="mt-4 text-2xl font-bold">Order placed successfully!</h1>
      <p className="text-muted-foreground mt-2">
        Thank you for your purchase. Your order has been confirmed.
      </p>
      {params.orderId && (
        <p className="text-muted-foreground mt-1 text-sm">Order ID: {String(params.orderId)}</p>
      )}
      <div className="mt-8 flex justify-center gap-4">
        <Button render={<Link href={"/orders" as any} />} variant="outline" nativeButton={false}>
          View orders
        </Button>
        <Button render={<Link href="/" />} nativeButton={false}>
          Continue shopping
        </Button>
      </div>
    </div>
  );
}
