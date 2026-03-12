import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminPortfolioUpload } from "@/components/admin/AdminPortfolioUpload";

export default async function AdminPortfolioPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <Link href="/admin" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← Admin
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900">Portfolio images</h1>
        <p className="mt-1 text-zinc-600">
          Upload images from your device. They appear on the public Portfolio page.
        </p>
        <section className="mt-6">
          <AdminPortfolioUpload />
        </section>
      </div>
    </main>
  );
}
