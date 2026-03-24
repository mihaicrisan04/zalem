// Pure TS recommendation algorithms — no Convex imports.
// Every function takes plain data and returns plain data.
// Independently testable, importable from any Convex function.

// -- types --

export type ProductAttrs = {
  _id: string;
  category: string;
  brand: string;
  tags: string[];
  useCases?: string[];
  goodFor?: string[];
  price: number;
  rating: number;
};

export type ScoredItem = {
  _id: string;
  score: number;
};

export type ScoredItemWithMeta = ScoredItem & {
  category: string;
  brand: string;
};

// -- set operations --

export function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// -- similarity functions --

export function priceProximity(a: number, b: number, maxRange: number): number {
  if (maxRange <= 0) return 1;
  return 1 - Math.min(Math.abs(a - b) / maxRange, 1);
}

export function ratingProximity(a: number, b: number): number {
  return 1 - Math.abs(a - b) / 4;
}

export function contentSimilarity(a: ProductAttrs, b: ProductAttrs, maxPriceRange: number): number {
  return (
    0.25 * (a.category === b.category ? 1 : 0) +
    0.2 * jaccard(a.tags, b.tags) +
    0.15 * jaccard(a.useCases ?? [], b.useCases ?? []) +
    0.1 * jaccard(a.goodFor ?? [], b.goodFor ?? []) +
    0.1 * (a.brand === b.brand ? 1 : 0) +
    0.1 * priceProximity(a.price, b.price, maxPriceRange) +
    0.1 * ratingProximity(a.rating, b.rating)
  );
}

export function rankBySimilarity(
  target: ProductAttrs,
  candidates: ProductAttrs[],
  maxPriceRange: number,
  limit: number,
): ScoredItem[] {
  const scored = candidates
    .filter((c) => c._id !== target._id)
    .map((c) => ({
      _id: c._id,
      score: contentSimilarity(target, c, maxPriceRange),
    }))
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit);
}

// -- co-occurrence (Jaccard) --

type OrderItems = { productId: string }[];

export function buildCoOccurrenceMatrix(
  orders: OrderItems[],
  minSupport: number,
): Map<string, Map<string, number>> {
  // count how many orders contain each product
  const productOrderCount = new Map<string, number>();
  // count how many orders contain both products
  const pairCount = new Map<string, number>();

  for (const order of orders) {
    const productIds = [...new Set(order.map((item) => item.productId))];

    for (const pid of productIds) {
      productOrderCount.set(pid, (productOrderCount.get(pid) ?? 0) + 1);
    }

    for (let i = 0; i < productIds.length; i++) {
      for (let j = i + 1; j < productIds.length; j++) {
        const key = [productIds[i], productIds[j]].sort().join("|");
        pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
      }
    }
  }

  // compute Jaccard similarity for each pair meeting min support
  const matrix = new Map<string, Map<string, number>>();

  for (const [key, count] of pairCount) {
    if (count < minSupport) continue;

    const [a, b] = key.split("|");
    const countA = productOrderCount.get(a) ?? 0;
    const countB = productOrderCount.get(b) ?? 0;
    const union = countA + countB - count;
    const jaccardScore = union > 0 ? count / union : 0;

    // store bidirectionally
    if (!matrix.has(a)) matrix.set(a, new Map());
    matrix.get(a)!.set(b, jaccardScore);

    if (!matrix.has(b)) matrix.set(b, new Map());
    matrix.get(b)!.set(a, jaccardScore);
  }

  return matrix;
}

export function getTopCoOccurrences(
  matrix: Map<string, Map<string, number>>,
  topN: number,
): { productIdA: string; productIdB: string; score: number }[] {
  const results: { productIdA: string; productIdB: string; score: number }[] = [];

  for (const [productIdA, related] of matrix) {
    const sorted = [...related.entries()].sort((a, b) => b[1] - a[1]).slice(0, topN);

    for (const [productIdB, score] of sorted) {
      results.push({ productIdA, productIdB, score });
    }
  }

  return results;
}

// -- trending with exponential decay --

export function computeTrendingScores(
  purchases: { productId: string; timestamp: number }[],
  now: number,
  lambda: number,
): Map<string, number> {
  const scores = new Map<string, number>();
  const msPerDay = 24 * 60 * 60 * 1000;

  for (const purchase of purchases) {
    const ageDays = (now - purchase.timestamp) / msPerDay;
    const decayedScore = Math.exp(-lambda * ageDays);
    scores.set(purchase.productId, (scores.get(purchase.productId) ?? 0) + decayedScore);
  }

  return scores;
}

// -- user preferences derivation --

type OrderForPreferences = {
  items: { productId: string; price: number }[];
};

type ProductForPreferences = {
  category: string;
  brand: string;
  tags: string[];
};

export function derivePreferences(
  orders: OrderForPreferences[],
  productLookup: Map<string, ProductForPreferences>,
): {
  favoriteCategories: string[];
  priceRange: { min: number; max: number };
  favoriteBrands: string[];
  interestTags: string[];
} {
  const categoryCounts = new Map<string, number>();
  const brandCounts = new Map<string, number>();
  const tagCounts = new Map<string, number>();
  let minPrice = Infinity;
  let maxPrice = 0;

  for (const order of orders) {
    for (const item of order.items) {
      minPrice = Math.min(minPrice, item.price);
      maxPrice = Math.max(maxPrice, item.price);

      const product = productLookup.get(item.productId);
      if (!product) continue;

      categoryCounts.set(product.category, (categoryCounts.get(product.category) ?? 0) + 1);
      brandCounts.set(product.brand, (brandCounts.get(product.brand) ?? 0) + 1);
      for (const tag of product.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
    }
  }

  const topN = (map: Map<string, number>, n: number) =>
    [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([key]) => key);

  return {
    favoriteCategories: topN(categoryCounts, 3),
    priceRange: {
      min: minPrice === Infinity ? 0 : minPrice,
      max: maxPrice === 0 ? 1000 : maxPrice,
    },
    favoriteBrands: topN(brandCounts, 5),
    interestTags: topN(tagCounts, 10),
  };
}

// -- MMR diversity reranking --

function itemSimilarity(
  a: { category: string; brand: string },
  b: { category: string; brand: string },
): number {
  if (a.brand === b.brand) return 1.0;
  if (a.category === b.category) return 0.5;
  return 0.0;
}

export function applyMMR(
  candidates: ScoredItemWithMeta[],
  lambda: number,
  limit: number,
): ScoredItem[] {
  if (candidates.length === 0) return [];

  const selected: ScoredItemWithMeta[] = [];
  const remaining = [...candidates];

  // pick best item first
  remaining.sort((a, b) => b.score - a.score);
  selected.push(remaining.shift()!);

  while (selected.length < limit && remaining.length > 0) {
    let bestIdx = 0;
    let bestMmrScore = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      const maxSim = Math.max(...selected.map((s) => itemSimilarity(candidate, s)));
      const mmrScore = lambda * candidate.score - (1 - lambda) * maxSim;

      if (mmrScore > bestMmrScore) {
        bestMmrScore = mmrScore;
        bestIdx = i;
      }
    }

    selected.push(remaining.splice(bestIdx, 1)[0]);
  }

  return selected.map(({ _id, score }) => ({ _id, score }));
}
