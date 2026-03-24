"use client";

import { useState, useEffect, useCallback } from "react";

export function useDwellTime() {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [currentMs, setCurrentMs] = useState(0);
  const [cumulativeMs, setCumulativeMs] = useState(0);

  // callback ref — works with combined refs in useProductEngagement
  const ref = useCallback((el: HTMLElement | null) => {
    setElement(el);
  }, []);

  // attach mouse listeners when element changes
  useEffect(() => {
    if (!element) return;

    const enter = () => setIsHovered(true);
    const leave = () => {
      setIsHovered(false);
      setCurrentMs((prev) => {
        setCumulativeMs((cum) => cum + prev);
        return 0;
      });
    };

    element.addEventListener("mouseenter", enter);
    element.addEventListener("mouseleave", leave);
    return () => {
      element.removeEventListener("mouseenter", enter);
      element.removeEventListener("mouseleave", leave);
    };
  }, [element]);

  // tick while hovered
  useEffect(() => {
    if (!isHovered) return;
    const interval = setInterval(() => {
      setCurrentMs((prev) => prev + 100);
    }, 100);
    return () => clearInterval(interval);
  }, [isHovered]);

  return { ref, isHovered, dwellTimeMs: cumulativeMs + currentMs };
}
