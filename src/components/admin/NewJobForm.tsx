"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { JOB_STATUSES } from "@/lib/jobs";
import {
  PACKAGE_TIERS,
  getPackageBySqft,
  computePricingBreakdown,
} from "@/lib/pricing";

type Realtor = { id: string; name: string; email: string | null };

export function NewJobForm({ realtors }: { realtors: Realtor[] }) {
  const router = useRouter();
  const addressWrapperRef = useRef<HTMLDivElement>(null);
  const [realtorId, setRealtorId] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [addressSuggestions, setAddressSuggestions] = useState<string[]>([]);
  const [addressSuggestionsLoading, setAddressSuggestionsLoading] = useState(false);
  const [listingTitle, setListingTitle] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [sqFt, setSqFt] = useState("");
  const [packageId, setPackageId] = useState("2");
  const [isAirbnb, setIsAirbnb] = useState(false);
  const [additionalRequestFee, setAdditionalRequestFee] = useState("");
  const [shootingDate, setShootingDate] = useState("");
  const [deliveryDeadline, setDeliveryDeadline] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [useCalculatedTotal, setUseCalculatedTotal] = useState(true);
  const [travelFee, setTravelFee] = useState(0);
  const [travelFeeLoading, setTravelFeeLoading] = useState(false);
  const [priority, setPriority] = useState("normal");
  const [status, setStatus] = useState("new_booking");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTravelFee = useCallback(async () => {
    if (!propertyAddress.trim() || propertyAddress.length < 10) {
      setTravelFee(0);
      return;
    }
    setTravelFeeLoading(true);
    try {
      const res = await fetch("/api/travel-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: propertyAddress.trim() }),
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
  }, [propertyAddress]);

  useEffect(() => {
    const t = setTimeout(fetchTravelFee, 500);
    return () => clearTimeout(t);
  }, [propertyAddress, fetchTravelFee]);

  useEffect(() => {
    const n = parseInt(sqFt, 10);
    if (!isNaN(n) && n > 0) {
      const match = getPackageBySqft(n);
      if (match) setPackageId(match.id);
    }
  }, [sqFt]);

  useEffect(() => {
    const query = propertyAddress.trim();
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
  }, [propertyAddress]);

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

  const handleSelectAddressSuggestion = (suggestion: string) => {
    setPropertyAddress(suggestion);
    setAddressSuggestions([]);
  };

  const additionalNum = Math.max(0, parseFloat(additionalRequestFee) || 0);
  const breakdown = computePricingBreakdown({
    packageId,
    isAirbnb,
    travelFee,
    additionalRequestFee: additionalNum,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!realtorId?.trim() || !propertyAddress?.trim()) {
      setError("Realtor and property address are required.");
      return;
    }
    setError(null);
    setSending(true);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          realtor_id: realtorId,
          property_address: propertyAddress.trim(),
          listing_title: listingTitle.trim() || null,
          service_type: serviceType.trim() || null,
          sq_ft: sqFt ? parseInt(sqFt, 10) : null,
          package_id: packageId,
          is_airbnb: isAirbnb,
          additional_request_fee: additionalNum,
          shooting_date: shootingDate || null,
          delivery_deadline: deliveryDeadline || null,
          total_price: useCalculatedTotal ? breakdown.total : parseFloat(totalPrice) || null,
          priority: priority || "normal",
          status: status || "new_booking",
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to create job");
        return;
      }
      router.push(`/admin/jobs/${data.id}`);
      router.refresh();
    } catch {
      setError("Request failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="realtor_id" className="block text-sm font-medium text-zinc-700">
          Realtor *
        </label>
        <select
          id="realtor_id"
          required
          value={realtorId}
          onChange={(e) => setRealtorId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
        >
          <option value="">Select realtor</option>
          {realtors.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} {r.email ? `(${r.email})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div ref={addressWrapperRef} className="relative">
        <label htmlFor="property_address" className="block text-sm font-medium text-zinc-700">
          Property address *
        </label>
        <input
          id="property_address"
          type="text"
          required
          value={propertyAddress}
          onChange={(e) => setPropertyAddress(e.target.value)}
          placeholder="Start typing address — we'll suggest matches"
          autoComplete="off"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
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
                className="cursor-pointer px-3 py-2 text-sm text-zinc-700 hover:bg-amber-50 focus:bg-amber-50 focus:outline-none"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectAddressSuggestion(suggestion);
                }}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        )}
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
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="sq_ft" className="block text-sm font-medium text-zinc-700">
            Sq ft (optional)
          </label>
          <input
            id="sq_ft"
            type="number"
            min={0}
            value={sqFt}
            onChange={(e) => setSqFt(e.target.value)}
            placeholder="Auto-selects package"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="package_id" className="block text-sm font-medium text-zinc-700">
            Package
          </label>
          <select
            id="package_id"
            value={packageId}
            onChange={(e) => setPackageId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          >
            {PACKAGE_TIERS.map((t) => (
              <option key={t.id} value={t.id}>
                Package {t.id} – ${(t.priceCents / 100).toLocaleString()}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3">
          <label htmlFor="is_airbnb" className="text-sm font-medium text-zinc-700">
            AirBnB (+20%)
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
        <div>
          <label htmlFor="additional_fee" className="block text-sm font-medium text-zinc-700">
            Additional request fee
          </label>
          <input
            id="additional_fee"
            type="number"
            min={0}
            step={0.01}
            value={additionalRequestFee}
            onChange={(e) => setAdditionalRequestFee(e.target.value)}
            placeholder="0"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4">
        <p className="text-sm font-medium text-zinc-700">Pricing summary</p>
        <dl className="mt-2 space-y-1 text-sm text-zinc-600">
          <div className="flex justify-between">
            <dt>Base package</dt>
            <dd>${breakdown.basePackage.toFixed(2)}</dd>
          </div>
          {breakdown.airbnbSurcharge > 0 && (
            <div className="flex justify-between">
              <dt>AirBnB surcharge</dt>
              <dd>${breakdown.airbnbSurcharge.toFixed(2)}</dd>
            </div>
          )}
          {breakdown.travelFee > 0 && (
            <div className="flex justify-between">
              <dt>Travel fee</dt>
              <dd>${breakdown.travelFee.toFixed(2)}{travelFeeLoading && " (calculating…)"}</dd>
            </div>
          )}
          {breakdown.additionalRequestFee > 0 && (
            <div className="flex justify-between">
              <dt>Additional fee</dt>
              <dd>${breakdown.additionalRequestFee.toFixed(2)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-zinc-200 pt-2 font-semibold text-zinc-900">
            <dt>Total</dt>
            <dd>${breakdown.total.toFixed(2)}</dd>
          </div>
        </dl>
        <label className="mt-3 flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={useCalculatedTotal}
            onChange={(e) => setUseCalculatedTotal(e.target.checked)}
            className="rounded border-zinc-300"
          />
          <span className="text-sm text-zinc-600">Use calculated total</span>
        </label>
        {!useCalculatedTotal && (
          <div className="mt-2">
            <label htmlFor="total_price_manual" className="block text-sm font-medium text-zinc-700">
              Manual total
            </label>
            <input
              id="total_price_manual"
              type="number"
              step="0.01"
              min="0"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              className="mt-1 w-full max-w-[8rem] rounded-lg border border-zinc-300 px-3 py-2"
            />
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="service_type" className="block text-sm font-medium text-zinc-700">
            Service type
          </label>
          <input
            id="service_type"
            type="text"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            placeholder="e.g. Photography"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </div>
        <div />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="shooting_date" className="block text-sm font-medium text-zinc-700">
            Shooting date
          </label>
          <input
            id="shooting_date"
            type="date"
            value={shootingDate}
            onChange={(e) => setShootingDate(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="delivery_deadline" className="block text-sm font-medium text-zinc-700">
            Delivery deadline
          </label>
          <input
            id="delivery_deadline"
            type="date"
            value={deliveryDeadline}
            onChange={(e) => setDeliveryDeadline(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-zinc-700">
            Priority
          </label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-zinc-700">
            Initial status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          >
            {JOB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
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
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-xl border border-amber-200/90 bg-amber-50 py-3 text-sm font-medium text-stone-800 transition hover:bg-amber-100/90 disabled:opacity-50"
      >
        {sending ? "Creating…" : "Create job"}
      </button>
    </form>
  );
}
