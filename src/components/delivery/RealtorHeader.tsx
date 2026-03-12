import Image from "next/image";
import Link from "next/link";

export type Realtor = {
  slug: string;
  name: string;
  headshot_url: string | null;
  brokerage: string | null;
  phone: string | null;
  email: string | null;
};

type RealtorHeaderProps = {
  realtor: Realtor;
  backHref?: string;
  backLabel?: string;
};

export function RealtorHeader({ realtor, backHref, backLabel }: RealtorHeaderProps) {
  return (
    <header className="border-b border-amber-200/50 bg-white/95 shadow-sm">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        {backHref && (
          <Link
            href={backHref}
            className="mb-4 inline-block text-sm font-medium text-amber-800/90 hover:text-amber-900"
          >
            {backLabel ?? "← Back"}
          </Link>
        )}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          {realtor.headshot_url ? (
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-stone-100 ring-2 ring-amber-200/50">
              <Image
                src={realtor.headshot_url}
                alt={realtor.name}
                width={96}
                height={96}
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-2xl font-semibold text-amber-800">
              {realtor.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-semibold text-stone-900">{realtor.name}</h1>
            {realtor.brokerage && (
              <p className="mt-0.5 text-sm text-stone-600">{realtor.brokerage}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              {realtor.phone && (
                <a
                  href={`tel:${realtor.phone}`}
                  className="font-medium text-stone-700 hover:text-amber-800"
                >
                  {realtor.phone}
                </a>
              )}
              {realtor.email && (
                <a
                  href={`mailto:${realtor.email}`}
                  className="font-medium text-stone-700 hover:text-amber-800"
                >
                  {realtor.email}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
