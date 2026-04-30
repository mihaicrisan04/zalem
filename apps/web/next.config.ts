import path from "node:path";
import { fileURLToPath } from "node:url";
import "@zalem/env/web";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname, "../.."),
  typedRoutes: true,
  reactCompiler: true,
  images: {
    remotePatterns: [
      { hostname: "cdn.dummyjson.com" },
      { hostname: "dummyjson.com" },
      { hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
