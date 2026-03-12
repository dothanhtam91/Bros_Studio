import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact | BrosStudio",
  description: "Contact BrosStudio for real estate photography in Houston.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
          Contact
        </h1>
        <p className="mt-2 text-zinc-600">
          Questions or ready to book? Send us a message.
        </p>
        <ContactForm />
      </div>
    </main>
  );
}
