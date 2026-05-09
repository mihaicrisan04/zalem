// generalises the embedding-based theme validator already shipped in
// packages/backend/convex/ai/reviewSummaries.ts:127. when the agent claims a
// review theme ("buyers love the battery life"), check the claim's embedding
// against the embedded review corpus for that product. low semantic similarity
// → fabricated theme.
//
// only runs for rows that opt in via vars.checkReviewFidelity = true to keep
// per-row cost low. requires the embedding model + review corpus access via
// Convex; deferred to phase 8.3 wiring.

type Context = {
  vars?: { checkReviewFidelity?: boolean; productId?: string };
  providerResponse?: { metadata?: unknown };
};

const SIMILARITY_THRESHOLD = 0.35; // matches reviewSummaries.ts threshold

export default async function reviewThemeFidelity(output: string, context: Context) {
  if (!context.vars?.checkReviewFidelity || !context.vars.productId) {
    return {
      pass: true,
      score: 1,
      reason: "row did not opt into review-theme fidelity check",
    };
  }

  // TODO(phase-8.3):
  //   1. extract candidate "theme" sentences from `output` (any sentence
  //      that makes a claim about what reviewers say). a small heuristic
  //      regex is enough for v1.
  //   2. embed each candidate via the same embedding model used in
  //      reviewSummaries.ts.
  //   3. fetch the embedded reviews for vars.productId from Convex.
  //   4. score = fraction of candidates that have ≥ SIMILARITY_THRESHOLD
  //      cosine similarity to at least 2 reviews.
  void output;
  void SIMILARITY_THRESHOLD;

  return {
    pass: true,
    score: 1,
    reason: "review-theme fidelity scorer not yet implemented",
  };
}
