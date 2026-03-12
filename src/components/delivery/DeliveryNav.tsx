import Link from "next/link";

type Props = {
  backHref: string;
  backLabel?: string;
  className?: string;
};

export function DeliveryNav({ backHref, backLabel = "All albums", className }: Props) {
  return (
    <nav
      className={`fixed left-0 right-0 top-0 z-40 border-b border-stone-200/80 bg-white/80 backdrop-blur-md ${className ?? ""}`}
      aria-label="Navigation"
    >
      <div className="mx-auto flex max-w-7xl items-center px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href={backHref}
          className="rounded-lg px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-amber-50/80 hover:text-stone-800"
        >
          ← {backLabel}
        </Link>
      </div>
    </nav>
  );
}
