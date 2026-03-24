import "@zalem/env/web";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  images: {
    remotePatterns: [{ hostname: "cdn.dummyjson.com" }, { hostname: "dummyjson.com" }],
  },
};

export default nextConfig;
