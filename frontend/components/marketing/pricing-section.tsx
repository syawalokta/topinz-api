import { PricingCards } from "@/components/marketing/pricing-cards";
import { Reveal } from "@/components/marketing/reveal";
import { SectionHeading } from "@/components/marketing/section-heading";

export function PricingSection() {
  return (
    <section className="container py-20 md:py-24">
      <Reveal>
        <SectionHeading
          overline="Pricing"
          title="Simple, predictable pricing"
          description="Mulai gratis tanpa kartu kredit. Upgrade ke Premium saat trafik aplikasi Anda bertambah."
        />
      </Reveal>
      <PricingCards className="mx-auto mt-12 max-w-3xl" />
    </section>
  );
}
