"use client";

import { useCallback } from "react";
import { useDwellTime } from "./use-dwell-time";
import { useViewportTracking } from "./use-viewport-tracking";
import { useScrollDepth } from "./use-scroll-depth";

export type ProductEngagement = {
  productId: string;
  dwellTimeMs: number;
  scrollDepth: number;
  cursorHoverMs: number;
  viewTimeMs: number;
  isInView: boolean;
};

export function useProductEngagement(productId: string) {
  const { ref: dwellRef, dwellTimeMs } = useDwellTime();
  const { ref: viewRef, isInView, viewTimeMs } = useViewportTracking();
  const { scrollDepth } = useScrollDepth();

  // combine both callback refs
  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      dwellRef(el);
      viewRef(el);
    },
    [dwellRef, viewRef],
  );

  return {
    ref,
    engagement: {
      productId,
      dwellTimeMs,
      scrollDepth,
      cursorHoverMs: dwellTimeMs,
      viewTimeMs,
      isInView,
    } satisfies ProductEngagement,
  };
}
