'use client';

import { AnimatedSection } from '@/components/ui/animated-section';
import { HoverScale } from '@/components/ui/hover-card-motion';

const CATEGORIES = [
  'Smart Contracts',
  'DeFi & Protocols',
  'AI & Agents',
  'Product & UI',
  'Ops & Compliance',
  'Growth & GTM',
  'Security Audits',
  'Data Engineering',
];

export function TalentSection() {
  return (
    <section
      id="talent"
      className="mx-auto max-w-7xl rounded-[32px] border border-dt-border bg-dt-surface/90 p-8 shadow-[0_35px_120px_rgba(15,23,42,0.1)] dark:shadow-[0_35px_120px_rgba(0,0,0,0.25)]"
    >
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
        <AnimatedSection
          className="flex-1 space-y-4"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xs uppercase tracking-[0.4em] text-dt-text-muted">
            Curated Talent Cloud
          </p>
          <h3 className="text-3xl font-semibold">
            Tap into trust-verified specialists across high-stakes categories.
          </h3>
          <p className="text-dt-text-muted">
            Browse by trust tier, AI capability score, chain experience, or
            compliance readiness. Shortlists include wallet provenance and
            optional KYC badges.
          </p>
        </AnimatedSection>

        <AnimatedSection
          className="flex flex-1 flex-wrap gap-3"
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {CATEGORIES.map((tag) => (
            <HoverScale
              key={tag}
              className="rounded-2xl border border-dt-border bg-dt-surface px-4 py-2.5 text-sm font-medium text-dt-text-muted transition-colors hover:border-emerald-300 hover:text-dt-text dark:hover:border-emerald-700"
            >
              {tag}
            </HoverScale>
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}
