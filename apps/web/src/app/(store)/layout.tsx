"use client";

import { StoreHeader } from "@/components/store-header";
import { CategoryNav } from "@/components/category-nav";
import { StoreFooter } from "@/components/store-footer";
import { AdvisorButton } from "@/components/advisor-button";
import { useBehaviorTracker, BehaviorTrackerContext } from "@/hooks/use-behavior-tracker";
import { useReadinessSignals } from "@/hooks/use-readiness-signals";
import { useMounted } from "@/hooks/use-mounted";
import { useQuery } from "convex/react";
import { api } from "@zalem/backend/convex/_generated/api";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const tracker = useBehaviorTracker();
  const cartCount = useQuery(api.cart.count) ?? 0;

  const readiness = useReadinessSignals(tracker.state, {
    hasCartItems: cartCount > 0,
  });

  // defer Base UI components until after hydration to suppress
  // ID mismatch warnings from auto-generated base-ui IDs
  if (!mounted) {
    return (
      <div className="flex min-h-svh flex-col">
        <div className="h-16 border-b" />
        <div className="border-b py-3" />
        <main className="flex-1">{children}</main>
      </div>
    );
  }

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
