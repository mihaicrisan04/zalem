"use client";

import { use } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@zalem/backend/convex/_generated/api";
import type { Id } from "@zalem/backend/convex/_generated/dataModel";
import { Badge } from "@zalem/ui/components/optics/badge";
import { Separator } from "@zalem/ui/components/optics/separator";
import { Spinner } from "@zalem/ui/components/optics/spinner";
import { Button } from "@zalem/ui/components/optics/button";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const order = useQuery(api.orders.get, { id: id as Id<"orders"> });

  if (order === undefined) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 py-6">
      <Button
        render={<Link href={"/orders" as any} />}
        variant="ghost"
        size="sm"
        nativeButton={false}
        className="mb-4"
      >
        &larr; Back to orders
      </Button>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
        <Badge variant={order.status === "delivered" ? "default" : "destructive"}>
          {order.status}
        </Badge>
      </div>

      <p className="text-muted-foreground mt-1 text-sm">
        Placed on {new Date(order.createdAt).toLocaleDateString()}
      </p>

      <Separator className="my-6" />

      {/* items */}
      <div className="space-y-4">
        {order.items.map((item, i) => (
          <div key={i} className="flex gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-md">
              <Image src={item.image} alt={item.title} fill sizes="64px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${item.productId}` as any}
                className="text-sm font-medium hover:underline"
              >
                {item.title}
              </Link>
              <p className="text-muted-foreground text-sm">Qty: {item.quantity}</p>
            </div>
            <p className="text-sm font-bold">{(item.price * item.quantity).toFixed(2)} lei</p>
          </div>
        ))}
      </div>

      <Separator className="my-6" />

      <div className="flex justify-between text-lg font-bold">
        <span>Total</span>
        <span>{order.total.toFixed(2)} lei</span>
      </div>

      {/* shipping */}
      <Separator className="my-6" />
      <div>
        <h3 className="mb-2 text-sm font-semibold">Shipping address</h3>
        <p className="text-muted-foreground text-sm">
          {order.shippingAddress.name}
          <br />
          {order.shippingAddress.address}
          <br />
          {order.shippingAddress.city}
          <br />
          {order.shippingAddress.phone}
        </p>
      </div>
    </div>
  );
}
