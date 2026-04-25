"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/", label: "Home" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/packages", label: "Packages" },
  { href: "/book", label: "Book" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { avatar_url?: string } } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return;
    }

    const supabase = createClient();
    const getSession = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u ?? null);
    };
    getSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="BrosStudio"
            width={140}
            height={36}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {nav.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-zinc-600 transition hover:text-zinc-900"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen((o) => !o)}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-zinc-100 ring-1 ring-zinc-200/60 transition hover:border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-sm font-medium text-zinc-600">
                    {user.email?.[0]?.toUpperCase() ?? "?"}
                  </span>
                )}
              </button>
              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg ring-1 ring-zinc-100">
                  <Link
                    href="/dashboard/portfolio"
                    className="block px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    My Portfolio
                  </Link>
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Account Settings
                  </Link>
                  <form action="/api/auth/signout" method="post" className="border-t border-zinc-100">
                    <button
                      type="submit"
                      className="block w-full px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Logout
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/signup"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Create account
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              >
                Login
              </Link>
            </>
          )}
          <Link
            href="/book"
            className="rounded-xl border border-amber-200/90 bg-amber-50 px-4 py-2 text-sm font-medium text-stone-800 transition hover:bg-amber-100/90"
          >
            Book a shoot
          </Link>
        </div>
      </div>
    </header>
  );
}
