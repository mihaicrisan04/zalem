"use client";

import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";

export function useViewportTracking(threshold = 0.5) {
  const { ref, inView } = useInView({ threshold });
  const [viewTimeMs, setViewTimeMs] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const interval = setInterval(() => {
      setViewTimeMs((prev) => prev + 100);
    }, 100);
    return () => clearInterval(interval);
  }, [inView]);

  return { ref, isInView: inView, viewTimeMs };
}
