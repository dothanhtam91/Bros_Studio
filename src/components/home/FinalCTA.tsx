"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { IconArrowRight } from "./icons";

export function FinalCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold: 0.12 }
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[65vh] items-center justify-center overflow-hidden py-24 sm:min-h-[70vh] sm:py-28"
      aria-labelledby="final-cta-heading"
    >
      {/* Background image — full bleed, real estate atmosphere */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url(/images/final-cta-bg.png)",
        }}
        aria-hidden
      />

      {/* Subtle dark overlay — preserves image, improves readability */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.32) 0%, rgba(0,0,0,0.42) 50%, rgba(0,0,0,0.48) 100%)",
        }}
        aria-hidden
      />

      {/* Focused vignette behind card — card area stands out naturally */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 70% at 50% 48%, transparent 0%, transparent 45%, rgba(0,0,0,0.25) 100%)`,
        }}
        aria-hidden
      />

      {/* Soft warm glow behind card — brand tie-in, very subtle */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <div
          className="h-[340px] w-full max-w-[560px] rounded-[48px] opacity-0 transition-opacity duration-700"
          style={{
            background: "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(251,191,36,0.12) 0%, transparent 70%)",
            opacity: inView ? 1 : 0,
          }}
        />
      </div>

      {/* CTA card — integrated, premium, not popup-like */}
      <div
        className="relative z-10 w-full px-4 sm:px-6"
        style={{
          opacity: inView ? 1 : 0,
          transform: inView ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.6s cubic-bezier(0.22,1,0.36,1), transform 0.6s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        <div
          className="group mx-auto w-full max-w-[520px] rounded-[44px] border border-white/25 px-8 py-10 shadow-2xl transition-all duration-500 ease-out sm:px-10 sm:py-12 hover:-translate-y-1 hover:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.35),0_0_0_1px_rgba(255,255,255,0.08)]"
          style={{
            background:
              "linear-gradient(165deg, rgba(255,252,248,0.52) 0%, rgba(250,247,242,0.48) 50%, rgba(245,242,238,0.52) 100%)",
            backdropFilter: "blur(20px) saturate(1.1)",
            WebkitBackdropFilter: "blur(20px) saturate(1.1)",
            boxShadow:
              "0 24px 48px -16px rgba(0,0,0,0.28), 0 0 0 1px rgba(255,255,255,0.12)",
          }}
        >
          <div className="mx-auto max-w-[400px] text-center">
            {/* Eyebrow — small, refined, premium */}
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-600/90"
              style={
                inView
                  ? { animation: "final-cta-reveal 0.6s cubic-bezier(0.22,1,0.36,1) 0.06s both" }
                  : { opacity: 0 }
              }
            >
              READY WHEN YOU ARE
            </p>

            {/* Headline — bold, confident */}
            <h2
              id="final-cta-heading"
              className="mt-4 text-[1.75rem] font-bold leading-[1.2] tracking-tight text-zinc-900 sm:text-[2rem]"
              style={
                inView
                  ? { animation: "final-cta-reveal 0.6s cubic-bezier(0.22,1,0.36,1) 0.12s both" }
                  : { opacity: 0 }
              }
            >
              Make Your Next Listing Feel Effortless
            </h2>

            {/* Body — clean, readable */}
            <p
              className="mt-5 text-[15px] leading-relaxed text-zinc-600"
              style={
                inView
                  ? { animation: "final-cta-reveal 0.6s cubic-bezier(0.22,1,0.36,1) 0.2s both" }
                  : { opacity: 0 }
              }
            >
              A smooth, polished process designed to help you go from booking to launch with clarity and confidence.
            </p>

            {/* Buttons */}
            <div
              className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4"
              style={
                inView
                  ? { animation: "final-cta-reveal 0.6s cubic-bezier(0.22,1,0.36,1) 0.28s both" }
                  : { opacity: 0 }
              }
            >
              <Link
                href="/login"
                className="group/btn inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-[15px] font-semibold text-white transition-all duration-300 ease-out hover:bg-amber-600 hover:shadow-lg hover:shadow-amber-500/30 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-[#f5f3ee]"
                style={{
                  boxShadow: "0 4px 14px -2px rgba(180,83,9,0.35)",
                }}
              >
                Get Started
                <IconArrowRight className="h-4 w-4 transition-transform duration-200 group-hover/btn:translate-x-0.5" />
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex w-fit items-center justify-center rounded-xl border border-zinc-300/80 bg-white/50 px-7 py-3.5 text-[15px] font-semibold text-zinc-800 transition-all duration-200 hover:border-zinc-400/90 hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-zinc-300/60 focus:ring-offset-2 focus:ring-offset-[#f5f3ee]"
              >
                View Portfolio
              </Link>
            </div>

            {/* Proof line — smaller, cleaner */}
            <p
              className="mt-6 text-[11px] font-medium tracking-wide text-zinc-500"
              style={
                inView
                  ? { animation: "final-cta-reveal 0.6s cubic-bezier(0.22,1,0.36,1) 0.36s both" }
                  : { opacity: 0 }
              }
            >
              Clear process • Elevated presentation • Confident launch
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
