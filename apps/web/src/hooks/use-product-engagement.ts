"use client";

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
  const { ref: dwellRef, dwellTimeMs } = useDwellTime<HTMLDivElement>();
  const { ref: viewRef, isInView, viewTimeMs } = useViewportTracking();
  const { scrollDepth } = useScrollDepth();

  // combine refs — attach both to the same element
  const setRefs = (el: HTMLDivElement | null) => {
    (dwellRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
    viewRef(el);
  };

  return {
    ref: setRefs,
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
