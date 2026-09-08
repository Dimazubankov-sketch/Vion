import type { NextConfig } from "next";

/**
 * GitHub Pages serves the site from a subfolder (`/<repo>/`), so the build for
 * Pages sets NEXT_PUBLIC_BASE_PATH. Locally the variable is unset and the app
 * keeps running at the root.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // The whole app is client-side (localStorage, no server), so it exports
  // cleanly to static files.
  output: "export",
  basePath,
  // Pages has no image optimiser behind it.
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
