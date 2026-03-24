"use client";

import { useState, useEffect } from "react";

/**
 * Returns false during SSR/first render, true after hydration.
 * Use to defer rendering of components that generate client-side IDs
 * (Base UI components) to avoid hydration mismatch warnings.
 */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
