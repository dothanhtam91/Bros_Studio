"use client";

import type { Invoice } from "@/lib/db/types";

interface ProjectInvoiceProps {
  invoices: Pick<Invoice, "id" | "status" | "amount_cents" | "paid_at">[];
  projectId: string;
}

export function ProjectInvoice({ invoices, projectId }: ProjectInvoiceProps) {
  const paid = invoices.some((i) => i.status === "paid" || i.paid_at);
  const pending = invoices.find((i) => i.status !== "paid" && !i.paid_at);

  if (!invoices.length) {
    return (
      <p className="mt-2 text-sm text-zinc-600">No invoice yet.</p>
    );
  }

  return (
    <div className="mt-2 space-y-4">
      {invoices.map((inv) => (
        <div
          key={inv.id}
          className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white p-4"
        >
          <div>
            <p className="font-medium text-zinc-900">
              ${(inv.amount_cents / 100).toLocaleString()}
            </p>
            <p className="text-sm text-zinc-500">
              {inv.paid_at
                ? `Paid ${new Date(inv.paid_at).toLocaleDateString()}`
                : inv.status}
            </p>
          </div>
          {!inv.paid_at && inv.status !== "paid" && (
            <a
              href={`/api/invoices/${inv.id}/pay`}
              className="rounded-xl bg-amber-50 border border-amber-200/90 px-4 py-2 text-sm font-medium text-stone-800 hover:bg-amber-100/90"
            >
              Pay now
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
