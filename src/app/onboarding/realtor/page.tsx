import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findRealtorByUserOrEmail } from "@/lib/realtor-google-auth";
import { RealtorOnboardingForm } from "@/components/onboarding/RealtorOnboardingForm";

export default async function RealtorOnboardingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const realtor = user.email
    ? await findRealtorByUserOrEmail(user.id, user.email)
    : null;
  if (realtor) redirect(`/r/${realtor.slug}`);

  const suggestedName =
    (user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email?.split("@")[0] ?? "").trim() || "";

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-md px-4">
        <h1 className="text-2xl font-semibold text-stone-900">Realtor profile</h1>
        <p className="mt-1 text-sm text-stone-600">
          Add a few details so we can set up your portfolio. You’ll use this account to sign in next time.
        </p>
        <p className="mt-2 text-xs text-stone-500">
          Account: {user.email}
        </p>
        <RealtorOnboardingForm suggestedName={suggestedName} />
      </div>
    </main>
  );
}
