"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isRealtor = searchParams.get("realtor") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: fullName ? { full_name: fullName } : undefined },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSuccess(true);
    router.refresh();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push(isRealtor ? "/onboarding/realtor" : "/dashboard");
      return;
    }
  };

  if (success) {
    return (
      <main className="min-h-screen pt-24 pb-20">
        <div className="mx-auto max-w-sm px-4 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900">Check your email</h1>
          <p className="mt-4 text-zinc-600">
            We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account, then sign in.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl bg-amber-50 border border-amber-200/90 px-6 py-3 text-sm font-medium text-stone-800 hover:bg-amber-100/90"
          >
            Back to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-sm px-4">
        <h1 className="text-2xl font-semibold text-zinc-900">
          {isRealtor ? "Realtor account" : "Create account"}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          {isRealtor
            ? "Sign up to get your portfolio. We’ll ask for a few details next."
            : "Sign up to access your projects and downloads."}
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-zinc-700">
              Name <span className="text-zinc-400">(optional)</span>
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
            <p className="mt-1 text-xs text-zinc-500">At least 6 characters</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-50 border border-amber-200/90 py-3 text-sm font-medium text-stone-800 hover:bg-amber-100/90 disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-zinc-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-zinc-900 hover:underline">
            Sign in
          </Link>
          {!isRealtor && (
            <>
              {" · "}
              <Link href="/signup?realtor=1" className="font-medium text-zinc-900 hover:underline">
                Realtor? Sign up for a portfolio
              </Link>
            </>
          )}
        </p>
        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <SignupContent />
    </Suspense>
  );
}

function SignupFallback() {
  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-sm px-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Create account</h1>
        <p className="mt-4 text-sm text-zinc-500">Loading…</p>
      </div>
    </main>
  );
}
