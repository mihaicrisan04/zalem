"use client";

import { StoreHeader } from "@/components/store-header";
import { CategoryNav } from "@/components/category-nav";
import { StoreFooter } from "@/components/store-footer";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <StoreHeader />
      <CategoryNav />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}
