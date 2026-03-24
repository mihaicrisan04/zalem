"use client";

import { StoreHeader } from "@/components/store-header";
import { CategoryNav } from "@/components/category-nav";
import { StoreFooter } from "@/components/store-footer";
import { AdvisorButton } from "@/components/advisor-button";
import { AdvisorSidebar } from "@/components/advisor-sidebar";
import { AdvisorProvider, useAdvisor } from "@/hooks/use-advisor";
import { useBehaviorTracker, BehaviorTrackerContext } from "@/hooks/use-behavior-tracker";
import { useReadinessSignals } from "@/hooks/use-readiness-signals";
import { useMounted } from "@/hooks/use-mounted";
import { useQuery } from "convex/react";
import { api } from "@zalem/backend/convex/_generated/api";

function StoreContent({ children }: { children: React.ReactNode }) {
  const mounted = useMounted();
  const { isOpen, sidebarWidth } = useAdvisor();

  return (
    <>
      <div
        className="flex min-h-svh flex-col transition-[margin-right] duration-300 ease-out"
        style={{ marginRight: isOpen ? `${sidebarWidth}px` : 0 }}
      >
        {mounted ? (
          <>
            <StoreHeader />
            <CategoryNav />
          </>
        ) : (
          <>
            <div className="h-16 border-b" />
            <div className="border-b py-3" />
          </>
        )}
        <main className="flex-1">{children}</main>
        {mounted && <StoreFooter />}
      </div>

      {mounted && <AdvisorSidebar />}
    </>
  );
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const tracker = useBehaviorTracker();
  const mounted = useMounted();
  const cartCount = useQuery(api.cart.count) ?? 0;

  const readiness = useReadinessSignals(tracker.state, {
    hasCartItems: cartCount > 0,
  });

  return (
    <BehaviorTrackerContext value={tracker}>
      <AdvisorProvider>
        <StoreContent>{children}</StoreContent>
        {mounted && <AdvisorButton shouldPulse={readiness.shouldPulseAdvisor} />}
      </AdvisorProvider>
    </BehaviorTrackerContext>
  );
}
