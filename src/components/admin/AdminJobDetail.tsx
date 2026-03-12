"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JOB_STATUSES, REVISION_REQUEST_TYPES } from "@/lib/jobs";

type Job = {
  id: string;
  source: string;
  realtor_id: string | null;
  customer_id: string | null;
  album_id: string | null;
  property_address: string;
  listing_title: string | null;
  service_type: string | null;
  shooting_date: string | null;
  delivery_deadline: string | null;
  delivered_at: string | null;
  total_price: number | null;
  priority: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Realtor = { id: string; name: string; email: string | null; slug?: string } | null;
type Customer = { id: string; name: string; email: string; phone: string | null; company: string | null } | null;
type Album = { id: string; slug: string; address: string; shoot_date: string | null; realtor_slug?: string | null } | null;
type TimelineEvent = { id: string; event_type: string; message: string | null; created_at: string };
type RevisionRequest = { id: string; type: string; message: string | null; status: string; created_at: string };

type Props = {
  job: Job;
  realtor: Realtor;
  customer: Customer;
  album: Album;
  timeline: TimelineEvent[];
  revisionRequests: RevisionRequest[];
};

export function AdminJobDetail({
  job,
  realtor,
  customer,
  album,
  timeline,
  revisionRequests,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(job.status);
  const [savingStatus, setSavingStatus] = useState(false);
  const [revisionType, setRevisionType] = useState("");
  const [revisionMessage, setRevisionMessage] = useState("");
  const [addingRevision, setAddingRevision] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const contact = realtor ?? customer;
  const deliveryUrl = album?.realtor_slug && album?.slug
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/${album.realtor_slug}/${album.slug}`
    : null;

  const handleStatusChange = async () => {
    if (status === job.status) return;
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      window.location.reload();
    } finally {
      setSavingStatus(false);
    }
  };

  const handleAddRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionType.trim()) return;
    setAddingRevision(true);
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}/revisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: revisionType, message: revisionMessage.trim() || null }),
      });
      if (!res.ok) throw new Error();
      setRevisionType("");
      setRevisionMessage("");
      window.location.reload();
    } finally {
      setAddingRevision(false);
    }
  };

  const handleDeleteJob = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((data.error as string) || "Failed to delete job");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  return (
    <div className="mt-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{job.property_address}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {contact?.name ?? "—"}
          {contact && "email" in contact && contact.email && ` (${contact.email})`}
          {job.source === "website_booking" && (
            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">Website booking</span>
          )}
          {job.listing_title && ` · ${job.listing_title}`}
          {job.shooting_date && ` · Shoot ${new Date(job.shooting_date).toLocaleDateString()}`}
          {job.delivery_deadline && ` · Due ${new Date(job.delivery_deadline).toLocaleDateString()}`}
          {job.delivered_at && ` · Delivered ${new Date(job.delivered_at).toLocaleDateString()}`}
        </p>
      </div>

      <section>
        <h2 className="text-lg font-medium text-zinc-900">Status</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            {JOB_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, " ")}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleStatusChange}
            disabled={savingStatus || status === job.status}
            className="rounded-xl bg-amber-50 border border-amber-200/90 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-amber-100/90 disabled:opacity-50"
          >
            {savingStatus ? "Saving…" : "Update status"}
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900">Details</h2>
        <dl className="mt-2 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-zinc-500">Service type</dt>
            <dd className="text-sm text-zinc-900">{job.service_type ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500">Total price</dt>
            <dd className="text-sm text-zinc-900">{job.total_price != null ? `$${Number(job.total_price).toLocaleString()}` : "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500">Priority</dt>
            <dd className="text-sm text-zinc-900">{job.priority}</dd>
          </div>
          {job.notes && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-zinc-500">Notes</dt>
              <dd className="text-sm text-zinc-700 whitespace-pre-wrap">{job.notes}</dd>
            </div>
          )}
        </dl>
      </section>

      {album && (
        <section>
          <h2 className="text-lg font-medium text-zinc-900">Album</h2>
          <p className="mt-1 text-sm text-zinc-600">
            This job is linked to an album. Manage images and delivery link from the album page.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link
              href={`/admin/albums/${album.id}`}
              className="rounded-xl bg-amber-50 border border-amber-200/90 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-amber-100/90 transition"
            >
              Open album
            </Link>
            {deliveryUrl && (
              <a
                href={deliveryUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                View delivery page →
              </a>
            )}
          </div>
        </section>
      )}

      {revisionRequests.length > 0 && (
        <section>
          <h2 className="text-lg font-medium text-zinc-900">Revision requests</h2>
          <ul className="mt-2 space-y-2">
            {revisionRequests.map((r) => (
              <li key={r.id} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm">
                <p className="font-medium text-zinc-900">{r.type.replace(/_/g, " ")}</p>
                {r.message && <p className="mt-1 text-zinc-600">{r.message}</p>}
                <p className="mt-1 text-zinc-500">
                  {r.status} · {new Date(r.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-lg font-medium text-zinc-900">Add revision request</h2>
        <form onSubmit={handleAddRevision} className="mt-2 space-y-2">
          <select
            value={revisionType}
            onChange={(e) => setRevisionType(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">Select type</option>
            {REVISION_REQUEST_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
            ))}
          </select>
          <textarea
            value={revisionMessage}
            onChange={(e) => setRevisionMessage(e.target.value)}
            placeholder="Message (optional)"
            rows={2}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={addingRevision || !revisionType.trim()}
            className="rounded-xl bg-amber-50 border border-amber-200/90 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-amber-100/90 disabled:opacity-50"
          >
            {addingRevision ? "Adding…" : "Add revision request"}
          </button>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium text-zinc-900">Activity timeline</h2>
        {timeline.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-600">No events yet.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {timeline.map((e) => (
              <li key={e.id} className="flex gap-3 text-sm">
                <span className="shrink-0 text-zinc-500">
                  {new Date(e.created_at).toLocaleString()}
                </span>
                <span className="font-medium text-zinc-700">{e.event_type}</span>
                {e.message && <span className="text-zinc-600">{e.message}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border-t border-zinc-200 pt-8">
        <h2 className="text-lg font-medium text-zinc-900">Delete job</h2>
        <p className="mt-1 text-sm text-stone-600">
          Permanently remove this job. The linked album (if any) will remain; its job link will be cleared. Timeline, revision requests, and notifications for this job will be deleted.
        </p>
        {confirmDelete ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-stone-600">Delete this job?</span>
            <button
              type="button"
              onClick={handleDeleteJob}
              disabled={deleting}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Yes, delete job"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              className="rounded-xl border border-amber-200/80 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-amber-50/80 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100/80"
          >
            Delete job
          </button>
        )}
      </section>
    </div>
  );
}
