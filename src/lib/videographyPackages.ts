/** Videography offerings on the Packages page (custom quote — no fixed prices). */

export type VideographyServiceOption = {
  id: string;
  title: string;
  description: string;
  bullets?: string[];
};

export const VIDEOGRAPHY_SERVICE_OPTIONS: VideographyServiceOption[] = [
  {
    id: "youtube_walkthrough",
    title: "YouTube-style property video",
    description:
      "Long-form walkthroughs optimized for YouTube and MLS links — room-to-room flow, steady pacing, and professional polish.",
    bullets: ["Typically 2–6+ minutes", "Great for luxury listings & remote buyers"],
  },
  {
    id: "short_form_reels",
    title: "Short-form reels & social cuts",
    description:
      "Vertical and square cuts for Instagram Reels, TikTok, and Shorts — hook-driven edits that stop the scroll.",
    bullets: ["15–60s cuts", "Multiple aspect ratios on request"],
  },
  {
    id: "cinematic_listing",
    title: "Cinematic listing film",
    description:
      "High-production mood and pacing for flagship listings — music-led, brand-aligned storytelling.",
    bullets: ["Custom runtime", "Styled to your brand"],
  },
  {
    id: "agent_branding",
    title: "Agent intro & branding video",
    description:
      "On-camera or voice-over pieces that put your name and brokerage front and center alongside the property.",
    bullets: ["Headshots & b-roll coordination"],
  },
  {
    id: "aerial_video",
    title: "Aerial / drone video",
    description:
      "Exterior context, neighborhood flyovers, and dramatic establishing shots where permitted and weather allows.",
    bullets: ["FAA rules & location permitting apply"],
  },
  {
    id: "other",
    title: "Other / custom",
    description:
      "Event coverage, twilight motion, FPV, or a mixed package — tell us what you have in mind.",
  },
];

export const VIDEOGRAPHY_SERVICE_LABELS: Record<string, string> = Object.fromEntries(
  VIDEOGRAPHY_SERVICE_OPTIONS.map((o) => [o.id, o.title])
);
