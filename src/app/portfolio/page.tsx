import type { Metadata } from "next";
import { readdirSync } from "fs";
import { join } from "path";
import { PortfolioHero } from "@/components/portfolio/PortfolioHero";
import { PortfolioFilters } from "@/components/portfolio/PortfolioFilters";
import { PortfolioGrid } from "@/components/portfolio/PortfolioGrid";
import { PortfolioCTA } from "@/components/portfolio/PortfolioCTA";
import {
  getR2Config,
  getR2PublicUrl,
  listR2StudioPortfolioKeys,
  normalizePortfolioR2Key,
} from "@/lib/r2/client";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Portfolio | BrosStudio",
  description:
    "A curated collection of drone, interior, exterior, twilight, and detailed real estate imagery.",
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
    /* portfolio folder may not exist */
  }

  try {
    const v1 = join(publicDir, "v1");
    const files = readdirSync(v1).filter((f) => imageExt.test(f));
    files.forEach((f) =>
      items.push({ src: `/portfolio/v1/${f}`, folder: "v1" })
    );
  } catch {
    /* v1 folder may not exist */
  }

  try {
    const v2Mls = join(publicDir, "v2", "MLS");
    const files = readdirSync(v2Mls).filter((f) => imageExt.test(f));
    files.forEach((f) =>
      items.push({ src: `/portfolio/v2/MLS/${f}`, folder: "MLS" })
    );
  } catch {
    /* v2/MLS may not exist */
  }

  return items;
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

  const portfolioItems: PortfolioItem[] = [];

  if (getR2Config().configured) {
    const dbKeys = new Set<string>();
    const hasSupabase =
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (hasSupabase) {
      const supabase = await createClient();
      const { data: uploadedItems } = await supabase
        .from("portfolio_items")
        .select("id, drive_file_id, name, folder_label")
        .is("user_id", null)
        .order("sort_order", { ascending: true });

      for (const item of uploadedItems ?? []) {
        const key = normalizePortfolioR2Key(item.drive_file_id);
        dbKeys.add(key);
        portfolioItems.push({
          src: getR2PublicUrl(key),
          alt: item.name,
          category: item.folder_label ?? undefined,
          title: item.name,
          unoptimized: true,
        });
      }
    }

    const orphans = await listR2StudioPortfolioKeys();
    for (const o of orphans) {
      if (dbKeys.has(o.key)) continue;
      portfolioItems.push({
        src: getR2PublicUrl(o.key),
        alt: `Portfolio ${portfolioItems.length + 1}`,
        category: o.folder,
        unoptimized: true,
      });
    }
  }

  if (portfolioItems.length === 0) {
    localImages.forEach((item, i) => {
      portfolioItems.push({
        src: item.src,
        alt: `Portfolio ${i + 1}`,
        category: item.folder,
        unoptimized: false,
      });
    });
  }

  const featured = portfolioItems.slice(0, 5).map((i) => ({
    src: i.src,
    alt: i.alt,
    unoptimized: i.unoptimized,
  }));

  return (
    <main className="min-h-screen bg-[var(--background)] pt-16">
      <PortfolioHero featured={featured} />
      <PortfolioFilters currentType={type ?? null} />
      <PortfolioGrid
        items={portfolioItems}
        currentType={type ?? null}
        allItems={portfolioItems}
      />
      <PortfolioCTA />
    </main>
  );
}
