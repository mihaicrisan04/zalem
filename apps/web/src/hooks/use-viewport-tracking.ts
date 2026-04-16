"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";

const TICK_INTERVAL_MS = 100;

export function useViewportTracking(threshold = 0.5) {
  const { ref, inView } = useInView({ threshold });
  const [viewTimeMs, setViewTimeMs] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setViewTimeMs((prev) => prev + TICK_INTERVAL_MS);
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [inView]);

  return { ref, isInView: inView, viewTimeMs };
}
