import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  outputFileTracingRoot: process.cwd(),
  serverExternalPackages: ["takumi-js", "@takumi-rs/core", "@takumi-rs/wasm"]
};

export default nextConfig;
