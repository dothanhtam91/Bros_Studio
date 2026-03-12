"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface RealtorOnboardingFormProps {
  suggestedName: string;
}

export function RealtorOnboardingForm({ suggestedName }: RealtorOnboardingFormProps) {
  const router = useRouter();
  const [name, setName] = useState(suggestedName);
  const [phone, setPhone] = useState("");
  const [brokerage, setBrokerage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/onboarding/realtor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          brokerage: brokerage.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        setLoading(false);
        return;
      }
      router.replace(`/r/${data.slug}`);
      router.refresh();
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-stone-700">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-stone-700">
          Phone <span className="text-stone-400">(optional)</span>
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="(555) 000-0000"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
      </div>
      <div>
        <label htmlFor="brokerage" className="block text-sm font-medium text-stone-700">
          Brokerage <span className="text-stone-400">(optional)</span>
        </label>
        <input
          id="brokerage"
          type="text"
          value={brokerage}
          onChange={(e) => setBrokerage(e.target.value)}
          placeholder="Brokerage name"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl border border-amber-200/90 bg-amber-50 py-3 text-sm font-medium text-stone-800 transition hover:bg-amber-100/90 disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create my portfolio"}
      </button>
    </form>
  );
}
