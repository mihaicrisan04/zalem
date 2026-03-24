"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "zalem-recently-viewed";
const MAX_ITEMS = 10;

export function useRecentlyViewed() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setIds(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const addToRecentlyViewed = useCallback((productId: string) => {
    setIds((prev) => {
      const filtered = prev.filter((id) => id !== productId);
      const updated = [productId, ...filtered].slice(0, MAX_ITEMS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  return { recentlyViewedIds: ids, addToRecentlyViewed };
}
