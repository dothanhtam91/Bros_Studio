"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { JOB_STATUSES, REVISION_REQUEST_TYPES } from "@/lib/jobs";

type Job = {
  id: string;
  source: string;
  realtor_id: string | null;
  customer_id: string | null;
  album_id: string | null;
  delivery_token: string | null;
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
type TimelineEvent = { id: string; event_type: string; message: string | null; created_at: string; metadata?: Record<string, unknown> };
type RevisionRequest = { id: string; type: string; message: string | null; status: string; created_at: string };

type Props = {
  job: Job;
  realtor: Realtor;
  customer: Customer;
  album: Album;
  timeline: TimelineEvent[];
  revisionRequests: RevisionRequest[];
};

const EVENT_LABELS: Record<string, string> = {
  booking_created: "Booking created",
  website_booking_submitted: "Booking submitted",
  job_created: "Job created",
  shooting_confirmed: "Shooting confirmed",
  album_created: "Album created",
  album_link_generated: "Album link ready",
  delivery_email_sent: "Delivery email sent",
  status_changed: "Status changed",
  revision_requested: "Revision requested",
};

const PROGRESS_STEPS = [
  { key: "booked", label: "Booked" },
  { key: "confirmed", label: "Confirmed" },
  { key: "album_ready", label: "Album Ready" },
  { key: "upload", label: "Upload Media" },
  { key: "review", label: "Review Delivery" },
  { key: "sent", label: "Sent" },
] as const;

function formatEvent(e: TimelineEvent): string {
  return EVENT_LABELS[e.event_type] || e.event_type.replace(/_/g, " ");
}

type StepState = "completed" | "current" | "upcoming" | "blocked";

function getProgressStepStates(job: Job): Record<(typeof PROGRESS_STEPS)[number]["key"], StepState> {
  const hasAlbum = !!job.album_id;
  const delivered = !!job.delivered_at;
  return {
    booked: "completed",
    confirmed: hasAlbum ? "completed" : "upcoming",
    album_ready: hasAlbum ? "completed" : "upcoming",
    upload: hasAlbum && !delivered ? "current" : hasAlbum ? "completed" : "upcoming",
    review: delivered ? "completed" : hasAlbum ? "upcoming" : "blocked",
    sent: delivered ? "completed" : "upcoming",
  };
}

function getPrimaryCTA(job: Job, album: Album | null): { label: string; href?: string; action?: "confirm_shooting" | "send_delivery" } {
  if (!job.album_id) return { label: "Confirm shooting", action: "confirm_shooting" };
  if (job.delivered_at) return { label: "Resend delivery email", action: "send_delivery" };
  if (album) return { label: "Upload photos", href: `/admin/albums/${album.id}` };
  return { label: "Send delivery email", action: "send_delivery" };
}

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
  const [confirmShootingOpen, setConfirmShootingOpen] = useState(false);
  const [confirmShootingLoading, setConfirmShootingLoading] = useState(false);
  const [sendDeliveryOpen, setSendDeliveryOpen] = useState(false);
  const [sendDeliveryLoading, setSendDeliveryLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const contact = realtor ?? customer;
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const deliveryUrl = album?.realtor_slug && album?.slug ? `${baseUrl}/r/${album.realtor_slug}/${album.slug}` : null;
  const deliveryPageUrl = job.delivery_token ? `${baseUrl}/delivery/${job.delivery_token}` : null;

  const progressStates = getProgressStepStates(job);
  const primaryCTA = getPrimaryCTA(job, album);
  const openRevisions = revisionRequests.filter((r) => r.status === "open" || r.status === "in_progress");

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
      showToast("Status updated", "success");
      router.refresh();
      window.location.reload();
    } catch {
      showToast("Failed to update status", "error");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleConfirmShooting = async () => {
    setConfirmShootingLoading(true);
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}/confirm-shooting`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast((data.error as string) || "Failed to confirm shooting", "error");
        return;
      }
      showToast("Shooting confirmed. Album created.", "success");
      setConfirmShootingOpen(false);
      router.refresh();
      window.location.reload();
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setConfirmShootingLoading(false);
    }
  };

  const handleSendDelivery = async () => {
    setSendDeliveryLoading(true);
    try {
      const res = await fetch(`/api/admin/jobs/${job.id}/send-delivery`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast((data.error as string) || "Failed to send delivery email", "error");
        return;
      }
      showToast("Delivery email sent", "success");
      setSendDeliveryOpen(false);
      router.refresh();
      window.location.reload();
    } catch {
      showToast("Something went wrong", "error");
    } finally {
      setSendDeliveryLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(
      () => showToast(`${label} copied`, "success"),
      () => showToast("Failed to copy", "error")
    );
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
      showToast("Revision request added", "success");
      router.refresh();
      window.location.reload();
    } catch {
      showToast("Failed to add revision request", "error");
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
        showToast((data.error as string) || "Failed to delete job", "error");
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
    <div className="mt-8 space-y-8">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl px-4 py-2.5 text-sm font-medium shadow-lg ${
            toast.type === "success" ? "bg-zinc-900 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      {/* Modals */}
      {confirmShootingOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !confirmShootingLoading && setConfirmShootingOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-zinc-900">Confirm shooting</h3>
            <p className="mt-2 text-sm text-zinc-600">
              This will create the property album. You can then upload photos and send the delivery when ready.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmShootingOpen(false)}
                disabled={confirmShootingLoading}
                className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmShooting}
                disabled={confirmShootingLoading}
                className="flex-1 rounded-xl border border-amber-200/90 bg-amber-50 py-2.5 text-sm font-medium text-stone-800 transition hover:bg-amber-100/90 disabled:opacity-50"
              >
                {confirmShootingLoading ? "Confirming…" : "Confirm shooting"}
              </button>
            </div>
          </div>
        </div>
      )}

      {sendDeliveryOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !sendDeliveryLoading && setSendDeliveryOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-zinc-900">Send delivery email</h3>
            <p className="mt-2 text-sm text-zinc-600">
              The client will receive a branded email with a link to the delivery page. Email will be sent to{" "}
              {contact && "email" in contact ? contact.email : "the contact email"}.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setSendDeliveryOpen(false)}
                disabled={sendDeliveryLoading}
                className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendDelivery}
                disabled={sendDeliveryLoading}
                className="flex-1 rounded-xl border border-amber-200/90 bg-amber-50 py-2.5 text-sm font-medium text-stone-800 transition hover:bg-amber-100/90 disabled:opacity-50"
              >
                {sendDeliveryLoading ? "Sending…" : "Send email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Job overview header */}
      <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
              {job.property_address}
            </h1>
            {job.listing_title && (
              <p className="mt-1 text-sm text-zinc-500">{job.listing_title}</p>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                {job.source === "website_booking" ? "Website booking" : "Admin"}
              </span>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium capitalize text-zinc-600">
                {job.service_type ?? "—"}
              </span>
            </div>
            <p className="mt-4 text-sm text-zinc-600">
              {contact?.name ?? "—"}
              {contact && "email" in contact && contact.email && (
                <span className="text-zinc-500"> · {contact.email}</span>
              )}
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-wrap items-center gap-3 lg:flex-col lg:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800">
                {job.status.replace(/_/g, " ")}
              </span>
              <span className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 capitalize">
                {job.priority}
              </span>
              {job.total_price != null && (
                <span className="text-sm font-semibold text-zinc-900">
                  ${Number(job.total_price).toFixed(2)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {primaryCTA.href ? (
                <Link
                  href={primaryCTA.href}
                  className="rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-amber-100/90"
                >
                  {primaryCTA.label}
                </Link>
              ) : primaryCTA.action === "confirm_shooting" ? (
                <button
                  type="button"
                  onClick={() => setConfirmShootingOpen(true)}
                  className="rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-amber-100/90"
                >
                  {primaryCTA.label}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSendDeliveryOpen(true)}
                  className="rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-stone-800 transition hover:bg-amber-100/90"
                >
                  {primaryCTA.label}
                </button>
              )}
              {album && (
                <>
                  <Link
                    href={`/admin/albums/${album.id}`}
                    className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    Open album
                  </Link>
                  {deliveryUrl && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(deliveryUrl!, "Album link")}
                      className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      Copy album link
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Workflow progress bar */}
        <div className="mt-8 border-t border-zinc-100 pt-6">
          <p className="mb-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
            Workflow progress
          </p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-0">
            {PROGRESS_STEPS.map((step, i) => {
              const state = progressStates[step.key];
              return (
                <div key={step.key} className="flex flex-1 min-w-0 items-center">
                  <div
                    className={`flex flex-col items-center rounded-lg px-2 py-1.5 text-center sm:flex-1 ${
                      state === "completed"
                        ? "bg-emerald-50/80 text-emerald-800"
                        : state === "current"
                          ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200/80"
                          : state === "blocked"
                            ? "bg-zinc-100 text-zinc-400"
                            : "bg-zinc-50 text-zinc-500"
                    }`}
                  >
                    <span className="text-xs font-medium">{step.label}</span>
                  </div>
                  {i < PROGRESS_STEPS.length - 1 && (
                    <div
                      className={`hidden h-px flex-1 sm:block ${
                        state === "completed" ? "bg-emerald-200/60" : "bg-zinc-200"
                      }`}
                      style={{ minWidth: "8px" }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Two-column main content */}
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Left column */}
        <div className="space-y-8">
          {/* Open revision alert */}
          {openRevisions.length > 0 && (
            <div className="rounded-2xl border border-amber-200/80 bg-amber-50/50 p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-900">
                Open revision request
              </h2>
              {openRevisions.slice(0, 1).map((r) => (
                <div key={r.id} className="mt-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-900">{r.type.replace(/_/g, " ")}</p>
                    {r.message && <p className="mt-1 text-sm text-zinc-600">{r.message}</p>}
                    <p className="mt-1 text-xs text-zinc-500">
                      {r.status.replace(/_/g, " ")} · {new Date(r.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Production workflow */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Production workflow
            </h2>
            <ul className="mt-5 space-y-1">
              {[
                { key: "booking", label: "Booking received", done: true },
                { key: "shoot", label: "Shoot confirmed", done: !!job.album_id },
                { key: "album", label: "Album created", done: !!job.album_id },
                {
                  key: "upload",
                  label: "Upload final media",
                  done: !!job.delivered_at,
                  current: !!job.album_id && !job.delivered_at,
                  action: album ? { href: `/admin/albums/${album.id}`, label: "Open album" } : undefined,
                },
                {
                  key: "review",
                  label: "Review delivery page",
                  done: !!job.delivered_at,
                  current: !!job.delivery_token && !job.delivered_at,
                  locked: !job.delivery_token && !!job.album_id,
                  lockedMessage: "Delivery page is generated when you send the delivery email.",
                },
                {
                  key: "send",
                  label: "Send delivery email",
                  done: !!job.delivered_at,
                  current: false,
                  action: !job.delivered_at && album ? { action: "send_delivery", label: "Send email" } : undefined,
                },
              ].map((step) => (
                <li
                  key={step.key}
                  className={`flex items-center gap-4 rounded-xl border px-4 py-3 ${
                    step.current
                      ? "border-amber-200/80 bg-amber-50/50"
                      : step.done
                        ? "border-zinc-100 bg-zinc-50/50"
                        : step.locked
                          ? "border-zinc-100 bg-zinc-50/30"
                          : "border-zinc-100 bg-white"
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                      step.done
                        ? "bg-emerald-100 text-emerald-700"
                        : step.current
                          ? "bg-amber-100 text-amber-800"
                          : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {step.done ? "✓" : step.current ? "•" : "—"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900">{step.label}</p>
                    {step.locked && step.lockedMessage && (
                      <p className="mt-0.5 text-xs text-zinc-500">{step.lockedMessage}</p>
                    )}
                  </div>
                  {step.action && (
                    <>
                      {"href" in step.action && step.action.href ? (
                        <Link
                          href={step.action.href}
                          className="shrink-0 rounded-lg border border-amber-200/90 bg-amber-50 px-3 py-1.5 text-sm font-medium text-stone-800 transition hover:bg-amber-100/90"
                        >
                          {step.action.label}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSendDeliveryOpen(true)}
                          className="shrink-0 rounded-lg border border-amber-200/90 bg-amber-50 px-3 py-1.5 text-sm font-medium text-stone-800 transition hover:bg-amber-100/90"
                        >
                          {step.action.label}
                        </button>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Revision requests */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Revision requests
            </h2>
            {revisionRequests.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {revisionRequests.map((r) => (
                  <li
                    key={r.id}
                    className="rounded-xl border border-zinc-100 bg-zinc-50/50 p-4"
                  >
                    <p className="font-medium text-zinc-900">{r.type.replace(/_/g, " ")}</p>
                    {r.message && <p className="mt-1 text-sm text-zinc-600">{r.message}</p>}
                    <p className="mt-2 text-xs text-zinc-500">
                      <span
                        className={`rounded-full px-2 py-0.5 font-medium ${
                          r.status === "open"
                            ? "bg-amber-100 text-amber-800"
                            : r.status === "in_progress"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        {r.status.replace(/_/g, " ")}
                      </span>{" "}
                      · {new Date(r.created_at).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-zinc-500">No revision requests.</p>
            )}
            <form onSubmit={handleAddRevision} className="mt-6 space-y-3">
              <select
                value={revisionType}
                onChange={(e) => setRevisionType(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              >
                <option value="">Select type</option>
                {REVISION_REQUEST_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <textarea
                value={revisionMessage}
                onChange={(e) => setRevisionMessage(e.target.value)}
                placeholder="Message (optional)"
                rows={2}
                className="w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
              />
              <button
                type="submit"
                disabled={addingRevision || !revisionType.trim()}
                className="rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-2.5 text-sm font-medium text-stone-800 transition hover:bg-amber-100/90 disabled:opacity-50"
              >
                {addingRevision ? "Adding…" : "Add revision request"}
              </button>
            </form>
          </div>

          {/* Activity timeline */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Activity timeline
            </h2>
            {timeline.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">No events yet.</p>
            ) : (
              <ul className="mt-4 space-y-0">
                {timeline.map((e, i) => (
                  <li key={e.id} className="flex gap-4 pb-6 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-zinc-300" />
                      {i < timeline.length - 1 && (
                        <div className="mt-1 h-full w-px flex-1 bg-zinc-200" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pb-6 last:pb-0">
                      <p className="font-medium text-zinc-900">{formatEvent(e)}</p>
                      {e.message && (
                        <p className="mt-0.5 text-sm text-zinc-600">{e.message}</p>
                      )}
                      <p className="mt-1 text-xs text-zinc-400">
                        {new Date(e.created_at).toLocaleString(undefined, {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right column - sticky */}
        <div className="space-y-6 lg:sticky lg:top-24">
          {/* Delivery control */}
          <div className="rounded-2xl border border-zinc-200/90 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Delivery control
            </h2>
            <div className="mt-4 space-y-5">
              <div>
                <p className="text-xs font-medium text-zinc-500">Album</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {album && (
                    <>
                      <Link
                        href={`/admin/albums/${album.id}`}
                        className="rounded-lg border border-amber-200/90 bg-amber-50 px-3 py-2 text-sm font-medium text-stone-800 transition hover:bg-amber-100/90"
                      >
                        Open album
                      </Link>
                      {deliveryUrl && (
                        <>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(deliveryUrl!, "Album link")}
                            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                          >
                            Copy link
                          </button>
                          <a
                            href={deliveryUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                          >
                            Preview
                          </a>
                        </>
                      )}
                    </>
                  )}
                  {!album && (
                    <span className="text-sm text-zinc-500">Confirm shooting to create album.</span>
                  )}
                </div>
                {deliveryUrl && (
                  <div className="mt-2 flex rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2">
                    <input
                      type="text"
                      readOnly
                      value={deliveryUrl}
                      className="min-w-0 flex-1 border-0 bg-transparent text-xs text-zinc-600 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(deliveryUrl!, "Link")}
                      className="text-xs font-medium text-amber-700 hover:text-amber-800"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500">Delivery page</p>
                {deliveryPageUrl ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(deliveryPageUrl!, "Delivery page link")}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      Copy link
                    </button>
                    <a
                      href={deliveryPageUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      Open page
                    </a>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-zinc-500">
                    Not generated yet. The delivery page will be created when you send the delivery email.
                  </p>
                )}
                {deliveryPageUrl && (
                  <div className="mt-2 flex rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2">
                    <input
                      type="text"
                      readOnly
                      value={deliveryPageUrl}
                      className="min-w-0 flex-1 border-0 bg-transparent text-xs text-zinc-600 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => copyToClipboard(deliveryPageUrl!, "Link")}
                      className="text-xs font-medium text-amber-700 hover:text-amber-800"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-500">Email</p>
                <p className="mt-1 text-sm text-zinc-700">
                  {job.delivered_at ? (
                    <>
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                        Sent
                      </span>{" "}
                      {new Date(job.delivered_at).toLocaleString(undefined, {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </>
                  ) : (
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600">
                      Not sent
                    </span>
                  )}
                </p>
                {album && (
                  <button
                    type="button"
                    onClick={() => setSendDeliveryOpen(true)}
                    className="mt-2 rounded-lg border border-amber-200/90 bg-amber-50 px-3 py-2 text-sm font-medium text-stone-800 transition hover:bg-amber-100/90"
                  >
                    {job.delivered_at ? "Resend delivery email" : "Send delivery email"}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Job details */}
          <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-[0_1px_3px_0_rgba(0,0,0,0.06)]">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Job details
            </h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2.5 text-sm">
              <dt className="text-zinc-500">Service type</dt>
              <dd className="font-medium text-zinc-900">{job.service_type ?? "—"}</dd>
              <dt className="text-zinc-500">Total price</dt>
              <dd className="font-medium tabular-nums text-zinc-900">
                {job.total_price != null ? `$${Number(job.total_price).toFixed(2)}` : "—"}
              </dd>
              <dt className="text-zinc-500">Priority</dt>
              <dd className="font-medium capitalize text-zinc-900">{job.priority}</dd>
              <dt className="text-zinc-500">Status</dt>
              <dd className="flex flex-wrap items-center gap-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white py-1.5 pl-2 pr-6 text-xs text-zinc-900 focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
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
                  className="shrink-0 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
                >
                  {savingStatus ? "Saving…" : "Update"}
                </button>
              </dd>
              <dt className="text-zinc-500">Source</dt>
              <dd className="font-medium text-zinc-900">
                {job.source === "website_booking" ? "Website" : "Admin"}
              </dd>
              <dt className="text-zinc-500">Client</dt>
              <dd className="truncate font-medium text-zinc-900">{contact?.name ?? "—"}</dd>
              {contact && "email" in contact && (
                <>
                  <dt className="text-zinc-500">Email</dt>
                  <dd className="truncate font-medium text-zinc-900">{contact.email}</dd>
                </>
              )}
            </dl>
            {job.notes && (
              <div className="mt-4 border-t border-zinc-100 pt-4">
                <p className="text-xs font-medium text-zinc-500">Notes</p>
                <p className="mt-1.5 text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap">
                  {job.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="rounded-2xl border border-red-100 bg-red-50/30 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-red-800/80">
          Danger zone
        </h2>
        <p className="mt-2 text-sm text-zinc-600">
          Permanently remove this job. The linked album (if any) will remain.
        </p>
        {confirmDelete ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-zinc-600">Delete this job?</span>
            <button
              type="button"
              onClick={handleDeleteJob}
              disabled={deleting}
              className="rounded-xl border border-red-200 bg-red-100 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-200/80 disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Yes, delete"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="mt-4 rounded-xl border border-red-200/80 px-4 py-2.5 text-sm font-medium text-red-700 transition hover:bg-red-100/50"
          >
            Delete job
          </button>
        )}
      </div>
    </div>
  );
}
