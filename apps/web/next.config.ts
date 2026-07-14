import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The shared package ships raw .ts; let Next transpile it.
  transpilePackages: ["@canvas/shared"],
};

export default nextConfig;
