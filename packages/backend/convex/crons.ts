import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// recompute co-occurrence scores daily at 3:00 AM UTC
crons.cron(
  "recompute co-occurrences",
  "0 3 * * *",
  internal.recommendations.recomputeCoOccurrences,
  {},
);

// recompute trending scores daily at 3:15 AM UTC
crons.cron(
  "recompute trending scores",
  "15 3 * * *",
  internal.recommendations.recomputeTrendingScores,
  {},
);

export default crons;
