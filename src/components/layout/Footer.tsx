import Link from "next/link";
import Image from "next/image";

const links = [
  { href: "/portfolio", label: "Portfolio" },
  { href: "/packages", label: "Packages" },
  { href: "/book", label: "Book" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="inline-block">
              <Image
                src="/logo.png"
                alt="BrosStudio"
                width={120}
                height={32}
                className="h-8 w-auto object-contain"
              />
            </Link>
            <p className="mt-2 text-sm text-zinc-600">
              Luxury real estate photography. MLS-ready. 24–48h delivery.
            </p>
          </div>
          <nav className="flex flex-wrap gap-6">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-zinc-600 hover:text-zinc-900"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="mt-8 border-t border-zinc-200 pt-8 text-center text-sm text-zinc-500">
          © {new Date().getFullYear()} BrosStudio. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
