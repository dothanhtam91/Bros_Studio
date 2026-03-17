"use client";

import { useRef, useState, useEffect } from "react";
import { IconCalendar, IconCamera, IconCpu, IconZap } from "./icons";

const STEPS = [
  {
    step: "01",
    title: "Book Instantly",
    description: "Book online, no back-and-forth.",
    icon: IconCalendar,
  },
  {
    step: "02",
    title: "Shoot With Confidence",
    description: "Professional shoots, consistent quality.",
    icon: IconCamera,
  },
  {
    step: "03",
    title: "AI-Powered Workflow",
    description: "Streamline delivery, files, and updates.",
    icon: IconCpu,
  },
  {
    step: "04",
    title: "Deliver Faster",
    description: "Polished assets—listings go live sooner.",
    icon: IconZap,
  },
];

const STEP_DELAYS = ["0.12s", "0.2s", "0.28s", "0.36s"];

export function ValueProps() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
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
      { threshold: 0.1, rootMargin: "0px 0px -50px 0px" }
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-y border-zinc-200/80 bg-white py-12 sm:py-14"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="text-center">
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500"
            style={
              inView
                ? { animation: "value-props-reveal 0.55s ease-out 0ms both" }
                : { opacity: 0 }
            }
          >
            Why Realtors Choose BrosStudio
          </p>
          <h2
            className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl"
            style={
              inView
                ? { animation: "value-props-reveal 0.55s ease-out 0.08s both" }
                : { opacity: 0 }
            }
          >
            Smarter media, start to finish
          </h2>
          <p
            className="mx-auto mt-1.5 max-w-lg text-sm text-zinc-600"
            style={
              inView
                ? { animation: "value-props-reveal 0.55s ease-out 0.16s both" }
                : { opacity: 0 }
            }
          >
            Premium media plus AI workflow tools—move faster, stay organized.
          </p>
        </header>

        {/* Compact horizontal strip — 4 items in one row */}
        <div className="mt-8 sm:mt-10">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className="group flex items-start gap-3 rounded-xl border border-zinc-200/70 bg-zinc-50/50 px-4 py-3.5 transition-all duration-300 ease-out hover:-translate-y-1 hover:border-amber-200/80 hover:bg-amber-50/30 hover:shadow-md hover:shadow-amber-950/5 sm:py-4"
                  style={
                    inView
                      ? {
                          animation: `workflow-step-reveal 0.5s ease-out ${STEP_DELAYS[i]} both`,
                        }
                      : { opacity: 0 }
                  }
                >
                  <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm ring-1 ring-zinc-200/80 transition-transform duration-300 group-hover:scale-110 group-hover:ring-amber-200/60">
                    <Icon className="h-4 w-4 transition-transform duration-300 group-hover:scale-105" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      {item.step}
                    </p>
                    <h3 className="font-semibold tracking-tight text-zinc-900 text-[15px]">
                      {item.title}
                    </h3>
                    <p className="mt-0.5 text-xs leading-snug text-zinc-600">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
