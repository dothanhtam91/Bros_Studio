"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PACKAGES, ADDONS, computeQuote } from "@/lib/pricing";

export function BookForm() {
  const searchParams = useSearchParams();
  const preselectedPackage = searchParams.get("package") ?? "standard";

  const [address, setAddress] = useState("");
  const [sqFt, setSqFt] = useState("");
  const [propertyType, setPropertyType] = useState("residential");
  const [timeWindows, setTimeWindows] = useState("");
  const [addonIds, setAddonIds] = useState<string[]>([]);
  const [packageId, setPackageId] = useState(preselectedPackage);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [realtorName, setRealtorName] = useState("");
  const [listingTitle, setListingTitle] = useState("");
  const [preferredShootingDate, setPreferredShootingDate] = useState("");
  const [preferredDeliveryDeadline, setPreferredDeliveryDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const quote = computeQuote(packageId, addonIds);
  const pkg = PACKAGES.find((p) => p.id === packageId);

  const toggleAddon = (id: string) => {
    setAddonIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: contactName,
          email: contactEmail,
          phone: contactPhone || null,
          company_name: companyName || null,
          realtor_name: realtorName || null,
          property_address: address,
          listing_title: listingTitle || null,
          service_type: propertyType || null,
          preferred_shooting_date: preferredShootingDate || null,
          preferred_delivery_deadline: preferredDeliveryDeadline || null,
          notes: notes || null,
          estimated_price: quote / 100,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  if (status === "done") {
    return (
      <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="font-medium text-green-800">Request received.</p>
        <p className="mt-1 text-sm text-green-700">
          We’ll confirm your shoot and send a quote shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-zinc-700">
          Property address *
        </label>
        <input
          id="address"
          type="text"
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sq_ft" className="block text-sm font-medium text-zinc-700">
            Sq ft
          </label>
          <input
            id="sq_ft"
            type="number"
            min={0}
            value={sqFt}
            onChange={(e) => setSqFt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <div>
          <label htmlFor="property_type" className="block text-sm font-medium text-zinc-700">
            Property type
          </label>
          <select
            id="property_type"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          >
            <option value="residential">Residential</option>
            <option value="condo">Condo</option>
            <option value="townhome">Townhome</option>
            <option value="luxury">Luxury</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="time_windows" className="block text-sm font-medium text-zinc-700">
          Preferred time windows (e.g. 9am–12pm, 2–5pm)
        </label>
        <input
          id="time_windows"
          type="text"
          value={timeWindows}
          onChange={(e) => setTimeWindows(e.target.value)}
          placeholder="9am–12pm, 2–5pm"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Package</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PACKAGES.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPackageId(p.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                packageId === p.id
                  ? "bg-amber-50 border border-amber-200/90 text-stone-800"
                  : "border border-amber-200/80 bg-white text-stone-700 hover:bg-amber-50/80"
              }`}
            >
              {p.name} – ${(p.price_cents / 100).toLocaleString()}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Add-ons</label>
        <div className="mt-2 space-y-2">
          {ADDONS.map((addon) => (
            <label key={addon.id} className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={addonIds.includes(addon.id)}
                onChange={() => toggleAddon(addon.id)}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
              />
              <span className="text-sm text-zinc-700">
                {addon.name} (+${(addon.price_cents / 100).toLocaleString()})
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-zinc-50 p-4">
        <p className="text-sm font-medium text-zinc-700">Estimated total</p>
        <p className="text-2xl font-semibold text-zinc-900">
          ${(quote / 100).toLocaleString()}
          {pkg && (
            <span className="ml-2 text-sm font-normal text-zinc-500">
              ({pkg.name}
              {addonIds.length > 0 ? ` + ${addonIds.length} add-on(s)` : ""})
            </span>
          )}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="contact_name" className="block text-sm font-medium text-zinc-700">
            Your name *
          </label>
          <input
            id="contact_name"
            type="text"
            required
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <div>
          <label htmlFor="contact_email" className="block text-sm font-medium text-zinc-700">
            Email *
          </label>
          <input
            id="contact_email"
            type="email"
            required
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <div>
          <label htmlFor="contact_phone" className="block text-sm font-medium text-zinc-700">
            Phone
          </label>
          <input
            id="contact_phone"
            type="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <div>
          <label htmlFor="company_name" className="block text-sm font-medium text-zinc-700">
            Company / brokerage
          </label>
          <input
            id="company_name"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Optional — helps us match existing realtors"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <div>
          <label htmlFor="realtor_name" className="block text-sm font-medium text-zinc-700">
            Realtor name (if different)
          </label>
          <input
            id="realtor_name"
            type="text"
            value={realtorName}
            onChange={(e) => setRealtorName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <div>
          <label htmlFor="listing_title" className="block text-sm font-medium text-zinc-700">
            Listing title
          </label>
          <input
            id="listing_title"
            type="text"
            value={listingTitle}
            onChange={(e) => setListingTitle(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="preferred_shooting_date" className="block text-sm font-medium text-zinc-700">
              Preferred shooting date
            </label>
            <input
              id="preferred_shooting_date"
              type="date"
              value={preferredShootingDate}
              onChange={(e) => setPreferredShootingDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
          <div>
            <label htmlFor="preferred_delivery_deadline" className="block text-sm font-medium text-zinc-700">
              Preferred delivery deadline
            </label>
            <input
              id="preferred_delivery_deadline"
              type="date"
              value={preferredDeliveryDeadline}
              onChange={(e) => setPreferredDeliveryDeadline(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
            />
          </div>
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-zinc-700">
            Notes
          </label>
          <textarea
            id="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-xl bg-amber-50 border border-amber-200/90 py-3 text-sm font-medium text-stone-800 hover:bg-amber-100/90 disabled:opacity-50 transition"
      >
        {status === "sending" ? "Sending…" : "Submit request"}
      </button>
    </form>
  );
}
