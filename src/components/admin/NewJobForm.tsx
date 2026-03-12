"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { JOB_STATUSES } from "@/lib/jobs";

type Realtor = { id: string; name: string; email: string | null };

export function NewJobForm({ realtors }: { realtors: Realtor[] }) {
  const router = useRouter();
  const [realtorId, setRealtorId] = useState("");
  const [propertyAddress, setPropertyAddress] = useState("");
  const [listingTitle, setListingTitle] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [shootingDate, setShootingDate] = useState("");
  const [deliveryDeadline, setDeliveryDeadline] = useState("");
  const [totalPrice, setTotalPrice] = useState("");
  const [priority, setPriority] = useState("normal");
  const [status, setStatus] = useState("new_booking");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          shooting_date: shootingDate || null,
          delivery_deadline: deliveryDeadline || null,
          total_price: totalPrice ? parseFloat(totalPrice) : null,
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

      <div>
        <label htmlFor="property_address" className="block text-sm font-medium text-zinc-700">
          Property address *
        </label>
        <input
          id="property_address"
          type="text"
          required
          value={propertyAddress}
          onChange={(e) => setPropertyAddress(e.target.value)}
          placeholder="123 Main St, City, ST 12345"
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
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
          className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
        />
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
            placeholder="e.g. Photography, Video"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="total_price" className="block text-sm font-medium text-zinc-700">
            Total price
          </label>
          <input
            id="total_price"
            type="number"
            step="0.01"
            min="0"
            value={totalPrice}
            onChange={(e) => setTotalPrice(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
          />
        </div>
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
        className="w-full rounded-xl bg-amber-50 border border-amber-200/90 py-3 text-sm font-medium text-stone-800 hover:bg-amber-100/90 disabled:opacity-50"
      >
        {sending ? "Creating…" : "Create job"}
      </button>
    </form>
  );
}
