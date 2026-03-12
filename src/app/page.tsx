import { VideoHero } from "@/components/home/VideoHero";
import { StatsStrip } from "@/components/home/StatsStrip";
import { ServicesGrid } from "@/components/home/ServicesGrid";
import { ValueProps } from "@/components/home/ValueProps";
import { TrustRow } from "@/components/home/TrustRow";
import { AboutSection } from "@/components/home/AboutSection";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { FinalCTA } from "@/components/home/FinalCTA";

export default function HomePage() {
  return (
    <main className="pt-16">
      <VideoHero />
      <StatsStrip />
      <ServicesGrid />
      <ValueProps />
      <TrustRow />
      <AboutSection />
      <TestimonialsSection />
      <FinalCTA />
    </main>
  );
}
