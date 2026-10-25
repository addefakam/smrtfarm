import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Tell Turbopack this directory is the project root, even when nested
  // inside another workspace (prevents "outside configured roots" errors
  // when running build from inside /home/z/my-project/repo).
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
