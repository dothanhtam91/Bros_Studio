"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { STUDIO_PORTFOLIO_CATEGORIES } from "@/lib/portfolioCategories";

const CATEGORIES = [
  { label: "All", value: null as null },
  ...STUDIO_PORTFOLIO_CATEGORIES,
] as const;

export function PortfolioFilterPills({
  currentType,
  className = "",
}: {
  currentType: string | null;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [indicator, setIndicator] = useState({ left: 0, top: 0, width: 0, height: 0, ready: false });

  const activeKey = currentType ?? "all";

  useLayoutEffect(() => {
    function measure() {
      const track = trackRef.current;
      const link = linkRefs.current.get(activeKey);
      if (!track || !link) return;
      const t = track.getBoundingClientRect();
      const l = link.getBoundingClientRect();
      setIndicator({
        left: l.left - t.left + track.scrollLeft,
        top: l.top - t.top + track.scrollTop,
        width: l.width,
        height: l.height,
        ready: true,
      });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [activeKey]);

  return (
    <nav className={className} aria-label="Filter collection">
      <div
        ref={trackRef}
        className="relative flex gap-0.5 overflow-x-auto rounded-2xl border border-zinc-200/60 bg-white/50 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-sm scrollbar-hide sm:flex-wrap sm:overflow-visible"
      >
        {indicator.ready && indicator.width > 0 && (
          <span
            className="pointer-events-none absolute rounded-[0.65rem] bg-gradient-to-b from-white to-amber-50/90 shadow-[0_2px_12px_rgba(180,83,9,0.08),0_0_0_1px_rgba(251,191,36,0.25)] transition-[left,top,width,height] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              left: indicator.left,
              top: indicator.top,
              width: indicator.width,
              height: indicator.height,
            }}
            aria-hidden
          />
        )}
        {CATEGORIES.map((cat) => {
          const key = cat.value ?? "all";
          const isActive =
            (currentType == null && cat.value == null) || currentType === cat.value;
          return (
            <Link
              key={cat.label}
              ref={(el) => {
                if (el) linkRefs.current.set(key, el);
                else linkRefs.current.delete(key);
              }}
              href={cat.value == null ? "/portfolio" : `/portfolio?type=${cat.value}`}
              scroll={false}
              className={`relative z-10 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-[13px] font-medium tracking-wide transition-all duration-200 ease-out sm:px-4 sm:text-sm ${
                isActive
                  ? "text-stone-900"
                  : "text-zinc-500 hover:bg-white/60 hover:text-zinc-800"
              }`}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
