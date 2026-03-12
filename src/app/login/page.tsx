"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error") === "missing_code" || searchParams.get("error") === "config"
      ? "Sign-in could not be completed. Please try again."
      : searchParams.get("error")
        ? decodeURIComponent(searchParams.get("error")!)
        : null
  );
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    setError(null);
    setOauthLoading(provider);
    const supabase = createClient();
    const base = typeof window !== "undefined" ? window.location.origin : appUrl;
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${base}/auth/callback`,
      },
    });
    setOauthLoading(null);
    if (err) {
      setError(err.message);
      return;
    }
    // Browser will redirect to provider
  };

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-sm px-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Sign in</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Use Google for clients and realtors. You’ll go to your projects or your portfolio.
        </p>

        {/* OAuth */}
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            disabled={!!oauthLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-amber-200/80 bg-white px-4 py-3 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-amber-50/80 disabled:opacity-50"
          >
            <GoogleIcon />
            {oauthLoading === "google" ? "Redirecting…" : "Continue with Google"}
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("facebook")}
            disabled={!!oauthLoading}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-amber-200/80 bg-white px-4 py-3 text-sm font-medium text-stone-800 shadow-sm transition hover:bg-amber-50/80 disabled:opacity-50"
          >
            <FacebookIcon />
            {oauthLoading === "facebook" ? "Redirecting…" : "Continue with Facebook"}
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-stone-500">
          Realtor but no portfolio yet?{" "}
          <Link href="/signup?realtor=1" className="font-medium text-stone-700 hover:underline">
            Create account with email
          </Link>
        </p>

        <div className="mt-6 flex items-center gap-4">
          <span className="h-px flex-1 bg-zinc-200" />
          <span className="text-xs text-zinc-500">or</span>
          <span className="h-px flex-1 bg-zinc-200" />
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-50 border border-amber-200/90 py-3 text-sm font-medium text-stone-800 hover:bg-amber-100/90 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in with email"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-medium text-zinc-900 hover:underline">
            Create one
          </Link>
        </p>
        <p className="mt-4 text-center text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900">
            Back to home
          </Link>
        </p>
        <p className="mt-6 text-center text-xs text-zinc-400">
          For Google/Facebook to work, add this in Supabase → Authentication → URL Configuration → Redirect URLs:{" "}
          <span className="break-all font-mono">{`${appUrl}/auth/callback`}</span>
          {" "}If you use a different URL (e.g. http://127.0.0.1:3001), add that origin + /auth/callback too. If you’re sent to the homepage after signing in with Google, the callback URL is missing or doesn’t match—add the exact URL you see in the address bar when you click Continue with Google, then add /auth/callback (e.g. http://127.0.0.1:3001/auth/callback).
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginContent />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-sm px-4">
        <h1 className="text-2xl font-semibold text-zinc-900">Sign in</h1>
        <p className="mt-4 text-sm text-zinc-500">Loading…</p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}
