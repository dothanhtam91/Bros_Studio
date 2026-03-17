import type { Metadata } from "next";
import { readdirSync } from "fs";
import { join } from "path";
import { PortfolioIntro } from "@/components/portfolio/PortfolioIntro";
import { PortfolioDescriptorRail } from "@/components/portfolio/PortfolioDescriptorRail";
import { PortfolioCategoryNav } from "@/components/portfolio/PortfolioCategoryNav";
import { PortfolioShowcase } from "@/components/portfolio/PortfolioShowcase";
import { ServiceTypePanels } from "@/components/portfolio/ServiceTypePanels";
import { PortfolioCTA } from "@/components/portfolio/PortfolioCTA";

export const metadata: Metadata = {
  title: "Portfolio | BrosStudio",
  description:
    "A curated collection of property imagery: interiors, exteriors, twilight, and aerial work across residential and commercial settings.",
};

function getLocalPortfolioImages(): { src: string; folder: string }[] {
  const publicDir = join(process.cwd(), "public", "portfolio");
  const items: { src: string; folder: string }[] = [];
  const imageExt = /\.(jpg|jpeg|png|webp|gif)$/i;

  try {
    const files = readdirSync(publicDir).filter((f) => imageExt.test(f));
    files.forEach((f) =>
      items.push({ src: `/portfolio/${f}`, folder: "portfolio" })
    );
  } catch {
    // portfolio folder may not exist
  }

  try {
    const v1 = join(publicDir, "v1");
    const files = readdirSync(v1).filter((f) => imageExt.test(f));
    files.forEach((f) =>
      items.push({ src: `/portfolio/v1/${f}`, folder: "v1" })
    );
  } catch {
    // v1 folder may not exist
  }

  try {
    const v2Mls = join(publicDir, "v2", "MLS");
    const files = readdirSync(v2Mls).filter((f) => imageExt.test(f));
    files.forEach((f) =>
      items.push({ src: `/portfolio/v2/MLS/${f}`, folder: "MLS" })
    );
  } catch {
    // v2/MLS may not exist
  }

  return items;
}

function getSupabasePortfolioImageUrl(storageKey: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "";
  return `${url}/storage/v1/object/public/portfolio/${storageKey}`;
}

type PortfolioItem = {
  src: string;
  alt: string;
  category?: string;
  title?: string;
  unoptimized: boolean;
};

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const localImages = getLocalPortfolioImages();

  let portfolioItems: PortfolioItem[] = [];

  // 1. Prefer Cloudflare R2: list bucket under "portfolio/" — uploads there show automatically
  try {
    const { getR2Config, listR2PortfolioKeys, getR2PublicUrl } = await import(
      "@/lib/r2/client"
    );
    if (getR2Config().configured) {
      const r2Items = await listR2PortfolioKeys();
      if (r2Items.length > 0) {
        portfolioItems = r2Items.map((item, i) => ({
          src: getR2PublicUrl(item.key),
          alt: `Portfolio ${i + 1}`,
          category: item.folder,
          unoptimized: true,
        }));
      }
    }
  } catch {
    // R2 not configured or list failed; fall through to Supabase or local
  }

  // 2. Supabase portfolio_items (if no R2 items)
  if (portfolioItems.length === 0) {
    const hasSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    let uploadedItems: {
      id: string;
      drive_file_id: string;
      name: string;
      folder_label: string | null;
    }[] | null = null;

    if (hasSupabase) {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase
        .from("portfolio_items")
        .select("id, drive_file_id, name, folder_label")
        .is("user_id", null)
        .order("sort_order", { ascending: true });
      uploadedItems = data;
    }

    if (uploadedItems && uploadedItems.length > 0) {
      portfolioItems = uploadedItems.map((item) => ({
        src: getSupabasePortfolioImageUrl(item.drive_file_id),
        alt: item.name,
        category: item.folder_label ?? undefined,
        title: item.name,
        unoptimized: true,
      }));
    }
  }

  // 3. Local public/portfolio images (if still empty)
  if (portfolioItems.length === 0) {
    portfolioItems = localImages.map((item, i) => ({
      src: item.src,
      alt: `Portfolio ${i + 1}`,
      category: item.folder,
      unoptimized: false,
    }));
  }

  return (
    <main className="min-h-screen bg-[#f6f6f5] pt-16">
      {/* Unified gallery-style background — matches header */}
      <div
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "linear-gradient(165deg, #fafaf9 0%, #f6f6f5 30%, #f2f2f1 70%, #f6f6f5 100%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 60% 20%, rgba(251,191,36,0.035), transparent 50%), radial-gradient(ellipse 50% 30% at 20% 80%, rgba(0,0,0,0.02), transparent 45%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-[0.25]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)`,
          backgroundSize: "72px 72px",
        }}
        aria-hidden
      />

      <PortfolioIntro />
      <PortfolioDescriptorRail />
      <PortfolioCategoryNav currentType={type ?? null} />
      <PortfolioShowcase
        items={portfolioItems}
        currentType={type ?? null}
      />
      <ServiceTypePanels />
      <PortfolioCTA />
    </main>
  );
}
