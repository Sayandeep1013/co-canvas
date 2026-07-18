import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@canvas/shared",
    "@blocknote/core",
    "@blocknote/react",
    "@blocknote/mantine",
  ],
  turbopack: {
    root: path.join(__dirname, "../.."),
  },
};

export default nextConfig;
