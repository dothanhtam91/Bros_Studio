import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { readdirSync } from "fs";
import { join } from "path";

export const metadata: Metadata = {
  title: "Portfolio | BrosStudio",
  description: "Luxury real estate photography portfolio. Luxury, Condo, Townhome, Commercial, Night.",
};

const PROPERTY_TYPES = [
  "All",
  "Luxury",
  "Condo",
  "Townhome",
  "Commercial",
  "Night",
] as const;

function getLocalPortfolioImages(): { src: string; folder: string }[] {
  const publicDir = join(process.cwd(), "public", "portfolio");
  const items: { src: string; folder: string }[] = [];
  const imageExt = /\.(jpg|jpeg|png|webp|gif)$/i;

  try {
    const files = readdirSync(publicDir).filter((f) => imageExt.test(f));
    files.forEach((f) => items.push({ src: `/portfolio/${f}`, folder: "portfolio" }));
  } catch {
    // portfolio folder may not exist
  }

  try {
    const v1 = join(publicDir, "v1");
    const files = readdirSync(v1).filter((f) => imageExt.test(f));
    files.forEach((f) => items.push({ src: `/portfolio/v1/${f}`, folder: "v1" }));
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

function getPortfolioImageUrl(storageKey: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "";
  return `${url}/storage/v1/object/public/portfolio/${storageKey}`;
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const localImages = getLocalPortfolioImages();

  const hasSupabase =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let uploadedItems: { id: string; drive_file_id: string; name: string; folder_label: string | null }[] | null = null;

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

  const hasUploaded = uploadedItems && uploadedItems.length > 0;

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Portfolio
        </h1>
        <p className="mt-2 text-zinc-600">
          {hasUploaded
            ? "Your real estate photography."
            : localImages.length > 0
              ? "Your real estate photography (from local folder)."
              : "Upload images in Admin → Portfolio, or add files to public/portfolio/ or public/portfolio/v1/."}
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          <span className="text-sm font-medium text-zinc-500">Type:</span>
          {PROPERTY_TYPES.map((t) => (
            <Link
              key={t}
              href={t === "All" ? "/portfolio" : `/portfolio?type=${t.toLowerCase()}`}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                (!type && t === "All") || type === t.toLowerCase()
                  ? "border-amber-200/90 bg-amber-50 text-stone-800"
                  : "border-amber-200/80 bg-white text-stone-700 hover:bg-amber-50/80"
              }`}
            >
              {t}
            </Link>
          ))}
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {hasUploaded ? (
            (uploadedItems || []).map((item) => {
              const src = getPortfolioImageUrl(item.drive_file_id);
              if (!src) return null;
              return (
                <div
                  key={item.id}
                  className="group aspect-[4/3] overflow-hidden rounded-xl bg-zinc-200"
                >
                  <Image
                    src={src}
                    alt={item.name}
                    width={800}
                    height={600}
                    className="h-full w-full object-cover transition group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized
                  />
                </div>
              );
            })
          ) : localImages.length > 0 ? (
            localImages.map((item, i) => (
              <div
                key={`${item.folder}-${item.src}`}
                className="group aspect-[4/3] overflow-hidden rounded-xl bg-zinc-200"
              >
                <Image
                  src={item.src}
                  alt={`Portfolio ${i + 1}`}
                  width={800}
                  height={600}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            ))
          ) : (
            <p className="col-span-full text-zinc-500">
              No images yet. In Admin → Portfolio, upload images from your device, or add files to{" "}
              <code className="rounded bg-zinc-100 px-1 text-sm">public/portfolio/</code> or <code className="rounded bg-zinc-100 px-1 text-sm">public/portfolio/v1/</code>.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
