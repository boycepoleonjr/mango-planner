import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Fully client-side tool: build to static files in `out/`.
  output: "export",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
