import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";

const nextConfig: NextConfig = {
  // Static export mode for deployments to weak/offline hosts (Windows 7 + local
  // file/Nginx servers). Enabled explicitly via STATIC_EXPORT=true since the
  // app is data-driven offline-first and needs no server at runtime.
  ...(isStaticExport
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : { output: "standalone" }),
};

export default nextConfig;