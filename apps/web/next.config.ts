import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@canvas/shared",
    "@blocknote/core",
    "@blocknote/react",
    "@blocknote/mantine",
  ],
};

export default nextConfig;
