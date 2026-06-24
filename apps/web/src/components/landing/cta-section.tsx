'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { AnimatedSection } from '@/components/ui/animated-section';

export function CtaSection() {
  return (
    <section className="mx-auto max-w-7xl">
      <AnimatedSection
        className="relative overflow-hidden rounded-[32px] border border-dt-border bg-dt-surface p-10 text-center shadow-[0_35px_120px_rgba(15,23,42,0.1)] dark:shadow-[0_35px_120px_rgba(0,0,0,0.25)]"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid-overlay absolute inset-4 rounded-[28px] opacity-50" />

        <div className="relative z-10">
          <p className="text-xs uppercase tracking-[0.4em] text-dt-text-muted">
            Ready to start?
          </p>
          <h3 className="mt-3 text-3xl font-semibold sm:text-4xl">
            Join the trustless freelance revolution.
          </h3>
          <p className="mt-3 text-dt-text-muted">
            Connect your wallet. Build your reputation. Keep your earnings.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/register?role=freelancer" className="btn-primary text-base">
              Join as Freelancer <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link href="/register?role=client" className="btn-secondary text-base">
              Hire Elite Talent
            </Link>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
