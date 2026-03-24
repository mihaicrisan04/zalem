"use client";

import { useState } from "react";
import Link from "next/link";
import { usePaginatedQuery } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@zalem/backend/convex/_generated/api";
import { Badge } from "@zalem/ui/components/optics/badge";
import { Button } from "@zalem/ui/components/optics/button";
import { cn } from "@zalem/ui/lib/utils";

type StatusFilter = "all" | "delivered" | "cancelled";

export default function OrdersPage() {
  const { isSignedIn } = useAuth();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const { results, status, loadMore } = usePaginatedQuery(
    api.orders.listByUser,
    { status: statusFilter === "all" ? undefined : statusFilter },
    { initialNumItems: 20 },
  );

  if (!isSignedIn) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-muted-foreground mt-2">Sign in to view your orders.</p>
      </div>
    );
  }

  const tabs: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "delivered", label: "Delivered" },
    { value: "cancelled", label: "Cancelled" },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold">My Orders</h1>

      {/* tabs */}
      <div className="mb-6 flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              statusFilter === tab.value
                ? "text-primary border-primary border-b-2"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <p className="text-muted-foreground py-16 text-center">No orders found.</p>
      ) : (
        <div className="space-y-4">
          {results.map((order) => (
            <Link
              key={order._id}
              href={`/orders/${order._id}` as any}
              className="hover:bg-accent/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
            >
              <div>
                <p className="font-medium">Order #{order.orderNumber}</p>
                <p className="text-muted-foreground text-sm">
                  {new Date(order.createdAt).toLocaleDateString()} — {order.items.length} items
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-bold">{order.total.toFixed(2)} lei</span>
                <Badge variant={order.status === "delivered" ? "default" : "destructive"}>
                  {order.status}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      )}

      {status === "CanLoadMore" && (
        <div className="mt-6 flex justify-center">
          <Button variant="outline" onClick={() => loadMore(20)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
