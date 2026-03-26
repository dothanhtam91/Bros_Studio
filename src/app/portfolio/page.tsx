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
import { resolveStudioPortfolioCategory } from "@/lib/portfolioCategories";
import { createClient } from "@/lib/supabase/server";

/** Fresh data on every request (uploads and filters must not serve stale empty pages). */
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const r2Ok = getR2Config().configured;
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());

  try {
    const dbKeys = new Set<string>();

    // Load DB rows whenever Supabase is configured — do not gate on R2 (R2 only affects image URLs).
    if (hasSupabase) {
      const supabase = await createClient();
      const { data: uploadedItems, error: dbError } = await supabase
        .from("portfolio_items")
        .select("id, drive_file_id, name, folder_label")
        .is("user_id", null)
        .order("sort_order", { ascending: true });

      if (dbError) {
        console.error("[Portfolio] portfolio_items select:", dbError.message);
      }

      for (const item of uploadedItems ?? []) {
        const key = normalizePortfolioR2Key(item.drive_file_id);
        dbKeys.add(key);
        const category = resolveStudioPortfolioCategory(item.folder_label, key);

        if (!r2Ok) {
          continue;
        }

        try {
          portfolioItems.push({
            src: getR2PublicUrl(key),
            alt: item.name,
            category,
            title: item.name,
            unoptimized: true,
          });
        } catch (e) {
          console.error("[Portfolio] Bad image URL for key:", key, e);
        }
      }
    }

    if (r2Ok) {
      const orphans = await listR2StudioPortfolioKeys();
      for (const o of orphans) {
        if (dbKeys.has(o.key)) continue;
        try {
          portfolioItems.push({
            src: getR2PublicUrl(o.key),
            alt: `Portfolio ${portfolioItems.length + 1}`,
            category:
              resolveStudioPortfolioCategory(null, o.key) ??
              (o.folder !== "portfolio" ? o.folder : undefined),
            unoptimized: true,
          });
        } catch (e) {
          console.error("[Portfolio] Orphan URL failed:", o.key, e);
        }
      }
    }
  } catch (err) {
    console.error("[Portfolio] Failed to load gallery data:", err);
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
