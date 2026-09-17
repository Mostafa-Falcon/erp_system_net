import type { NextConfig } from "next";

const isStaticExport = process.env.STATIC_EXPORT === "true";
const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  // 1. Static export for offline/desktop/windows 7 local hosting (via STATIC_EXPORT=true)
  // 2. Vercel deployment automatically packages serverless functions (output must NOT be standalone on Vercel)
  // 3. Docker / self-hosted node server uses standalone mode
  ...(isStaticExport
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : isVercel
    ? {}
    : { output: "standalone" }),
};

export default nextConfig;