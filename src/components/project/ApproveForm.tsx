"use client";

import { useState } from "react";
import type { ReviewApproval } from "@/lib/db/types";

interface ApproveFormProps {
  projectId: string;
  existingReview?: Pick<ReviewApproval, "id" | "approved" | "requested_changes" | "reviewed_at">;
}

export function ApproveForm({ projectId, existingReview }: ApproveFormProps) {
  const [approved, setApproved] = useState<boolean | null>(
    existingReview ? existingReview.approved : null
  );
  const [changes, setChanges] = useState(existingReview?.requested_changes ?? "");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(`/api/projects/${projectId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved: approved!, requested_changes: changes || null }),
      });
      if (!res.ok) throw new Error();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  if (existingReview && status !== "sending" && status !== "error") {
    return (
      <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="font-medium text-zinc-900">
          {existingReview.approved ? "Approved" : "Changes requested"}
        </p>
        <p className="text-sm text-zinc-600">
          {new Date(existingReview.reviewed_at).toLocaleString()}
        </p>
        {existingReview.requested_changes && (
          <p className="mt-2 text-sm text-zinc-700">{existingReview.requested_changes}</p>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-4">
      <div className="flex gap-4">
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="approve"
            checked={approved === true}
            onChange={() => setApproved(true)}
            className="text-zinc-900"
          />
          <span>Approve delivery</span>
        </label>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="radio"
            name="approve"
            checked={approved === false}
            onChange={() => setApproved(false)}
            className="text-zinc-900"
          />
          <span>Request changes</span>
        </label>
      </div>
      {approved === false && (
        <div>
          <label htmlFor="changes" className="block text-sm font-medium text-zinc-700">
            What should we change?
          </label>
          <textarea
            id="changes"
            rows={3}
            value={changes}
            onChange={(e) => setChanges(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900"
          />
        </div>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600">Failed to submit. Try again.</p>
      )}
      <button
        type="submit"
        disabled={approved === null || status === "sending"}
        className="w-full rounded-xl bg-amber-50 border border-amber-200/90 py-3 text-sm font-medium text-stone-800 hover:bg-amber-100/90 disabled:opacity-50"
      >
        {status === "sending" ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}
