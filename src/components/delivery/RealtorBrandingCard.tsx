import Image from "next/image";
import Link from "next/link";

export type RealtorBranding = {
  slug: string;
  name: string;
  headshot_url: string | null;
  brokerage: string | null;
  brokerage_logo_url?: string | null;
  title?: string | null;
  tagline?: string | null;
  phone: string | null;
  email: string | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  linkedin?: string | null;
};

type Props = {
  realtor: RealtorBranding;
};

const iconClass = "h-4 w-4 shrink-0 text-stone-400";

function PhoneIcon() {
  return (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  );
}

export function RealtorBrandingCard({ realtor }: Props) {
  const hasContact = realtor.phone || realtor.email;

  return (
    <section className="border-t border-amber-200/50 bg-amber-50/20" aria-label="Agent information">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-white to-amber-50/30 p-6 shadow-lg shadow-amber-900/5 sm:p-6">
          {/* Horizontal layout: headshot | info | actions */}
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
            {/* Left: headshot */}
            <div className="flex shrink-0 justify-center sm:justify-start">
              {realtor.headshot_url ? (
                <div className="relative h-20 w-20 overflow-hidden rounded-full bg-stone-100 ring-1 ring-stone-200/60 sm:h-24 sm:w-24">
                  <Image
                    src={realtor.headshot_url}
                    alt=""
                    width={96}
                    height={96}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-2xl font-semibold text-amber-800 sm:h-24 sm:w-24 sm:text-3xl">
                  {realtor.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Center: name, brokerage, contact */}
            <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
              <h2 className="text-lg font-semibold tracking-tight text-stone-900">
                {realtor.name}
              </h2>
              {realtor.brokerage && (
                <p className="flex items-center justify-center gap-1.5 text-sm text-stone-600 sm:justify-start">
                  <BuildingIcon />
                  <span>{realtor.brokerage}</span>
                </p>
              )}
              {hasContact && (
                <div className="flex flex-col gap-1 pt-0.5">
                  {realtor.phone && (
                    <a
                      href={`tel:${realtor.phone.replace(/\D/g, "")}`}
                      className="inline-flex items-center justify-center gap-2 text-sm text-stone-600 hover:text-amber-700 transition sm:justify-start"
                    >
                      <PhoneIcon />
                      <span>{realtor.phone}</span>
                    </a>
                  )}
                  {realtor.email && (
                    <a
                      href={`mailto:${realtor.email}`}
                      className="inline-flex items-center justify-center gap-2 text-sm text-stone-600 hover:text-amber-700 transition sm:justify-start"
                    >
                      <EmailIcon />
                      <span>{realtor.email}</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Right: CTAs */}
            <div className="flex flex-col items-center gap-3 border-t border-amber-100/80 pt-4 sm:shrink-0 sm:items-end sm:border-t-0 sm:pt-0 sm:pl-6">
              <Link
                href={`mailto:${realtor.email ?? ""}?subject=Inquiry about property`}
                className="inline-flex items-center rounded-xl bg-amber-50 border border-amber-200/90 px-5 py-2.5 text-sm font-medium text-stone-800 transition hover:bg-amber-100/90"
              >
                Contact Agent
              </Link>
              <Link
                href={`/r/${realtor.slug}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-stone-500 hover:text-amber-800 transition"
              >
                View More Listings
                <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
