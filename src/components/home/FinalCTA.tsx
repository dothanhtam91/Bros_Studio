"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

const FEATURES = [
  "Clear process",
  "Elevated presentation",
  "Confident launch",
] as const;

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

  const reveal = (delay: string, duration = "0.75s") =>
    inView
      ? {
          animation: `final-cta-reveal ${duration} cubic-bezier(0.22,1,0.36,1) ${delay} both`,
        }
      : { opacity: 0 };

  const checkPop = (index: number) =>
    inView
      ? {
          animation: `final-cta-check-pop 0.5s cubic-bezier(0.34,1.3,0.64,1) ${0.38 + index * 0.09}s both`,
        }
      : { opacity: 0, transform: "scale(0.35)" };

  return (
    <section
      ref={sectionRef}
      className="relative flex min-h-[72vh] items-center justify-center overflow-hidden py-24 font-sans sm:min-h-[78vh] sm:py-32"
      aria-labelledby="final-cta-heading"
    >
      <div className="absolute inset-0 overflow-hidden" aria-hidden>
        <div
          className="final-cta-bg-drift absolute inset-[-10%] bg-cover bg-center"
          style={{ backgroundImage: "url(/images/final-cta-bg.png)" }}
        />
      </div>

      <div
        className="absolute inset-0 bg-zinc-950/88"
        style={{
          background:
            "linear-gradient(180deg, rgba(9,9,11,0.88) 0%, rgba(9,9,11,0.92) 45%, rgba(9,9,11,0.94) 100%)",
        }}
        aria-hidden
      />

      <div
        className="final-cta-amber-pulse absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 50% 20%, rgba(180,83,9,0.12) 0%, transparent 55%)",
        }}
        aria-hidden
      />

      <div className="section-noise absolute inset-0 opacity-[0.35]" aria-hidden />

      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 text-center sm:px-6">
        <p
          className="text-[11px] font-semibold uppercase tracking-[0.26em] text-amber-500 sm:text-xs"
          style={reveal("0.04s", "0.7s")}
        >
          Ready when you are
        </p>

        <h2
          id="final-cta-heading"
          className="mt-5 text-[1.85rem] font-bold leading-[1.15] tracking-tight text-white sm:mt-6 sm:text-4xl md:text-[2.65rem] md:leading-[1.12]"
          style={reveal("0.12s", "0.8s")}
        >
          Make Your Next Listing{" "}
          <em className="font-semibold not-italic text-white/95 [font-style:italic]">Feel Effortless</em>
        </h2>

        <p
          className="mx-auto mt-6 max-w-[26rem] text-[15px] leading-relaxed text-white/85 sm:mt-7 sm:max-w-md sm:text-base"
          style={reveal("0.2s", "0.72s")}
        >
          A smooth, polished process designed to help you go from booking to launch with clarity and confidence.
        </p>

        <div
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:mt-11 sm:flex-row sm:gap-4"
          style={reveal("0.28s", "0.7s")}
        >
          <Link
            href="/login"
            className="inline-flex w-full min-w-[200px] items-center justify-center rounded-md bg-amber-500 px-8 py-3.5 text-[15px] font-semibold text-white shadow-[0_4px_24px_-4px_rgba(245,158,11,0.55),0_0_0_1px_rgba(251,191,36,0.2)] transition duration-300 ease-out hover:-translate-y-0.5 hover:bg-amber-400 hover:shadow-[0_8px_32px_-6px_rgba(245,158,11,0.5)] active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:w-auto"
          >
            Get Started
          </Link>
          <Link
            href="/portfolio"
            className="inline-flex w-full min-w-[200px] items-center justify-center rounded-md border border-white/90 bg-transparent px-8 py-3.5 text-[15px] font-semibold text-white transition duration-300 ease-out hover:-translate-y-0.5 hover:border-white hover:bg-white/[0.08] active:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:w-auto"
          >
            View Portfolio
          </Link>
        </div>

        <ul
          className="mt-14 flex flex-col items-center gap-4 sm:mt-16 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-10 sm:gap-y-3"
          style={reveal("0.34s", "0.65s")}
        >
          {FEATURES.map((label, index) => (
            <li
              key={label}
              className="flex items-center gap-2.5 text-sm text-zinc-400"
              style={reveal(`${0.36 + index * 0.07}s`, "0.6s")}
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-amber-500/35 bg-amber-500/15 text-amber-400"
                style={checkPop(index)}
                aria-hidden
              >
                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
              </span>
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
