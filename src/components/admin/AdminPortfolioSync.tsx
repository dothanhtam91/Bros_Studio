"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function AdminPortfolioSync() {
  const [folderId, setFolderId] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/portfolio/settings")
      .then((r) => r.json())
      .then((d) => setFolderId(d.folder_id ?? ""));
  }, []);

  const handleSync = async () => {
    const id = folderId.trim();
    if (!id) {
      setMessage({ type: "err", text: "Paste the Drive folder ID first." });
      return;
    }
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/portfolio/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "err", text: data.error || "Sync failed." });
        return;
      }
      setMessage({ type: "ok", text: `Synced ${data.synced} images from Drive.` });
    } catch {
      setMessage({ type: "err", text: "Request failed." });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600">
        Paste your Google Drive <strong>folder ID</strong> (from the folder URL:{" "}
        <code className="rounded bg-zinc-100 px-1">drive.google.com/drive/folders/<strong>FOLDER_ID</strong></code>
        ). Share that folder with &quot;Anyone with the link can view&quot; and with your service account email so the site can list and display images.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Drive folder ID (e.g. 1ABC...xyz)"
          value={folderId}
          onChange={(e) => setFolderId(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={handleSync}
          disabled={syncing}
          className="rounded-xl bg-amber-50 border border-amber-200/90 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-amber-100/90 disabled:opacity-50"
        >
          {syncing ? "Syncing…" : "Sync from Drive"}
        </button>
      </div>
      {message && (
        <p className={`text-sm ${message.type === "ok" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
      <p className="text-xs text-zinc-500">
        First-time setup: Enable Google Drive API, create a service account, download JSON, and add it to .env as GOOGLE_SERVICE_ACCOUNT_JSON. Share the portfolio folder with the service account email.
      </p>
    </div>
  );
}
