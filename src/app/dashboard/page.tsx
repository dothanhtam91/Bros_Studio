import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { findRealtorByUserOrEmail } from "@/lib/realtor-google-auth";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const realtor = user.email
    ? await findRealtorByUserOrEmail(user.id, user.email)
    : null;
  if (realtor) redirect(`/r/${realtor.slug}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role === "admin") redirect("/admin");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!client) {
    return (
      <main className="min-h-screen pt-24 pb-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
          <p className="mt-4 text-zinc-600">
            No client profile linked to your account. Contact us to get access to your projects.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard/portfolio" className="text-sm font-medium text-zinc-900 hover:underline">
              My portfolio
            </Link>
            <Link href="/contact" className="text-sm font-medium text-stone-700 hover:text-amber-800 transition">
              Contact us
            </Link>
            <form action="/api/auth/signout" method="post" className="inline">
              <button type="submit" className="text-sm font-medium text-stone-600 hover:text-amber-800 transition">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  const { data: projects } = await supabase
    .from("projects")
    .select("id, address, status, shoot_date, delivered_at, created_at")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900">Your projects</h1>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard/portfolio"
              className="text-sm font-medium text-stone-600 hover:text-amber-800 transition"
            >
              My portfolio
            </Link>
            <form action="/api/auth/signout" method="post">
              <button type="submit" className="text-sm font-medium text-stone-600 hover:text-amber-800 transition">
                Sign out
              </button>
            </form>
          </div>
        </div>
        {!projects?.length ? (
          <p className="mt-8 text-zinc-600">No projects yet. We’ll add you when a shoot is delivered.</p>
        ) : (
          <ul className="mt-8 space-y-4">
            {projects.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/project/${p.id}`}
                  className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm"
                >
                  <p className="font-medium text-zinc-900">{p.address}</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {p.status} · {p.shoot_date ? new Date(p.shoot_date).toLocaleDateString() : "—"}
                    {p.delivered_at && ` · Delivered ${new Date(p.delivered_at).toLocaleDateString()}`}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
