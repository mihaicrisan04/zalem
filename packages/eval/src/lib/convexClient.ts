import { ConvexHttpClient } from "convex/browser";
import { config as loadDotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// __dirname equivalent for ESM — works under both bun and node
const here = dirname(fileURLToPath(import.meta.url));

// load env from packages/eval/.env first, then monorepo root as fallback
loadDotenv({ path: resolve(here, "../../.env") });
loadDotenv({ path: resolve(here, "../../../../.env") });

const url = process.env.CONVEX_EVAL_URL ?? process.env.CONVEX_URL;
if (!url) {
  throw new Error(
    "CONVEX_EVAL_URL (preferred) or CONVEX_URL must be set. " +
      "Point this at the eval Convex deployment, not production.",
  );
}

const evalSecret = process.env.CONVEX_EVAL_SECRET;
if (!evalSecret) {
  throw new Error(
    "CONVEX_EVAL_SECRET must be set. The eval Convex action checks this " +
      "value to bypass Clerk auth — it is the gatekeeper for the runOnce " +
      "endpoint and must never be exposed to the web app.",
  );
}

export const convex = new ConvexHttpClient(url);
export const evalAuthSecret = evalSecret;
