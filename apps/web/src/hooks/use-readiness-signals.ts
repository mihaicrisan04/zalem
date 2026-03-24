"use client";

import { useState, useCallback, useMemo, useRef } from "react";
import type { BehaviorTrackerState } from "./use-behavior-tracker";

export type ReadinessChip = {
  text: string;
  type: string;
};

export type ReadinessResult = {
  shouldPulseAdvisor: boolean;
  activeChips: ReadinessChip[];
  dismissChip: (type: string) => void;
};

export function useReadinessSignals(
  state: BehaviorTrackerState,
  options?: {
    isProductDetailPage?: boolean;
    currentProductId?: string;
    activeTab?: string;
    hasCartItems?: boolean;
  },
): ReadinessResult {
  const [dismissed, setDismissed] = useState<Map<string, number>>(new Map());
  const cooldownMs = 60000; // 60 seconds

  const dismissChip = useCallback((type: string) => {
    setDismissed((prev) => new Map(prev).set(type, Date.now()));
  }, []);

  const isDismissed = useCallback(
    (type: string) => {
      const dismissedAt = dismissed.get(type);
      if (!dismissedAt) return false;
      return Date.now() - dismissedAt < cooldownMs;
    },
    [dismissed],
  );

  const result = useMemo(() => {
    const chips: ReadinessChip[] = [];
    let shouldPulse = false;

    const currentProduct = options?.currentProductId
      ? state.productsViewed.get(options.currentProductId)
      : undefined;

    // signal: product dwell (>5s on card, >15s on detail page)
    if (currentProduct) {
      const threshold = options?.isProductDetailPage ? 15000 : 5000;
      if (currentProduct.dwellTimeMs > threshold) {
        shouldPulse = true;
      }
    }

    // signal: deep scroll (>50% on product detail page) → pulse advisor only, no chip
    if (options?.isProductDetailPage && currentProduct) {
      if (currentProduct.scrollDepth > 0.5) {
        shouldPulse = true;
      }
    }

    // signal: review engagement (>5s viewing reviews)
    if (
      options?.isProductDetailPage &&
      options?.activeTab === "reviews" &&
      currentProduct?.viewedReviews &&
      !isDismissed("review_engagement")
    ) {
      chips.push({ text: "What do buyers think?", type: "review_engagement" });
    }

    // signal: comparison behavior (3+ products in same category, no add-to-cart)
    const categoryGroups = new Map<string, number>();
    for (const [, product] of state.productsViewed) {
      if (product.category) {
        categoryGroups.set(product.category, (categoryGroups.get(product.category) ?? 0) + 1);
      }
    }
    for (const [, count] of categoryGroups) {
      if (count >= 3 && !isDismissed("comparison_behavior")) {
        chips.push({ text: "Compare these products?", type: "comparison_behavior" });
        shouldPulse = true;
        break;
      }
    }

    // signal: cart deliberation (items in cart + navigating away from product)
    if (
      options?.hasCartItems &&
      !options?.isProductDetailPage &&
      !isDismissed("cart_deliberation")
    ) {
      chips.push({ text: "Need help deciding?", type: "cart_deliberation" });
    }

    return { shouldPulseAdvisor: shouldPulse, activeChips: chips, dismissChip };
  }, [state, options, isDismissed, dismissChip]);

  return result;
}
