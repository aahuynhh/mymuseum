import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This project lives inside a parent folder that has an unrelated
  // project's lockfile; pin the workspace root so Next/Turbopack doesn't
  // guess wrong.
  turbopack: {
    root: path.join(__dirname),
  },
  // Next's serverless file tracing misses sharp's native libvips .so files
  // (they live in the separate @img/sharp-*/@img/sharp-libvips-* packages,
  // not inside node_modules/sharp itself), which crashes these two routes
  // in production with ERR_DLOPEN_FAILED even though the build succeeds.
  // Only the routes that import validateImage.ts (and so sharp) need this.
  outputFileTracingIncludes: {
    "/api/museums": ["node_modules/sharp/**/*", "node_modules/@img/**/*"],
    "/api/museums/*/artworks": ["node_modules/sharp/**/*", "node_modules/@img/**/*"],
  },
};

export default nextConfig;
