// generalises the embedding-based theme validator already shipped in
// packages/backend/convex/ai/reviewSummaries.ts:127. when the agent claims
// a review theme ("buyers love the battery life"), check the claim's
// embedding against the embedded review corpus for that product. low
// semantic similarity → fabricated theme.
//
// only runs for rows that opt in via vars.checkReviewFidelity = true to keep
// per-row cost bounded (each call embeds the extracted themes via the same
// model used in production).

import { anyApi, type FunctionReference } from "convex/server";
import { convex, evalAuthSecret } from "../lib/convexClient";

type Context = {
  vars?: { checkReviewFidelity?: boolean; productId?: string };
  providerResponse?: { metadata?: unknown };
};

// matches sentences that make a reviewer/buyer claim. crude but sufficient
// for v1 — the goal is to find candidate "themes" the agent attributes to
// reviews, not to exhaustively NLP-parse the text.
const THEME_SIGNAL =
  /\b(buyers?|reviewers?|users?|customers?|shoppers?|people)\b.*\b(say|said|love|loved|like|liked|hate|hated|complain|complained|report|reported|mention|mentioned|note|noted|find|found|praise|praised|criticize|criticized)/i;
const REVIEW_SIGNAL =
  /\breviews?\s+(say|mention|show|reveal|suggest|indicate|complain|praise|love|hate)/i;
const SENTENCE_SPLIT = /(?<=[.!?])\s+/;

function extractThemes(output: string): string[] {
  return output
    .split(SENTENCE_SPLIT)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && (THEME_SIGNAL.test(s) || REVIEW_SIGNAL.test(s)))
    .slice(0, 8); // cap to avoid embedding blow-up on chatty answers
}

// see advisorProvider.ts for why we use anyApi + self-typed FunctionReference
type CheckThemesArgs = { authSecret: string; productId: string; themes: string[] };
type CheckThemesResult = {
  themes: Array<{ theme: string; semanticMatches: number }>;
  note?: string;
};
const checkThemesRef = (
  anyApi as unknown as { ai: { evals: { checkThemes: { checkThemes: unknown } } } }
).ai.evals.checkThemes.checkThemes as FunctionReference<
  "action",
  "public",
  CheckThemesArgs,
  CheckThemesResult
>;

const MIN_MATCHING_REVIEWS = 2;

export default async function reviewThemeFidelity(output: string, context: Context) {
  if (!context.vars?.checkReviewFidelity || !context.vars.productId) {
    return {
      pass: true,
      score: 1,
      reason: "row did not opt into review-theme fidelity check",
    };
  }

  const themes = extractThemes(output);
  if (themes.length === 0) {
    return {
      pass: true,
      score: 1,
      reason: "no review-claim sentences detected — vacuously grounded",
    };
  }

  try {
    const result = await convex.action(checkThemesRef, {
      authSecret: evalAuthSecret,
      productId: context.vars.productId,
      themes,
    });

    if (result.note) {
      return {
        pass: true,
        score: 1,
        reason: `${result.note} — scoring as vacuously grounded`,
      };
    }

    const grounded = result.themes.filter((t) => t.semanticMatches >= MIN_MATCHING_REVIEWS);
    const score = grounded.length / themes.length;
    const ungrounded = result.themes.filter((t) => t.semanticMatches < MIN_MATCHING_REVIEWS);

    return {
      pass: ungrounded.length === 0,
      score,
      reason:
        ungrounded.length === 0
          ? `all ${themes.length} review themes have ≥${MIN_MATCHING_REVIEWS} semantic matches`
          : `${ungrounded.length}/${themes.length} themes look fabricated: ${ungrounded
              .map((t) => `"${t.theme.slice(0, 60)}…" (${t.semanticMatches} matches)`)
              .join("; ")}`,
    };
  } catch (err) {
    return {
      pass: false,
      score: 0,
      reason: `theme check failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
