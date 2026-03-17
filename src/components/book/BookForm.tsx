"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  PACKAGE_TIERS,
  getPackageBySqft,
  getPackageById,
  computePricingBreakdown,
} from "@/lib/pricing";

export function BookForm() {
  const searchParams = useSearchParams();
  const preselectedPackage = searchParams.get("package") ?? "2";
  const addressWrapperRef = useRef<HTMLDivElement>(null);

  const [address, setAddress] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [addressSuggestionsLoading, setAddressSuggestionsLoading] = useState(false);
  const [sqFt, setSqFt] = useState("");
  const [propertyType, setPropertyType] = useState("residential");
  const [timeWindows, setTimeWindows] = useState("");
  const [packageId, setPackageId] = useState(preselectedPackage);
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [realtorName, setRealtorName] = useState("");
  const [listingTitle, setListingTitle] = useState("");
  const [preferredShootingDate, setPreferredShootingDate] = useState("");
  const [notes, setNotes] = useState("");
  const [isAirbnb, setIsAirbnb] = useState(false);
  const [additionalRequestFee, setAdditionalRequestFee] = useState("");
  const [travelFee, setTravelFee] = useState<number>(0);
  const [travelFeeLoading, setTravelFeeLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const pkg = getPackageById(packageId);
  const additionalNum = Math.max(0, parseFloat(additionalRequestFee) || 0);

  const breakdown = computePricingBreakdown({
    packageId,
    isAirbnb,
    travelFee,
    additionalRequestFee: additionalNum,
  });

  const fetchTravelFee = useCallback(async () => {
    if (!address.trim() || address.length < 10) {
      setTravelFee(0);
      return;
    }
    setTravelFeeLoading(true);
    try {
      const res = await fetch("/api/travel-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: address.trim() }),
      });
      const data = await res.json();
      if (res.ok && typeof data.travelFee === "number") {
        setTravelFee(data.travelFee);
      } else {
        setTravelFee(0);
      }
    } catch {
      setTravelFee(0);
    } finally {
      setTravelFeeLoading(false);
    }
  }, [address]);

  useEffect(() => {
    const t = setTimeout(fetchTravelFee, 600);
    return () => clearTimeout(t);
  }, [address, fetchTravelFee]);

  useEffect(() => {
    const n = parseInt(sqFt, 10);
    if (!isNaN(n) && n > 0) {
      const match = getPackageBySqft(n);
      if (match) setPackageId(match.id);
    }
  }, [sqFt]);

  useEffect(() => {
    const query = address.trim();
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      setAddressSuggestionsLoading(true);
      try {
        const res = await fetch(
          `/api/address-suggestions?q=${encodeURIComponent(query)}`
        );
        const data = await res.json();
        const list = Array.isArray(data.suggestions)
          ? data.suggestions.map((s: { address?: string }) => s?.address).filter(Boolean)
          : [];
        setAddressSuggestions(list);
      } catch {
        setAddressSuggestions([]);
      } finally {
        setAddressSuggestionsLoading(false);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [address]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        addressWrapperRef.current &&
        !addressWrapperRef.current.contains(e.target as Node)
      ) {
        setAddressSuggestions([]);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (suggestion: string) => {
    setAddress(suggestion);
    setAddressSuggestions([]);
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
          sq_ft: sqFt ? parseInt(sqFt, 10) : null,
          package_id: packageId,
          is_airbnb: isAirbnb,
          additional_request_fee: additionalNum,
          travel_fee: travelFee,
          preferred_shooting_date: preferredShootingDate || null,
          time_windows: timeWindows || null,
          notes: notes || null,
          estimated_price: breakdown.total,
          pricing_breakdown: {
            base_package: breakdown.basePackage,
            airbnb_surcharge: breakdown.airbnbSurcharge,
            travel_fee: breakdown.travelFee,
            additional_request_fee: breakdown.additionalRequestFee,
            total: breakdown.total,
          },
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
          We&apos;ll confirm your shoot and send a quote shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div ref={addressWrapperRef} className="relative">
        <label htmlFor="address" className="block text-sm font-medium text-zinc-700">
          Property address *
        </label>
        <input
          id="address"
          type="text"
          required
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Start typing address — we'll suggest matches"
          autoComplete="off"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 transition focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
        {addressSuggestionsLoading && (
          <p className="mt-1 text-xs text-zinc-500">Finding addresses…</p>
        )}
        {addressSuggestions.length > 0 && !addressSuggestionsLoading && (
          <ul
            className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
            role="listbox"
          >
            {addressSuggestions.map((suggestion) => (
              <li
                key={suggestion}
                role="option"
                tabIndex={0}
                className="cursor-pointer px-3 py-2.5 text-sm text-zinc-700 hover:bg-amber-50 focus:bg-amber-50 focus:outline-none"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectSuggestion(suggestion);
                }}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sq_ft" className="block text-sm font-medium text-zinc-700">
            Square feet
          </label>
          <input
            id="sq_ft"
            type="number"
            min={0}
            placeholder="e.g. 1800"
            value={sqFt}
            onChange={(e) => setSqFt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 transition focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Helps auto-select the right package
          </p>
        </div>
        <div>
          <label htmlFor="property_type" className="block text-sm font-medium text-zinc-700">
            Property type
          </label>
          <select
            id="property_type"
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 transition focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
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
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 transition focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Package</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PACKAGE_TIERS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setPackageId(t.id)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                packageId === t.id
                  ? "border border-amber-200/90 bg-amber-50 text-stone-800"
                  : "border border-amber-200/80 bg-white text-stone-700 hover:bg-amber-50/80"
              }`}
            >
              Package {t.id} – ${(t.priceCents / 100).toLocaleString()}
            </button>
          ))}
        </div>
        {pkg && (
          <p className="mt-2 text-xs text-zinc-500">
            {pkg.sqftMax != null
              ? `${pkg.sqftMin.toLocaleString()}–${pkg.sqftMax.toLocaleString()} sqft · ${pkg.photoRange}`
              : `${pkg.sqftMin.toLocaleString()}+ sqft · ${pkg.photoRange}`}
          </p>
        )}
      </div>

      <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <label
            htmlFor="airbnb"
            className="cursor-pointer text-sm font-medium text-zinc-700"
          >
            AirBnB request
          </label>
          <button
            type="button"
            role="switch"
            aria-checked={isAirbnb}
            onClick={() => setIsAirbnb((x) => !x)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              isAirbnb ? "bg-amber-400" : "bg-zinc-300"
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
                isAirbnb ? "left-6" : "left-1"
              }`}
            />
          </button>
        </div>
        <p className="text-xs text-zinc-500">
          Add 20% to package price for AirBnB listings
        </p>
      </div>

      <div>
        <label
          htmlFor="additional_fee"
          className="block text-sm font-medium text-zinc-700"
        >
          Additional request fee (optional)
        </label>
        <input
          id="additional_fee"
          type="number"
          min={0}
          step={0.01}
          value={additionalRequestFee}
          onChange={(e) => setAdditionalRequestFee(e.target.value)}
          placeholder="0"
          className="mt-1 w-full max-w-[12rem] rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 transition focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-zinc-700">Pricing summary</p>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between text-zinc-600">
            <dt>Base package</dt>
            <dd>${breakdown.basePackage.toFixed(2)}</dd>
          </div>
          {breakdown.airbnbSurcharge > 0 && (
            <div className="flex justify-between text-zinc-600">
              <dt>AirBnB surcharge (20%)</dt>
              <dd>${breakdown.airbnbSurcharge.toFixed(2)}</dd>
            </div>
          )}
          {breakdown.travelFee > 0 && (
            <div className="flex justify-between text-zinc-600">
              <dt>Travel fee</dt>
              <dd>
                ${breakdown.travelFee.toFixed(2)}
                {travelFeeLoading && (
                  <span className="ml-1 text-zinc-400">(calculating…)</span>
                )}
              </dd>
            </div>
          )}
          {breakdown.additionalRequestFee > 0 && (
            <div className="flex justify-between text-zinc-600">
              <dt>Additional request fee</dt>
              <dd>${breakdown.additionalRequestFee.toFixed(2)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-zinc-200 pt-3 font-semibold text-zinc-900">
            <dt>Total</dt>
            <dd>${breakdown.total.toFixed(2)}</dd>
          </div>
        </dl>
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
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 transition focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
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
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 transition focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
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
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 transition focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
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
            placeholder="Optional"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 transition focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
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
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 transition focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
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
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 transition focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
        <div>
          <label
            htmlFor="preferred_shooting_date"
            className="block text-sm font-medium text-zinc-700"
          >
            Preferred shooting date
          </label>
          <input
            id="preferred_shooting_date"
            type="date"
            value={preferredShootingDate}
            onChange={(e) => setPreferredShootingDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 transition focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
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
            placeholder="Any special requests or instructions"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-zinc-900 transition focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          />
        </div>
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="w-full rounded-xl border border-amber-200/90 bg-amber-50 py-3 text-sm font-medium text-stone-800 transition hover:bg-amber-100/90 disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Submit request"}
      </button>
    </form>
  );
}
