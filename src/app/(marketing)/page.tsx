import type { Metadata } from "next";
import { Faq } from "@/features/marketing/components/faq";
import { Features } from "@/features/marketing/components/features";
import { FinalCta } from "@/features/marketing/components/final-cta";
import { Hero } from "@/features/marketing/components/hero";
import { HowItWorks } from "@/features/marketing/components/how-it-works";
import { PricingPreview } from "@/features/marketing/components/pricing-preview";
import { UseCases } from "@/features/marketing/components/use-cases";

// Title, description, Open Graph and Twitter tags come from the root layout
// defaults (which describe the home page); only the canonical URL is added.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <UseCases />
      <PricingPreview />
      <Faq />
      <FinalCta />
    </>
  );
}
