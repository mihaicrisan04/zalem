// every productId mentioned in the answer must exist in the live Convex
// catalogue. this is the single biggest quality lever vs Rufus (28% price
// hallucination rate) — see docs/ai-integration-plan.md § 4.

// import { convex } from "../lib/convexClient";
// import { api } from "@zalem/backend/convex/_generated/api";

type Context = {
  vars?: { expectedProductIds?: string[] };
  providerResponse?: { metadata?: { parts?: unknown[] } };
};

// matches Convex IDs in free-text output. tighten this regex once the actual
// production ID format is locked (currently looks like "k57abc..." in prompts).
const PRODUCT_ID_REGEX = /\b[a-z][a-z0-9]{15,}\b/gi;

export default async function groundedness(output: string, _context: Context) {
  const cited = Array.from(new Set(output.match(PRODUCT_ID_REGEX) ?? []));

  if (cited.length === 0) {
    return {
      pass: true,
      score: 1,
      reason: "no productIds cited — vacuously grounded",
    };
  }

  // TODO(phase-8.3): replace with a real Convex query
  //   const lookups = await Promise.all(
  //     cited.map((id) => convex.query(api.products.exists, { id })),
  //   );
  //   const missing = cited.filter((_id, i) => !lookups[i]);
  const missing: string[] = [];

  const grounded = cited.length - missing.length;
  const score = cited.length === 0 ? 1 : grounded / cited.length;

  return {
    pass: missing.length === 0,
    score,
    reason:
      missing.length === 0
        ? `all ${cited.length} cited productIds exist in catalogue`
        : `${missing.length}/${cited.length} cited IDs are hallucinated: ${missing.join(", ")}`,
  };
}
