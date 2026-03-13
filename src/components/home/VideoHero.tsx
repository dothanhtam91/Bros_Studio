"use client";

import { IconCamera } from "./icons";

export function VideoHero() {
  return (
    <section className="relative flex min-h-[85vh] items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900" />
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-70"
        autoPlay
        muted
        loop
        playsInline
        poster="/hero-poster.jpg"
        aria-hidden
      >
        <source src="/Hero-video.mov" type="video/quicktime" />
        <source src="/Hero-video.mp4" type="video/mp4" />
      </video>
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
        aria-hidden
      />
      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <p className="animate-fade-in-up text-sm font-medium uppercase tracking-widest text-white/90 opacity-0" style={{ animationDelay: "0.1s" }}>
          Houston Real Estate Photography & Video Services
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl md:text-6xl animate-fade-in-up opacity-0" style={{ animationDelay: "0.2s" }}>
          Sell Your Listings Faster and Elevate Your Brand
        </h1>
        <p className="mt-4 text-lg text-zinc-300 sm:text-xl animate-fade-in-up opacity-0" style={{ animationDelay: "0.35s" }}>
          We help Houston realtors get more listings and market them better with high-quality listing photography, drone, video, and more.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-in-up opacity-0" style={{ animationDelay: "0.5s" }}>
          <a
            href="/book"
            className="group inline-flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200/90 px-6 py-3 text-base font-semibold uppercase tracking-wide text-stone-800 shadow-xl transition hover:scale-105 hover:bg-amber-100/90 hover:shadow-2xl active:scale-100"
          >
            Book a shoot
            <span className="transition group-hover:translate-x-0.5">→</span>
          </a>
          <a
            href="/portfolio"
            className="group inline-flex items-center gap-2 rounded-xl border-2 border-amber-200/90 bg-amber-50/30 px-6 py-3 text-base font-semibold uppercase tracking-wide text-stone-800 transition hover:scale-105 hover:bg-amber-100/80 hover:border-amber-300 active:scale-100"
          >
            View services
          </a>
        </div>
      </div>
    </section>
  );
}
