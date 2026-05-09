// DB snapshot helpers used by factuality.ts.
//
// the runOnce Convex action is the source of truth — it captures
// { [productId]: { price, rating } } for every product the agent saw or
// returned, at the moment the agent ran. that snapshot is returned to the
// provider and ends up in metadata.dbSnapshot.
//
// this file is the place to add aggregation utilities once we want
// cross-row reporting (e.g. "how many configs hallucinated a price for
// product X across the sweep?").

export type DbSnapshot = Record<string, { price: number; rating: number }>;

export function mergeSnapshots(snapshots: DbSnapshot[]): DbSnapshot {
  const merged: DbSnapshot = {};
  for (const s of snapshots) {
    for (const [id, entry] of Object.entries(s)) {
      merged[id] = entry;
    }
  }
  return merged;
}
