"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function useScrollDepth() {
  const [scrollDepth, setScrollDepth] = useState(0);
  const maxRef = useRef(0);
  const pathname = usePathname();

  // reset on page change
  useEffect(() => {
    maxRef.current = 0;
    setScrollDepth(0);
  }, [pathname]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight <= 0) {
          ticking = false;
          return;
        }
        const current = window.scrollY / totalHeight;
        const clamped = Math.min(Math.max(current, 0), 1);
        if (clamped > maxRef.current) {
          maxRef.current = clamped;
          setScrollDepth(clamped);
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return { scrollDepth };
}
