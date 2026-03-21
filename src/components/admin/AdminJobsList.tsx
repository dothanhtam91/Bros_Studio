import Link from "next/link";
import { DeleteJobFromListButton } from "@/components/admin/DeleteJobFromListButton";

export type JobRow = {
  id: string;
  source: string;
  realtor_id: string | null;
  customer_id: string | null;
  album_id: string | null;
  property_address: string;
  status: string;
  shooting_date: string | null;
  delivery_deadline: string | null;
  created_at: string;
  contact_name?: string;
};

export function AdminJobsList({ jobs }: { jobs: JobRow[] }) {
  return (
    <div className="mt-8">
      {!jobs.length ? (
        <p className="text-stone-600">No jobs yet. Create one or wait for website bookings.</p>
      ) : (
        <ul className="space-y-2">
          {jobs.map((j) => (
            <li
              key={j.id}
              className="flex gap-0 overflow-hidden rounded-2xl border border-amber-200/50 bg-white shadow-sm shadow-amber-900/5 transition hover:border-amber-200 hover:shadow-md hover:shadow-amber-900/10"
            >
              <Link
                href={`/admin/jobs/${j.id}`}
                className="min-w-0 flex-1 p-4 transition hover:bg-amber-50/30"
              >
                <p className="font-medium text-stone-900">{j.property_address}</p>
                <p className="text-sm text-stone-500">
                  {j.contact_name ?? "—"} · {j.status}
                  {j.source === "website_booking" && (
                    <span className="ml-1 rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">Web</span>
                  )}
                  {j.shooting_date && ` · Shoot ${new Date(j.shooting_date).toLocaleDateString()}`}
                  {j.delivery_deadline && ` · Due ${new Date(j.delivery_deadline).toLocaleDateString()}`}
                </p>
              </Link>
              <div className="flex shrink-0 items-center border-l border-amber-200/40 bg-white px-3 sm:px-4">
                <DeleteJobFromListButton jobId={j.id} propertyAddress={j.property_address} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
