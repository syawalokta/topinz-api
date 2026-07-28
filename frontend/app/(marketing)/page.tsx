import { Hero } from "@/components/marketing/hero";
import { StatsStrip } from "@/components/marketing/stats-strip";
import { CodePreview } from "@/components/marketing/code-preview";
import { Features } from "@/components/marketing/features";
import { PricingSection } from "@/components/marketing/pricing-section";
import { DocsPreview } from "@/components/marketing/docs-preview";
import { FaqSection } from "@/components/marketing/faq";
import { FinalCta } from "@/components/marketing/final-cta";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <CodePreview />
      <Features />
      <PricingSection />
      <DocsPreview />
      <FaqSection />
      <FinalCta />
    </>
  );
}
