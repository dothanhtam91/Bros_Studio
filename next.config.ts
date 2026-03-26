import type { NextConfig } from "next";

function r2ImageRemotePattern():
  | { protocol: "https"; hostname: string; pathname: string; search: string }
  | null {
  const raw = process.env.R2_PUBLIC_URL?.trim();
  if (!raw) return null;
  try {
    const href = raw.startsWith("http") ? raw : `https://${raw}`;
    const hostname = new URL(href).hostname;
    if (!hostname) return null;
    return {
      protocol: "https",
      hostname,
      pathname: "/**",
      search: "",
    };
  } catch {
    return null;
  }
}

const r2Pattern = r2ImageRemotePattern();

const nextConfig: NextConfig = {
  // Google and many clients request /favicon.ico explicitly; serve the same asset as public logo.
  async rewrites() {
    return [{ source: "/favicon.ico", destination: "/logo.png" }];
  },
  // Keep large deps out of serverless bundle (avoids Vercel 250 MB limit)
  serverExternalPackages: [
    "sharp",
    "@google/generative-ai",
    "googleapis",
    "@aws-sdk/client-s3",
    "@aws-sdk/s3-request-presigner",
    "archiver",
    "stripe",
    "resend",
    "@supabase/supabase-js",
    "@supabase/ssr",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, "").split("/")[0] || "placeholder.supabase.co",
        pathname: "/storage/v1/object/public/**",
        search: "",
      },
      ...(r2Pattern ? [r2Pattern] : []),
    ],
  },
};

export default nextConfig;
