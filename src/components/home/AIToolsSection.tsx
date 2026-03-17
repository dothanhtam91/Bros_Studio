"use client";

import { useRef, useState, useEffect } from "react";
import { IconCpu, IconLayers } from "./icons";

const FEATURES = [
  {
    id: "listing-description",
    title: "AI Listing Description",
    line: "MLS-ready copy from property details.",
    icon: "pen",
    comingSoon: false,
  },
  {
    id: "flyer",
    title: "Branded Flyer Creator",
    line: "Just Listed & open house flyers with your branding.",
    icon: "flyer",
    comingSoon: true,
  },
  {
    id: "caption",
    title: "Social Caption Generator",
    line: "Ready-to-post captions for Instagram & Facebook.",
    icon: "caption",
    comingSoon: false,
  },
  {
    id: "assistant",
    title: "AI Marketing Assistant",
    line: "One shoot → listing copy, flyer, social post.",
    icon: "assistant",
    comingSoon: true,
  },
] as const;

const EXAMPLES = {
  "listing-description": {
    label: "Example output",
    content: (
      <blockquote className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <p className="text-[15px] leading-relaxed text-zinc-700">
        Beautifully maintained home with attractive curb appeal, elegant exterior lighting, and a welcoming front elevation. This property features a spacious driveway, manicured landscaping, and a clean, polished presentation that creates a strong first impression. A wonderful opportunity for buyers seeking a home with warmth, style, and standout exterior charm.
        </p>
      </blockquote>
    ),
  },
  flyer: {
    label: "Example output",
    content: (
      <div className="rounded-2xl border border-amber-200/50 bg-white p-5 shadow-sm">
        <div className="flex gap-4">
          <div className="h-28 w-32 shrink-0 overflow-hidden rounded-xl bg-zinc-200" aria-hidden />
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <p className="text-xl font-semibold text-zinc-800">Just Listed</p>
            <p className="mt-1 text-xs text-zinc-500">Property photo · Your name · Logo · Contact</p>
            <p className="mt-3 text-[11px] font-medium uppercase tracking-wider text-amber-700/90">Your branding</p>
          </div>
        </div>
      </div>
    ),
  },
  caption: {
    label: "Example output",
    content: (
      <blockquote className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm">
        <div className="space-y-4 text-[15px] leading-relaxed text-zinc-700">
          <p>Just listed and ready to impress ✨</p>
          <p>This beautiful home makes a strong first impression with its warm exterior lighting, clean architectural lines, and inviting curb appeal. A property like this deserves marketing that feels just as elevated.</p>
          <p>📍 Houston, TX</p>
          <p>📩 Message me for details or to schedule a private showing.</p>
          <p className="text-zinc-600">#JustListed #HoustonRealEstate #LuxuryListing #RealtorMarketing #DreamHome #HouseHunting #ListingLaunch #CurbAppeal</p>
        </div>
      </blockquote>
    ),
  },
  assistant: {
    label: "Example workflow",
    content: (
      <div className="flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-zinc-200/80 bg-white py-8 px-6 shadow-sm">
        <span className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-700">Photos</span>
        <span className="text-zinc-400" aria-hidden>→</span>
        <span className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-700">Listing Copy</span>
        <span className="text-zinc-400" aria-hidden>→</span>
        <span className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-700">Flyer</span>
        <span className="text-zinc-400" aria-hidden>→</span>
        <span className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-medium text-zinc-700">Social Post</span>
      </div>
    ),
  },
} as const;

