"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Diagnostic = {
  loggedIn: boolean;
  userEmail: string | null;
  emailClaimConfigured: boolean;
  secretClaimConfigured: boolean;
  supabaseConfigured: boolean;
};

export function ClaimAdminForm() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [diag, setDiag] = useState<Diagnostic | null>(null);

  useEffect(() => {
    fetch("/api/claim-admin")
      .then((r) => r.json())
      .then((d) => setDiag(d))
      .catch(() => setDiag(null));
  }, []);

  const claim = async (body: { secret?: string }) => {
    setMessage(null);
    setLoading(true);
    try {
      const res = await fetch("/api/claim-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "err", text: (data.error as string) || `Error ${res.status}` });
        setLoading(false);
        return;
      }
      setMessage({ type: "ok", text: data.message ?? "Done. Redirecting…" });
      setSecret("");
      router.refresh();
      window.location.href = "/admin";
    } catch {
      setMessage({ type: "err", text: "Request failed. Are you logged in? Is the dev server running?" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    claim({ secret: secret.trim() });
  };

  const handleClaimByEmail = () => claim({});

  return (
    <div className="mt-4 space-y-4">
      {diag && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-900">
          <p><strong>Logged in as:</strong> {diag.userEmail ?? "—"}</p>
          <p><strong>Email claim:</strong> {diag.emailClaimConfigured ? "Configured" : "Not set (add BROSTUDIO_FIRST_ADMIN_EMAIL to .env.local)"}</p>
          <p><strong>Secret claim:</strong> {diag.secretClaimConfigured ? "Configured" : "Not set (add ADMIN_CLAIM_SECRET to .env.local)"}</p>
          <p><strong>Supabase:</strong> {diag.supabaseConfigured ? "OK" : "Missing URL or service role key"}</p>
          {diag.loggedIn && diag.userEmail && !diag.emailClaimConfigured && (
            <>
              <p className="mt-2 font-medium">To use email claim, add this line to .env.local then restart the dev server:</p>
              <code className="mt-1 block break-all rounded bg-amber-100 px-2 py-1 text-xs">
                BROSTUDIO_FIRST_ADMIN_EMAIL={diag.userEmail}
              </code>
            </>
          )}
        </div>
      )}
      <div>
        <p className="text-sm font-medium text-amber-900">Claim by email (easiest)</p>
        <p className="mt-1 text-sm text-amber-800">
          Add to .env.local: <code className="rounded bg-amber-100 px-1">BROSTUDIO_FIRST_ADMIN_EMAIL=your@email.com</code> (the exact email you use to log in), restart the dev server, then click below.
        </p>
        <button
          type="button"
          onClick={handleClaimByEmail}
          disabled={loading}
              className="mt-2 rounded-xl bg-amber-50 border border-amber-200/90 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-amber-100/90 disabled:opacity-50"
        >
          {loading ? "…" : "Make me admin (use my email)"}
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <label className="block text-sm font-medium text-amber-900">
          Or use admin claim secret (ADMIN_CLAIM_SECRET in .env.local):
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Paste exact value from .env.local (e.g. brosstudio-claim-admin)"
            className="flex-1 rounded border border-amber-300 bg-white px-3 py-2 text-sm text-zinc-900"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-amber-50 border border-amber-200/90 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-amber-100/90 disabled:opacity-50"
          >
            {loading ? "…" : "Claim admin"}
          </button>
        </div>
      </form>
      {message && (
        <p className={`text-sm ${message.type === "ok" ? "text-green-700" : "text-red-700"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
