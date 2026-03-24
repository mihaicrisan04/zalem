"use client";

import { StoreHeader } from "@/components/store-header";
import { CategoryNav } from "@/components/category-nav";
import { StoreFooter } from "@/components/store-footer";
import { AdvisorButton } from "@/components/advisor-button";
import { useBehaviorTracker, BehaviorTrackerContext } from "@/hooks/use-behavior-tracker";
import { useReadinessSignals } from "@/hooks/use-readiness-signals";
import { useQuery } from "convex/react";
import { api } from "@zalem/backend/convex/_generated/api";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const tracker = useBehaviorTracker();
  const cartCount = useQuery(api.cart.count) ?? 0;

  const readiness = useReadinessSignals(tracker.state, {
    hasCartItems: cartCount > 0,
  });

  return (
    <BehaviorTrackerContext value={tracker}>
      <div className="flex min-h-svh flex-col">
        <StoreHeader />
        <CategoryNav />
        <main className="flex-1">{children}</main>
        <StoreFooter />
        <AdvisorButton shouldPulse={readiness.shouldPulseAdvisor} />
      </div>
    </BehaviorTrackerContext>
  );
}
