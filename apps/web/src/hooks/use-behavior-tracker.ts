"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useMutation } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@zalem/backend/convex/_generated/api";
import type { Id } from "@zalem/backend/convex/_generated/dataModel";
import type { ProductEngagement } from "./use-product-engagement";

// -- types --

export type BehaviorTrackerState = {
  productsViewed: Map<string, TrackedProduct>;
  currentPage: string;
  categoryHistory: string[];
};

type TrackedProduct = {
  productId: string;
  dwellTimeMs: number;
  scrollDepth: number;
  cursorHoverMs: number;
  viewedReviews: boolean;
  timestamp: number;
  category?: string;
};

type BehaviorTrackerContextValue = {
  state: BehaviorTrackerState;
  trackProduct: (engagement: ProductEngagement, category?: string) => void;
  setViewedReviews: (productId: string) => void;
  addCategoryView: (category: string) => void;
};

export const BehaviorTrackerContext = createContext<BehaviorTrackerContextValue | null>(null);

export function useBehaviorTrackerContext() {
  const ctx = useContext(BehaviorTrackerContext);
  if (!ctx) {
    throw new Error("useBehaviorTrackerContext must be used within BehaviorTrackerProvider");
  }
  return ctx;
}

// -- session ID management --

const SESSION_KEY = "zalem-session-id";

function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// -- hook --

export function useBehaviorTracker() {
  const pathname = usePathname();
  const { userId } = useAuth();
  const upsertSession = useMutation(api.behavior.upsertSession);

  const [state, setState] = useState<BehaviorTrackerState>({
    productsViewed: new Map(),
    currentPage: pathname,
    categoryHistory: [],
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const sessionIdRef = useRef<string>("ssr");
  useEffect(() => {
    sessionIdRef.current = getSessionId();
  }, []);

  // track page changes
  useEffect(() => {
    setState((prev) => ({ ...prev, currentPage: pathname }));
  }, [pathname]);

  // track product engagement
  const trackProduct = useCallback((engagement: ProductEngagement, category?: string) => {
    setState((prev) => {
      const map = new Map(prev.productsViewed);
      const existing = map.get(engagement.productId);
      map.set(engagement.productId, {
        productId: engagement.productId,
        dwellTimeMs: Math.max(existing?.dwellTimeMs ?? 0, engagement.dwellTimeMs),
        scrollDepth: Math.max(existing?.scrollDepth ?? 0, engagement.scrollDepth),
        cursorHoverMs: Math.max(existing?.cursorHoverMs ?? 0, engagement.cursorHoverMs),
        viewedReviews: existing?.viewedReviews ?? false,
        timestamp: Date.now(),
        category: category ?? existing?.category,
      });
      return { ...prev, productsViewed: map };
    });
  }, []);

  const setViewedReviews = useCallback((productId: string) => {
    setState((prev) => {
      const map = new Map(prev.productsViewed);
      const existing = map.get(productId);
      if (existing) {
        map.set(productId, { ...existing, viewedReviews: true });
      }
      return { ...prev, productsViewed: map };
    });
  }, []);

  const addCategoryView = useCallback((category: string) => {
    setState((prev) => {
      const history = [...prev.categoryHistory, category].slice(-20);
      return { ...prev, categoryHistory: history };
    });
  }, []);

  // flush to backend
  const flush = useCallback(() => {
    const s = stateRef.current;
    if (s.productsViewed.size === 0) return;
    if (sessionIdRef.current === "ssr") return;

    const productsViewed = [...s.productsViewed.values()].map((p) => ({
      productId: p.productId as Id<"products">,
      dwellTimeMs: p.dwellTimeMs,
      scrollDepth: p.scrollDepth,
      cursorHoverMs: p.cursorHoverMs,
      viewedReviews: p.viewedReviews,
      timestamp: p.timestamp,
    }));

    upsertSession({
      sessionId: sessionIdRef.current,
      clerkUserId: userId ?? undefined,
      currentPage: s.currentPage,
      productsViewed,
      cartProductIds: [],
    }).catch(() => {
      // silently ignore flush errors
    });
  }, [upsertSession, userId]);

  // flush every 5 seconds
  useEffect(() => {
    const interval = setInterval(flush, 5000);
    return () => clearInterval(interval);
  }, [flush]);

  // flush on page change
  useEffect(() => {
    flush();
  }, [pathname, flush]);

  // flush on tab hide/close
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        flush();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [flush]);

  return {
    state,
    trackProduct,
    setViewedReviews,
    addCategoryView,
  };
}
