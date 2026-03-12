import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProjectGallery } from "@/components/project/ProjectGallery";
import { ProjectInvoice } from "@/components/project/ProjectInvoice";
import { ApproveForm } from "@/components/project/ApproveForm";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!client) redirect("/dashboard");

  const { data: project } = await supabase
    .from("projects")
    .select(`
      id,
      address,
      mls_number,
      shoot_date,
      status,
      delivery_status,
      delivered_at,
      addons,
      drive_folder_url
    `)
    .eq("id", id)
    .eq("client_id", client.id)
    .single();

  if (!project) notFound();

  const { data: assets } = await supabase
    .from("assets")
    .select("id, type, variant, storage_key, sort_order, mls_filename")
    .eq("project_id", id)
    .order("sort_order", { ascending: true });

  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, status, amount_cents, paid_at")
    .eq("project_id", id);

  const { data: review } = await supabase
    .from("reviews_approvals")
    .select("id, approved, requested_changes, reviewed_at")
    .eq("project_id", id)
    .order("reviewed_at", { ascending: false })
    .limit(1)
    .single();

  const paid = invoices?.some((i) => i.status === "paid" || i.paid_at);

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
          ← Back to projects
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-zinc-900">{project.address}</h1>
        <p className="text-sm text-zinc-500">
          {project.mls_number && `MLS# ${project.mls_number} · `}
          {project.shoot_date && new Date(project.shoot_date).toLocaleDateString()}
          {project.delivered_at && ` · Delivered ${new Date(project.delivered_at).toLocaleDateString()}`}
        </p>

        <section className="mt-8">
          <h2 className="text-lg font-medium text-zinc-900">Gallery</h2>
          {project.drive_folder_url && (
            <a
              href={project.drive_folder_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mb-4 inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/90 px-5 py-2.5 text-sm font-medium text-stone-800 hover:bg-amber-100/90"
            >
              Download from Google Drive
            </a>
          )}
          <ProjectGallery
            projectId={id}
            assets={assets || []}
            canDownload={!!paid}
          />
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-medium text-zinc-900">Invoice & payment</h2>
          <ProjectInvoice invoices={invoices || []} projectId={id} />
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-medium text-zinc-900">Approve / request changes</h2>
          <ApproveForm projectId={id} existingReview={review ?? undefined} />
        </section>
      </div>
    </main>
  );
}
