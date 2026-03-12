"use client";

import { useState } from "react";
import Link from "next/link";

type NotificationRow = {
  id: string;
  job_id: string | null;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  created_at: string;
};

export function AdminNotificationsList({ notifications }: { notifications: NotificationRow[] }) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set(notifications.filter((n) => n.is_read).map((n) => n.id)));

  const markRead = async (id: string) => {
    try {
      await fetch("/api/admin/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_read: true }),
      });
      setReadIds((prev) => new Set(prev).add(id));
    } catch {
      // ignore
    }
  };

  if (!notifications.length) {
    return <p className="mt-6 text-stone-500">No notifications.</p>;
  }

  return (
    <ul className="mt-6 space-y-2">
      {notifications.map((n) => (
        <li
          key={n.id}
          className={`rounded-2xl border p-4 shadow-sm transition ${
            n.is_read || readIds.has(n.id) ? "border-stone-200 bg-white" : "border-amber-200/70 bg-amber-50/50"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-stone-900">{n.title}</p>
              {n.message && <p className="mt-1 text-sm text-stone-600">{n.message}</p>}
              <p className="mt-1 text-xs text-stone-500">{new Date(n.created_at).toLocaleString()}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {n.job_id && (
                <Link
                  href={`/admin/jobs/${n.job_id}`}
                  className="text-sm font-medium text-stone-700 hover:text-amber-800 transition"
                >
                  Open job
                </Link>
              )}
              {(!n.is_read && !readIds.has(n.id)) && (
                <button
                  type="button"
                  onClick={() => markRead(n.id)}
                  className="text-sm text-stone-500 hover:text-amber-800 transition"
                >
                  Mark read
                </button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
