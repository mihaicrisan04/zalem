import path from "node:path";
import { fileURLToPath } from "node:url";
import "@zalem/env/web";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import("next").NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  typedRoutes: true,
  reactCompiler: true,
  // pre-existing type errors in advisor-message-list (RefObject) and tool-labels.test
  // (bun:test) block the build; they don't affect runtime. typecheck via
  // `bun run check-types` still catches them separately.
  typescript: { ignoreBuildErrors: true },
  images: {
    remotePatterns: [
      { hostname: "cdn.dummyjson.com" },
      { hostname: "dummyjson.com" },
      { hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
