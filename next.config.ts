import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep large deps out of serverless bundle (avoids Vercel 250 MB limit)
  serverExternalPackages: [
    "sharp",
    "@google/generative-ai",
    "googleapis",
    "@aws-sdk/client-s3",
    "archiver",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/^https?:\/\//, "").split("/")[0] || "placeholder.supabase.co",
        pathname: "/storage/v1/object/public/**",
        search: "",
      },
      ...(process.env.R2_PUBLIC_URL
        ? [
            {
              protocol: "https" as const,
              hostname: new URL(process.env.R2_PUBLIC_URL).hostname,
              pathname: "/**",
              search: "",
            },
          ]
        : []),
    ],
  },
};

export default nextConfig;
