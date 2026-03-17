import { VideoHero } from "@/components/home/VideoHero";
import { ServicesGrid } from "@/components/home/ServicesGrid";
import { ValueProps } from "@/components/home/ValueProps";
import { AboutSection } from "@/components/home/AboutSection";
import { AIToolsSection } from "@/components/home/AIToolsSection";
import { TestimonialStrip } from "@/components/home/TestimonialStrip";
import { FinalCTA } from "@/components/home/FinalCTA";

export default function HomePage() {
  return (
    <main className="pt-16">
      <VideoHero />
      <ValueProps />
      <ServicesGrid />
      <AboutSection />
      <AIToolsSection />
      <TestimonialStrip />
      <FinalCTA />
    </main>
  );
}
