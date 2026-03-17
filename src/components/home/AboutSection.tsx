"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";

const CLIENTS = [
  {
    title: "Realtors",
    description:
      "MLS-ready photography, video, drone, and fast delivery for listings.",
  },
  {
    title: "Real Estate Teams",
    description:
      "Consistent media support for multiple listings and growing teams.",
  },
  {
    title: "Brokerages",
    description:
      "Polished brand-aligned media that supports agents at scale.",
  },
  {
    title: "Builders & Developers",
    description:
      "Premium visuals for model homes, communities, and new inventory.",
  },
  {
    title: "Airbnb & Short-Term Rentals",
    description:
      "Lifestyle-focused content that helps increase bookings.",
  },
];

const STAGGER_DELAYS = ["0.1s", "0.18s", "0.26s", "0.34s", "0.42s"];

export function AboutSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !hasStartedRef.current) {
          hasStartedRef.current = true;
          setInView(true);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-20 sm:py-28"
      style={{
        background:
          "linear-gradient(180deg, #f4f4f5 0%, #fafafa 45%, #ffffff 100%)",
      }}
    >
      {/* Top soft divider — editorial transition */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.06) 20%, rgba(0,0,0,0.06) 80%, transparent 100%)",
        }}
        aria-hidden
      />
      {/* Radial highlight — who we serve */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 30% 30%, rgba(251,191,36,0.04), transparent 55%), radial-gradient(ellipse 60% 50% at 75% 70%, rgba(250,250,250,0.8), transparent 50%)",
        }}
        aria-hidden
      />
      {/* Soft vignette edges — depth */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          boxShadow: "inset 0 0 18vmin 2vmin rgba(255,255,255,0.4)",
        }}
        aria-hidden
      />
      {/* Minimal noise — premium texture */}
      <div className="section-noise absolute inset-0" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16 lg:items-start">
          {/* Left: Intro content */}
          <div className="lg:sticky lg:top-32">
            <p
              className="text-xs font-semibold uppercase tracking-widest text-zinc-500"
              style={
                inView
                  ? {
                      animation: "who-serve-reveal 0.6s ease-out forwards",
                      animationDelay: "0ms",
                    }
                  : { opacity: 0 }
              }
            >
              Who We Serve
            </p>
            <h2
              className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl"
              style={
                inView
                  ? {
                      animation: "who-serve-reveal 0.6s ease-out forwards",
                      animationDelay: "0.08s",
                    }
                  : { opacity: 0 }
              }
            >
              Built for the people behind Houston&apos;s best listings
            </h2>
            <p
              className="mt-6 max-w-md text-base leading-relaxed text-zinc-600"
              style={
                inView
                  ? {
                      animation: "who-serve-reveal 0.6s ease-out forwards",
                      animationDelay: "0.16s",
                    }
                  : { opacity: 0 }
              }
            >
              BrosStudio works with agents, teams, brokerages, builders, and
              short-term rental hosts who need polished media, fast delivery, and
              a seamless client experience.
            </p>
          </div>

          {/* Right: Interactive client list */}
          <div className="border-t border-zinc-200/80 pt-8 sm:pt-10">
            {CLIENTS.map(({ title, description }, i) => {
              const isActive = activeIndex === i;
              return (
                <div
                  key={title}
                  className={`group relative border-b border-zinc-200/80 py-6 transition-all duration-300 ease-out sm:py-7 ${
                    isActive ? "bg-amber-50/40" : ""
                  }`}
                  style={
                    inView
                      ? {
                          animation: `who-serve-reveal 0.5s ease-out ${STAGGER_DELAYS[i]} both`,
                        }
                      : { opacity: 0 }
                  }
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {/* Active accent: soft left border + background tint */}
                  {isActive && (
                    <div
                      className="absolute inset-y-0 left-0 w-[3px] rounded-r bg-amber-400/60"
                      style={{
                        boxShadow: "0 0 20px rgba(251,191,36,0.25)",
                      }}
                    />
                  )}
                  <div
                    className={`relative pl-5 transition-all duration-300 ease-out sm:pl-6 ${
                      isActive ? "translate-x-1" : ""
                    }`}
                  >
                    <h3
                      className={`text-lg font-semibold tracking-tight transition-colors duration-200 sm:text-xl ${
                        isActive ? "text-zinc-900" : "text-zinc-800"
                      }`}
                    >
                      {title}
                    </h3>
                    <div
                      className={`grid transition-all duration-300 ease-out ${
                        isActive ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="mt-2 text-sm leading-relaxed text-zinc-600">
                          {description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div
          className="mt-14 flex justify-start"
          style={
            inView
              ? { animation: "who-serve-reveal 0.5s ease-out 0.5s both" }
              : { opacity: 0 }
          }
        >
          <Link
            href="/portfolio"
            className="group inline-flex items-center gap-2 font-semibold text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition-all duration-200 hover:decoration-amber-500/80 hover:text-amber-800"
          >
            See portfolio
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
