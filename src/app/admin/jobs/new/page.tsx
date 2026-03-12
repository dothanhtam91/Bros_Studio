import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NewJobForm } from "@/components/admin/NewJobForm";

export default async function AdminNewJobPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const { data: realtors } = await supabase
    .from("realtors")
    .select("id, name, email")
    .order("name");

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <Link href="/admin" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← Jobs
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900">New job</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Select a realtor; an album will be created or linked automatically.
        </p>
        <NewJobForm realtors={realtors || []} />
      </div>
    </main>
  );
}
