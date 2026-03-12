import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { DeliveryLinksList } from "@/components/delivery/DeliveryLinksList";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default async function DeliveryPreviewIndexPage() {
  const supabase = await createClient();
  const { data: realtors } = await supabase
    .from("realtors")
    .select("id, slug, name, brokerage")
    .order("name");

  const withAlbums = await Promise.all(
    (realtors || []).map(async (r) => {
      const { data: albums } = await supabase
        .from("albums")
        .select("id, slug, address")
        .eq("realtor_id", r.id)
        .order("shoot_date", { ascending: false });
      return { ...r, albums: albums ?? [] };
    })
  );

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-xl font-semibold text-stone-900">Temporary delivery links</h1>
      <p className="mt-1 text-sm text-stone-600">
        Copy a link below to send to your customer. These open the delivery experience without the main site nav.
      </p>
      {!withAlbums.length ? (
        <p className="mt-8 text-stone-500">No realtors yet. Add one in Admin → Realtors.</p>
      ) : (
        <DeliveryLinksList baseUrl={baseUrl} realtors={withAlbums} />
      )}
      <p className="mt-8 text-xs text-stone-400">
        <Link href="/admin" className="hover:text-stone-600">← Admin</Link>
        {" · "}
        Regular links (with site nav): <code className="rounded bg-stone-100 px-1">/r/[realtorSlug]</code>
      </p>
    </main>
  );
}
