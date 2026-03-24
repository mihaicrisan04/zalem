"use client";

import { useQuery } from "convex/react";
import { api } from "@zalem/backend/convex/_generated/api";
import type { Id } from "@zalem/backend/convex/_generated/dataModel";

/**
 * Given a list of product IDs, returns the subset that the current user has favorited.
 * Returns an empty array for unauthenticated users.
 */
export function useFavoritedIds(productIds: (Id<"products"> | string)[]): string[] {
  const result = useQuery(
    api.favorites.batchCheck,
    productIds.length > 0 ? { productIds: productIds as Id<"products">[] } : "skip",
  );
  return (result as string[]) ?? [];
}
