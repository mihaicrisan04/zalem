// price/rating claims in the answer must match the DB snapshot taken when
// this row was run. catches fabricated numbers. requires advisorProvider to
// populate metadata.dbSnapshot — see docs/eval-system-plan.md.

type Snapshot = Record<string, { price: number; rating: number }>;

type Context = {
  providerResponse?: { metadata?: { dbSnapshot?: Snapshot } };
};

const PRICE_REGEX = /\$\s?(\d+(?:\.\d{1,2})?)/g;
const RATING_REGEX = /(\d(?:\.\d)?)\s*(?:\/\s*5|stars?|★)/gi;
const PRICE_TOLERANCE = 0.01;
const RATING_TOLERANCE = 0.1;

export default function factuality(output: string, context: Context) {
  const snapshot = context.providerResponse?.metadata?.dbSnapshot ?? {};
  const truePrices = new Set(Object.values(snapshot).map((p) => Number(p.price.toFixed(2))));
  const trueRatings = new Set(Object.values(snapshot).map((p) => Number(p.rating.toFixed(1))));

  const claimedPrices = Array.from(output.matchAll(PRICE_REGEX), (m) => Number(m[1]));
  const claimedRatings = Array.from(output.matchAll(RATING_REGEX), (m) => Number(m[1]));

  if (claimedPrices.length === 0 && claimedRatings.length === 0) {
    return {
      pass: true,
      score: 1,
      reason: "no price/rating claims to verify",
    };
  }

  const matchesNumber = (claim: number, truth: Set<number>, tol: number) => {
    for (const t of truth) {
      if (Math.abs(t - claim) <= tol) return true;
    }
    return false;
  };

  const fabricatedPrices = claimedPrices.filter(
    (p) => !matchesNumber(p, truePrices, PRICE_TOLERANCE),
  );
  const fabricatedRatings = claimedRatings.filter(
    (r) => !matchesNumber(r, trueRatings, RATING_TOLERANCE),
  );

  const totalClaims = claimedPrices.length + claimedRatings.length;
  const fabricated = fabricatedPrices.length + fabricatedRatings.length;
  const score = totalClaims === 0 ? 1 : (totalClaims - fabricated) / totalClaims;

  return {
    pass: fabricated === 0,
    score,
    reason:
      fabricated === 0
        ? `all ${totalClaims} factual claims match snapshot`
        : `${fabricated}/${totalClaims} claims don't match the DB at run time` +
          (fabricatedPrices.length ? `; bad prices: ${fabricatedPrices.join(", ")}` : "") +
          (fabricatedRatings.length ? `; bad ratings: ${fabricatedRatings.join(", ")}` : ""),
  };
}
