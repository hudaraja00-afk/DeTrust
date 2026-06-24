'use client';

import { useEffect, useState } from 'react';
import { AnimatedSection } from '@/components/ui/animated-section';
import { publicApi } from '@/lib/api';
import type { PublicStats } from '@/lib/api';

/* Fallback values shown while the API loads or if the call fails */
const FALLBACK: PublicStats = {
  escrowVolume: 5_200_000,
  medianHireTimeHours: 36,
  avgTrustScore: 94,
  platformFeePercent: '1–3%',
  totalFreelancers: 0,
  completedContracts: 0,
};

function formatVolume(cents: number): string {
  if (cents >= 1_000_000) return `$${(cents / 1_000_000).toFixed(1)}M+`;
  if (cents >= 1_000) return `$${(cents / 1_000).toFixed(0)}K+`;
  return `$${cents}`;
}

function buildStatCards(s: PublicStats) {
  return [
    { value: formatVolume(s.escrowVolume), label: 'Escrow Volume', helper: 'Secured via JobEscrow smart contract' },
    { value: `${s.medianHireTimeHours}h`, label: 'Median Hire Time', helper: 'AI-matched shortlists deliver fast' },
    { value: `${s.avgTrustScore}/100`, label: 'Average Trust Score', helper: 'On-chain & AI-verified' },
    { value: s.platformFeePercent, label: 'Platform Fee', helper: 'Not the 20% you pay elsewhere' },
  ];
}

export function StatsSection() {
  const [stats, setStats] = useState<PublicStats>(FALLBACK);

  useEffect(() => {
    let cancelled = false;

    publicApi.getStats().then((res) => {
      if (!cancelled && res.data) setStats(res.data);
    }).catch(() => {/* keep fallback */});

    return () => { cancelled = true; };
  }, []);

  const cards = buildStatCards(stats);

  return (
    <section id="stats" className="mx-auto max-w-7xl py-4">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat, idx) => (
          <AnimatedSection
            key={stat.label}
            className="glass-card p-6 text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: idx * 0.08, duration: 0.5 }}
          >
            <p className="text-3xl font-bold text-brand">{stat.value}</p>
            <p className="mt-2 text-sm font-semibold uppercase tracking-widest text-dt-text">
              {stat.label}
            </p>
            <p className="mt-1 text-xs text-dt-text-muted">{stat.helper}</p>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
