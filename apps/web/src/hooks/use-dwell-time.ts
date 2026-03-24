"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useDwellTime<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [dwellTimeMs, setDwellTimeMs] = useState(0);
  const [cumulativeMs, setCumulativeMs] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const enter = () => setIsHovered(true);
    const leave = () => {
      setIsHovered(false);
      setDwellTimeMs((prev) => {
        setCumulativeMs((cum) => cum + prev);
        return 0;
      });
    };

    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mouseleave", leave);
    };
  }, []);

  useEffect(() => {
    if (!isHovered) return;
    const interval = setInterval(() => {
      setDwellTimeMs((prev) => prev + 100);
    }, 100);
    return () => clearInterval(interval);
  }, [isHovered]);

  const totalDwellMs = cumulativeMs + dwellTimeMs;

  return { ref, isHovered, dwellTimeMs: totalDwellMs };
}
