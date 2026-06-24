'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { AnimatedSection } from '@/components/ui/animated-section';
import { publicApi } from '@/lib/api';
import type { FeaturedReview } from '@/lib/api';

/* Fallback shown while API loads or on failure */
const FALLBACK_REVIEWS: FeaturedReview[] = [
  {
    id: 'fb-1',
    overallRating: 5,
    comment:
      'DeTrust finally solved the cold-start problem. My AI capability score landed me three contracts in my first week — no portfolio begging required.',
    createdAt: new Date().toISOString(),
    author: { name: 'Alex Rivera', role: 'FREELANCER', initials: 'AR', avatarUrl: null, trustScore: 92 },
  },
  {
    id: 'fb-2',
    overallRating: 5,
    comment:
      'The escrow system is a game-changer. I funded milestones, the freelancer delivered, and payment released automatically. Zero back-and-forth.',
    createdAt: new Date().toISOString(),
    author: { name: 'Priya Sharma', role: 'CLIENT', initials: 'PS', avatarUrl: null, trustScore: 88 },
  },
  {
    id: 'fb-3',
    overallRating: 5,
    comment:
      '1-3% fees versus 20% on Upwork? Plus my trust score follows me forever on-chain. This is how freelancing should work.',
    createdAt: new Date().toISOString(),
    author: { name: 'Marcus Chen', role: 'FREELANCER', initials: 'MC', avatarUrl: null, trustScore: 95 },
  },
];

function roleLabel(role: string): string {
  const map: Record<string, string> = {
    FREELANCER: 'Freelancer',
    CLIENT: 'Client',
    ADMIN: 'Admin',
  };
  return map[role] ?? role;
}

export function TestimonialsSection() {
  const [reviews, setReviews] = useState<FeaturedReview[]>(FALLBACK_REVIEWS);

  useEffect(() => {
    let cancelled = false;

    publicApi.getFeaturedReviews(3).then((res) => {
      if (!cancelled && res.data && res.data.length > 0) setReviews(res.data);
    }).catch(() => {/* keep fallback */});

    return () => { cancelled = true; };
  }, []);

  return (
    <section id="testimonials" className="mx-auto max-w-7xl space-y-10">
      <AnimatedSection
        className="mx-auto max-w-2xl space-y-3 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs uppercase tracking-[0.3em] text-dt-text-muted">
          Trusted by Builders
        </p>
        <h2 className="text-3xl font-semibold sm:text-4xl">
          What our community says.
        </h2>
      </AnimatedSection>

      <div className="grid gap-6 md:grid-cols-3">
        {reviews.map((t, idx) => (
          <AnimatedSection
            key={t.id}
            className="glass-card flex flex-col p-6"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
          >
            {/* Stars */}
            <div className="mb-4 flex gap-1">
              {Array.from({ length: Math.round(t.overallRating) }).map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-amber-400 text-amber-400"
                />
              ))}
            </div>

            <blockquote className="flex-1 text-sm leading-relaxed text-dt-text-muted">
              &ldquo;{t.comment}&rdquo;
            </blockquote>

            {/* Author */}
            <div className="mt-6 flex items-center gap-3 border-t border-dt-border pt-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-sky-400 text-xs font-bold text-white">
                {t.author.initials}
              </div>
              <div>
                <p className="text-sm font-semibold">{t.author.name}</p>
                <p className="text-xs text-dt-text-muted">{roleLabel(t.author.role)}</p>
              </div>
              <span className="ml-auto rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400">
                {t.author.trustScore}
              </span>
            </div>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
