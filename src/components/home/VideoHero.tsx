"use client";

import Link from "next/link";
import { IconArrowRight, IconClock, IconShieldCheck, IconSparkles } from "./icons";

const HERO_STATS = [
  { value: "800+", label: "Homes Captured" },
  { value: "AI", label: "Marketing Tools" },
  { value: "40+", label: "Realtors Served" },
];

const TRUST_ITEMS = [
  { icon: IconClock, text: "Fast turnaround" },
  { icon: IconSparkles, text: "MLS ready" },
  { icon: IconShieldCheck, text: "Houston based" },
];

export function VideoHero() {
  return (
    <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden">
      {/* Video with Ken Burns */}
      <div className="absolute inset-0" aria-hidden>
        <div className="absolute inset-0 animate-ken-burns">
          <video
            className="h-full w-full object-cover"
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
        </div>
      </div>
      {/* Cinematic gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.75))",
        }}
        aria-hidden
      />
      {/* Content */}
      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center px-4 pt-20 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-[700px] text-center">
          <p
            className="animate-fade-in-up text-xs font-semibold uppercase tracking-widest text-white/90 opacity-0"
            style={{ animationDelay: "0.1s" }}
          >
            Houston Real Estate Media
          </p>
          <h1
            className="mt-4 animate-fade-in-up text-4xl font-bold tracking-tight text-white drop-shadow-md opacity-0 sm:text-5xl md:text-6xl"
            style={{ animationDelay: "0.2s" }}
          >
            Sell Your Listings Faster and Elevate Your Brand
          </h1>
          <p
            className="mt-2 animate-fade-in-up text-xl font-medium tracking-tight text-white/95 opacity-0 sm:text-2xl"
            style={{ animationDelay: "0.25s" }}
          >
            Premium photography, video, drone, and AI marketing tools built for realtors.
          </p>
          <div
            className="mt-7 flex flex-col items-center gap-4 animate-fade-in-up opacity-0 sm:flex-row sm:justify-center sm:gap-5"
            style={{ animationDelay: "0.5s" }}
          >
            <Link
              href="/book"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-7 py-3.5 text-base font-semibold text-stone-900 shadow-lg shadow-amber-500/25 transition hover:bg-amber-300 hover:shadow-amber-500/30 hover:shadow-xl active:scale-[0.98] sm:w-auto"
            >
              Book a Shoot
              <IconArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/portfolio"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition hover:bg-white/20 hover:border-white/40 active:scale-[0.98] sm:w-auto"
            >
              See Our Work
            </Link>
          </div>
          {/* Trust row */}
          <div
            className="mt-[18px] flex flex-wrap items-center justify-center gap-6 text-white/70 animate-fade-in-up opacity-0 sm:gap-8"
            style={{ animationDelay: "0.6s" }}
          >
            {TRUST_ITEMS.map(({ icon: Icon, text }) => (
              <span key={text} className="flex items-center gap-1.5 text-sm">
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {text}
              </span>
            ))}
          </div>
        </div>
        {/* Stat cards */}
        <div
          className="mt-10 flex w-full max-w-4xl flex-wrap items-stretch justify-center gap-4 animate-fade-in-up opacity-0 sm:mt-12 sm:gap-6 sm:px-6"
          style={{ animationDelay: "0.7s" }}
        >
          {HERO_STATS.map(({ value, label }) => (
            <div
              key={label}
              className="flex min-w-[140px] flex-1 flex-col items-center justify-center rounded-2xl border border-white/15 bg-white/10 px-6 py-5 backdrop-blur-md sm:min-w-[160px] sm:py-6"
            >
              <p className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                {value}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wider text-white/80">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
