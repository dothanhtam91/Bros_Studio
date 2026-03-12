import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewAlbumForm from "./NewAlbumForm";

export default async function AdminNewAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: realtorId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/dashboard");

  return <NewAlbumForm realtorId={realtorId} />;
}
