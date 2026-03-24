"use client";

import { use } from "react";
import { CategoryPageClient } from "@/components/category/category-page-client";

export default function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = use(params);
  const search = use(searchParams);

  return <CategoryPageClient slug={slug} searchParams={search} />;
}
