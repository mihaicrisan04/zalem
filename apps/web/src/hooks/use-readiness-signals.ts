"use client";

import { useState, useCallback, useMemo } from "react";
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
  // permanently dismissed chips (no cooldown — once dismissed, stays dismissed for the session)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const dismissChip = useCallback((type: string) => {
    setDismissed((prev) => new Set(prev).add(type));
  }, []);

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

    // signal: deep scroll (>50% on product detail page) → pulse advisor only
    if (options?.isProductDetailPage && currentProduct) {
      if (currentProduct.scrollDepth > 0.5) {
        shouldPulse = true;
      }
    }

    // signal: review engagement — once viewedReviews is true, chip stays regardless of active section
    if (
      options?.isProductDetailPage &&
      currentProduct?.viewedReviews &&
      !dismissed.has("review_engagement")
    ) {
      chips.push({ text: "What do buyers think?", type: "review_engagement" });
    }

    // signal: comparison behavior (3+ products in same category)
    const categoryGroups = new Map<string, number>();
    for (const [, product] of state.productsViewed) {
      if (product.category) {
        categoryGroups.set(product.category, (categoryGroups.get(product.category) ?? 0) + 1);
      }
    }
    for (const [, count] of categoryGroups) {
      if (count >= 3 && !dismissed.has("comparison_behavior")) {
        chips.push({ text: "Compare these products?", type: "comparison_behavior" });
        shouldPulse = true;
        break;
      }
    }

    // signal: cart deliberation (items in cart + navigating away)
    if (
      options?.hasCartItems &&
      !options?.isProductDetailPage &&
      !dismissed.has("cart_deliberation")
    ) {
      chips.push({ text: "Need help deciding?", type: "cart_deliberation" });
    }

    return { shouldPulseAdvisor: shouldPulse, activeChips: chips, dismissChip };
  }, [state, options, dismissed, dismissChip]);

  return result;
}
