'use client';

import { ShieldCheck, Sparkles, Users } from 'lucide-react';
import { AnimatedSection } from '@/components/ui/animated-section';
import { HoverCard } from '@/components/ui/hover-card-motion';

const FEATURES = [
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: 'Programmable Escrow',
    description:
      'Funds lock on job acceptance and auto-release on milestone approval. Disputes freeze funds until jurors decide — no platform middleman.',
  },
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: 'AI Capability Scoring',
    description:
      'New freelancers get instant credibility through portfolio parsing, Git analysis, and micro skill tests — no more cold-start problem.',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Community Arbitration',
    description:
      'Disputes resolve in 7 days through trust-weighted juror voting. Higher trust score = more voting power. Admin cannot overturn jury.',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto max-w-7xl space-y-10">
      <AnimatedSection
        className="mx-auto max-w-2xl space-y-3 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs uppercase tracking-[0.3em] text-dt-text-muted">
          Core Pillars
        </p>
        <h2 className="text-3xl font-semibold sm:text-4xl">
          One workspace to hire, collaborate & payout globally.
        </h2>
        <p className="text-dt-text-muted">
          Wallet-first auth, optional email pairing, and a marketplace polished
          enough to rival Fiverr — at a fraction of the cost.
        </p>
      </AnimatedSection>

      <div className="grid gap-6 md:grid-cols-3">
        {FEATURES.map((feat, idx) => (
          <AnimatedSection
            key={feat.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
          >
            <HoverCard className="glass-card flex h-full flex-col p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-dt-border bg-dt-surface text-dt-text">
                {feat.icon}
              </div>
              <h3 className="text-xl font-semibold">{feat.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-dt-text-muted">
                {feat.description}
              </p>
            </HoverCard>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
