import { SiteHeader } from '@/components/layout/site-header';
import { SiteFooter } from '@/components/layout/site-footer';
import {
  HeroSection,
  StatsSection,
  FeaturesSection,
  HowItWorksSection,
  TalentSection,
  TestimonialsSection,
  CtaSection,
} from '@/components/landing';

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-screen w-full flex-col gap-16 px-4 py-6 sm:px-8 lg:px-16 xl:px-24">
      <SiteHeader />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TalentSection />
      <TestimonialsSection />
      <CtaSection />
      <SiteFooter />
    </main>
  );
}
