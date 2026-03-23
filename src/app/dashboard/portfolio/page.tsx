import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { UserPortfolioUpload } from "@/components/user/UserPortfolioUpload";
import { getR2Config, getR2PublicUrl, normalizePortfolioR2Key } from "@/lib/r2/client";

function getPersonalPortfolioImageUrl(storageKey: string): string {
  if (!getR2Config().configured) return "";
  try {
    return getR2PublicUrl(normalizePortfolioR2Key(storageKey));
  } catch {
    return "";
  }
}

export default async function DashboardPortfolioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: items } = await supabase
    .from("portfolio_items")
    .select("id, drive_file_id, name, sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true });

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900">My portfolio</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              ← Dashboard
            </Link>
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                Sign out
              </button>
            </form>
          </div>
        </div>

        <p className="mt-2 text-sm text-zinc-600">
          Images you upload here are only visible to you when you’re signed in. Files are stored in Cloudflare R2.
        </p>

        <section className="mt-8">
          <UserPortfolioUpload />
        </section>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items?.length ? (
            items.map((item) => {
              const src = getPersonalPortfolioImageUrl(item.drive_file_id);
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
          ) : (
            <p className="col-span-full text-zinc-500">
              No images yet. Upload some above to build your personal portfolio.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