function ToolIcon({
  icon,
  className,
}: {
  icon: (typeof FEATURES)[number]["icon"];
  className?: string;
}) {
  const c = className ?? "h-4 w-4";
  if (icon === "pen") {
    return (
      <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
    );
  }
  if (icon === "flyer") return <IconLayers className={c} />;
  if (icon === "caption") {
    return (
      <svg className={c} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
  }
  if (icon === "assistant") return <IconCpu className={c} />;
  return null;
}

export function AIToolsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [activeId, setActiveId] = useState<string>(FEATURES[0].id);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold: 0.08 }
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setRevealed(true), 80);
    return () => clearTimeout(t);
  }, [inView]);

  const example = EXAMPLES[activeId as keyof typeof EXAMPLES] ?? EXAMPLES["listing-description"];
  const activeFeature = FEATURES.find((f) => f.id === activeId);
  const isComingSoon = activeFeature?.comingSoon ?? false;

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden py-[110px]"
      aria-labelledby="ai-tools-heading"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #fafafa 0%, #f5f5f5 50%, #f8f8f8 100%)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 60% 50% at 70% 50%, rgba(253,230,180,0.12) 0%, transparent 55%)",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[40%_1fr] lg:gap-16">
          {/* Left: section title + specific features list */}
          <div className="flex flex-col">
            <p
              className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700/90"
              style={{
                opacity: revealed ? 1 : 0,
                transform: revealed ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.45s ease-out, transform 0.45s ease-out",
              }}
            >
              AI Tools for Modern Realtors
            </p>
            <h2
              id="ai-tools-heading"
              className="mt-3 text-3xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-4xl"
              style={{
                opacity: revealed ? 1 : 0,
                transform: revealed ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.45s ease-out 0.05s, transform 0.45s ease-out 0.05s",
              }}
            >
              More Than Media — Built-In AI Tools for Realtors
            </h2>
            <p
              className="mt-3 text-base leading-relaxed text-zinc-600"
              style={{
                opacity: revealed ? 1 : 0,
                transform: revealed ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.45s ease-out 0.1s, transform 0.45s ease-out 0.1s",
              }}
            >
              Smart tools that help agents market faster and look more professional.
            </p>

            <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Features
            </p>
            <div className="mt-3 flex flex-col gap-3.5">
              {FEATURES.map((tool, i) => {
                const isActive = activeId === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    className="group relative flex items-center gap-4 rounded-[22px] border bg-white/70 px-4 py-4 text-left transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-200/60 hover:bg-white hover:shadow-md hover:shadow-amber-500/5 focus:outline-none focus:ring-2 focus:ring-amber-300/40 focus:ring-offset-2 focus:ring-offset-[#f5f5f5]"
                    style={{
                      minHeight: 88,
                      borderColor: isActive ? "rgba(251,191,36,0.5)" : "rgba(0,0,0,0.06)",
                      boxShadow: isActive ? "0 4px 20px rgba(251,191,36,0.08)" : "none",
                      opacity: revealed ? 1 : 0,
                      transform: revealed ? "translateY(0)" : "translateY(10px)",
                      transition: "opacity 0.45s ease-out, transform 0.45s ease-out, border-color 0.28s, box-shadow 0.28s",
                      transitionDelay: revealed ? `${0.14 + i * 0.05}s` : "0s",
                    }}
                    onMouseEnter={() => setActiveId(tool.id)}
                    onClick={() => setActiveId(tool.id)}
                  >
                    {tool.comingSoon && (
                      <span className="absolute right-3 top-3 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
                        Coming soon
                      </span>
                    )}
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-amber-700 transition-colors duration-280 ${
                        isActive ? "border-amber-300/70 bg-amber-50" : "border-amber-200/50 bg-amber-50/60"
                      }`}
                    >
                      <ToolIcon icon={tool.icon} className="h-4 w-4" />
                    </div>
                    <div className={`min-w-0 flex-1 ${tool.comingSoon ? "pr-16" : ""}`}>
                      <p className="font-semibold text-zinc-900" style={{ fontSize: 17 }}>
                        {tool.title}
                      </p>
                      <p className="mt-0.5 text-zinc-500" style={{ fontSize: 13, lineHeight: 1.35 }}>
                        {tool.line}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: example pop-up area — only the example work appears here */}
          <div className="flex min-h-[420px] items-center lg:min-h-[480px]">
            <div
              className="w-full rounded-[30px] border border-white/90 bg-white/90 p-8 shadow-xl shadow-amber-500/[0.06] backdrop-blur-sm"
              style={{
                minHeight: 420,
                opacity: revealed ? 1 : 0,
                transform: revealed ? "translateY(0)" : "translateY(12px)",
                transition: "opacity 0.5s ease-out 0.1s, transform 0.5s ease-out 0.1s",
              }}
            >
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                {example.label}
              </p>
              {isComingSoon && (
                <p className="mb-3 text-xs font-medium text-amber-700/90">Coming soon</p>
              )}
              <div
                key={activeId}
                className="animate-ai-example-pop"
              >
                {example.content}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
