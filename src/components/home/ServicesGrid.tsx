"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { IconArrowRight, IconImage, IconCamera, IconSparkles } from "./icons";

const HERO_VIDEO_POSTER = "/hero-poster.jpg";
const HERO_VIDEO_SOURCES = [
  { src: "/Hero-video.mov", type: "video/quicktime" },
  { src: "/Hero-video.mp4", type: "video/mp4" },
];

const services = [
  {
    title: "Photos",
    href: "/portfolio",
    description: "MLS-ready HDR photography that makes listings stand out.",
    action: "View portfolio",
    icon: IconImage,
    image: "/images/services-photo.jpg",
    gradient: "from-amber-100/80 via-stone-200/60 to-amber-50/80",
    video: false,
  },
  {
    title: "Listing Video",
    href: "/portfolio",
    description: "Walkthrough tours & reels.",
    action: "View portfolio",
    icon: IconCamera,
    image: null as string | null,
    gradient: "from-zinc-700/90 via-zinc-800/80 to-zinc-900/90",
    video: true,
  },
  {
    title: "Drone",
    href: "/portfolio",
    description: "Aerial photos and video for curb appeal and scale.",
    action: "View portfolio",
    icon: IconSparkles,
    image: "/images/drone-photo.jpg",
    gradient: "from-sky-200/90 via-sky-300/70 to-blue-100/80",
    video: false,
  },
  {
    title: "& More",
    href: "/portfolio",
    description: "Twilight, staging, and add-ons to close more deals.",
    action: "View portfolio",
    icon: IconSparkles,
    image: "/images/services-addons.JPG",
    gradient: "from-violet-400/40 via-amber-500/30 to-orange-600/50",
    video: false,
  },
];

function ServiceCard({
  title,
  href,
  description,
  action,
  icon: Icon,
  image,
  gradient,
  video,
}: (typeof services)[0]) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!video || !videoRef.current) return;
    const el = videoRef.current;
    el.play().catch(() => {});
  }, [video]);

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-md transition duration-200 hover:-translate-y-1 hover:border-amber-200/60 hover:shadow-xl hover:shadow-amber-500/10"
      onMouseEnter={() => video && videoRef.current?.play().catch(() => {})}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
        {image ? (
          <>
            <Image
              src={image}
              alt=""
              fill
              className="object-cover transition duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition group-hover:opacity-100" />
          </>
        ) : video ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            poster={HERO_VIDEO_POSTER}
            muted
            loop
            playsInline
            autoPlay
            aria-hidden
          >
            {HERO_VIDEO_SOURCES.map(({ src, type }) => (
              <source key={src} src={src} type={type} />
            ))}
          </video>
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}
          >
            <Icon className="h-14 w-14 text-white/90 drop-shadow-md transition group-hover:scale-110" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold tracking-tight text-zinc-900">
          {title}
        </h3>
        <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
          {description}
        </p>
        <span className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 transition group-hover:gap-2 group-hover:text-amber-900">
          {action}
          <IconArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export function ServicesGrid() {
  return (
    <section className="relative overflow-hidden bg-stone-100/80 pt-28 pb-20 sm:pt-32 sm:pb-24">
      {/* Soft transition: fade from section above */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-28 sm:h-32"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.9) 0%, rgba(250,250,249,0.5) 40%, rgba(245,245,244,0.98) 100%)",
        }}
        aria-hidden
      />
      {/* Subtle grid texture — grounded, product chapter */}
      <div
        className="section-grid-subtle absolute inset-0 opacity-60"
        aria-hidden
      />
      {/* Radial glow behind content panel */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(255,255,255,0.7) 0%, transparent 60%)",
        }}
        aria-hidden
      />
      {/* Blurred ambient shapes — depth */}
      <div
        className="pointer-events-none absolute -left-20 top-1/4 h-64 w-64 rounded-full bg-amber-200/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-1/4 h-48 w-48 rounded-full bg-stone-300/25 blur-3xl"
        aria-hidden
      />
      {/* Slightly elevated content block — services chapter */}
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-white/80 px-6 py-10 shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] backdrop-blur-[2px] sm:px-8 sm:py-12 lg:px-10">
          <header className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Real Estate Media Services
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Everything You Need to Market a Listing
            </h2>
            <p className="mt-3 text-base leading-relaxed text-zinc-600">
              Photography, video, drone, and marketing media — all in one place.
            </p>
          </header>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4 lg:gap-6">
            {services.map((service) => (
              <ServiceCard key={service.title} {...service} />
            ))}
          </div>

          <div className="mt-14 flex flex-col items-center text-center sm:mt-16">
            <Link
              href="/book"
              className="group inline-flex items-center gap-2 rounded-xl border border-amber-200/90 bg-amber-50 px-8 py-3.5 text-base font-semibold text-stone-800 shadow-sm transition hover:scale-[1.02] hover:bg-amber-100/90 hover:shadow-md active:scale-[0.98]"
            >
              Book Your Listing Shoot
              <IconArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
            </Link>
            <p className="mt-3 text-xs text-zinc-500">
              Next-day delivery available
            </p>
          </div>
        </div>
      </div>
      {/* Bottom soft fade into next section */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-20"
        style={{
          background:
            "linear-gradient(to top, rgba(244,244,244,0.9) 0%, transparent 100%)",
        }}
        aria-hidden
      />
    </section>
  );
}
