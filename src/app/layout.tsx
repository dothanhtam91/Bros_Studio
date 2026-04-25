import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConditionalSiteChrome } from "@/components/layout/ConditionalSiteChrome";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

function metadataBaseUrl(): URL | undefined {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return undefined;
  try {
    return new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  // Production: set NEXT_PUBLIC_APP_URL=https://yourdomain.com so favicon <link> URLs are absolute (better for Google).
  metadataBase: metadataBaseUrl(),
  title: "BrosStudio | Luxury Real Estate Photography",
  description:
    "MLS-ready photos. Luxury delivery. 24–48h turnaround. Trusted by Houston agents.",
  // Favicons: app/icon.png + app/apple-icon.png (copies of logo). /favicon.ico rewrites to /logo.png in next.config.
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
      >
        <ConditionalSiteChrome>{children}</ConditionalSiteChrome>
      </body>
    </html>
  );
}
