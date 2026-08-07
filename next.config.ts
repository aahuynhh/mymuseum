import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This project lives inside a parent folder that has an unrelated
  // project's lockfile; pin the workspace root so Next/Turbopack doesn't
  // guess wrong.
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
