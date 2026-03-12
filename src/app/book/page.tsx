import type { Metadata } from "next";
import { Suspense } from "react";
import { BookForm } from "@/components/book/BookForm";

export const metadata: Metadata = {
  title: "Book a shoot | BrosStudio",
  description: "Request a real estate photography shoot. Address, property type, add-ons, auto quote.",
};

export default function BookPage() {
  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Book a shoot
        </h1>
        <p className="mt-2 text-zinc-600">
          Tell us about the property. We’ll confirm and send a quote.
        </p>
        <Suspense fallback={<div className="mt-8 h-32 animate-pulse rounded-lg bg-zinc-100" />}>
          <BookForm />
        </Suspense>
      </div>
    </main>
  );
}
