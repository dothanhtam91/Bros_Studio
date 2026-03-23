"use client";

import { useRef, useState } from "react";
import { VIDEOGRAPHY_SERVICE_OPTIONS } from "@/lib/videographyPackages";

export function VideographySection() {
  const formRef = useRef<HTMLDivElement>(null);
  const [serviceId, setServiceId] = useState<string>(VIDEOGRAPHY_SERVICE_OPTIONS[0]!.id);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const scrollToForm = (id?: string) => {
    if (id) setServiceId(id);
    setError(null);
    setSuccess(false);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSubmitting(true);
    try {
      const res = await fetch("/api/videography-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || undefined,
          serviceId,
          message: message || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data.error as string) || "Could not send your request. Try again or email us directly.");
        return;
      }
      setSuccess(true);
      setMessage("");
    } catch {
      setError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mt-16 border-t border-zinc-200/90 pt-16" aria-labelledby="videography-heading">
      <div className="rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50/90 to-stone-50/80 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-800/90">Custom pricing</p>
        <h2 id="videography-heading" className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Videography
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-zinc-700 sm:text-base">
          Videography packages are <strong className="font-semibold text-zinc-900">quoted individually</strong> based on
          property, runtime, deliverables, and licensing. We don&apos;t list fixed video rates here —{" "}
          <span className="font-medium text-zinc-900">contact us for pricing</span> or use the form below and an admin
          will follow up with a tailored quote.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {VIDEOGRAPHY_SERVICE_OPTIONS.map((opt) => (
          <div
            key={opt.id}
            className="flex flex-col rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm transition hover:border-amber-200/80 hover:shadow-md"
          >
            <h3 className="text-base font-semibold text-zinc-900">{opt.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-zinc-600">{opt.description}</p>
            {opt.bullets && opt.bullets.length > 0 && (
              <ul className="mt-3 space-y-1 text-xs text-zinc-500">
                {opt.bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="text-amber-600" aria-hidden>
                      ·
                    </span>
                    {b}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-4 text-sm font-medium text-amber-900/90">Contact admin for a quote</p>
            <button
              type="button"
              onClick={() => scrollToForm(opt.id)}
              className="mt-3 w-full rounded-xl border border-amber-200/90 bg-amber-50 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-amber-100/90"
            >
              Request a quote
            </button>
          </div>
        ))}
      </div>

      <div ref={formRef} className="mt-12 scroll-mt-28">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <h3 className="text-lg font-semibold text-zinc-900">Videography inquiry</h3>
          <p className="mt-1 text-sm text-zinc-600">
            Tell us which service you&apos;re interested in. We&apos;ll email the studio admin with your details — no
            payment is taken on this page.
          </p>

          {success ? (
            <div
              className="mt-6 rounded-xl border border-emerald-200/80 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900"
              role="status"
            >
              Thanks — your request was sent. We&apos;ll get back to you shortly at <strong>{email}</strong>.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="vg-service" className="block text-sm font-medium text-zinc-700">
                  Service
                </label>
                <select
                  id="vg-service"
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                >
                  {VIDEOGRAPHY_SERVICE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="vg-name" className="block text-sm font-medium text-zinc-700">
                    Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="vg-name"
                    type="text"
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                  />
                </div>
                <div>
                  <label htmlFor="vg-email" className="block text-sm font-medium text-zinc-700">
                    Email <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="vg-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="vg-phone" className="block text-sm font-medium text-zinc-700">
                  Phone <span className="text-zinc-400">(optional)</span>
                </label>
                <input
                  id="vg-phone"
                  type="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full max-w-md rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                />
              </div>
              <div>
                <label htmlFor="vg-message" className="block text-sm font-medium text-zinc-700">
                  Property / timeline / notes <span className="text-zinc-400">(optional)</span>
                </label>
                <textarea
                  id="vg-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Address, desired delivery date, platforms, etc."
                  className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm focus:border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-300"
                />
              </div>
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-50 sm:w-auto"
              >
                {submitting ? "Sending…" : "Submit inquiry to admin"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
