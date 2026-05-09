// every productId mentioned in the answer must exist in the live Convex
// catalogue. this is the single biggest quality lever vs Rufus (28% price
// hallucination rate) — see docs/ai-integration-plan.md § 4.

import { anyApi, type FunctionReference } from "convex/server";
import { convex } from "../lib/convexClient";

type Context = {
  vars?: { expectedProductIds?: string[] };
  providerResponse?: { metadata?: { parts?: unknown[] } };
};

// Convex IDs in this deployment are 32-char URL-safe alphanumerics that start
// with a lowercase letter. products in particular start with "k". match
// liberally and let the Convex query be the source of truth.
const PRODUCT_ID_REGEX = /\bk[0-9a-z]{31}\b/g;

// see advisorProvider.ts for why we use anyApi + self-typed FunctionReference
const productGetRef = (anyApi as unknown as { products: { get: unknown } }).products
  .get as FunctionReference<
  "query",
  "public",
  { id: string },
  { _id: string; title: string; price: number; rating: number } | null
>;

export default async function groundedness(output: string, _context: Context) {
  const cited = Array.from(new Set(output.match(PRODUCT_ID_REGEX) ?? []));

  if (cited.length === 0) {
    return {
      pass: true,
      score: 1,
      reason: "no productIds cited — vacuously grounded",
    };
  }

  const lookups = await Promise.all(
    cited.map(async (id) => {
      try {
        const product = await convex.query(productGetRef, { id });
        return { id, exists: product !== null };
      } catch {
        return { id, exists: false };
      }
    }),
  );

  const missing = lookups.filter((l) => !l.exists).map((l) => l.id);
  const grounded = cited.length - missing.length;
  const score = grounded / cited.length;

  return {
    pass: missing.length === 0,
    score,
    reason:
      missing.length === 0
        ? `all ${cited.length} cited productIds exist in catalogue`
        : `${missing.length}/${cited.length} cited IDs are hallucinated: ${missing.join(", ")}`,
  };
}
