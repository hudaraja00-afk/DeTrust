'use client';

import { Wallet, UserCircle, FileSearch, Banknote } from 'lucide-react';
import { AnimatedSection } from '@/components/ui/animated-section';

const STEPS = [
  {
    icon: <Wallet className="h-5 w-5" />,
    number: '01',
    title: 'Connect Wallet',
    description: 'Sign in with MetaMask or any WalletConnect-compatible wallet. Optional email pairing for notifications.',
  },
  {
    icon: <UserCircle className="h-5 w-5" />,
    number: '02',
    title: 'Complete Profile',
    description: 'Choose Client or Freelancer role. Fill modular onboarding — rates, portfolio, skills, optional KYC.',
  },
  {
    icon: <FileSearch className="h-5 w-5" />,
    number: '03',
    title: 'Match & Contract',
    description: 'Browse AI-ranked jobs or talent. Submit proposals, negotiate milestones, and sign on-chain contracts.',
  },
  {
    icon: <Banknote className="h-5 w-5" />,
    number: '04',
    title: 'Deliver & Get Paid',
    description: 'Submit milestone work. Client approves or auto-release triggers in 7 days. Funds flow instantly from escrow.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mx-auto max-w-7xl space-y-10">
      <AnimatedSection
        className="mx-auto max-w-2xl space-y-3 text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-xs uppercase tracking-[0.3em] text-dt-text-muted">
          How It Works
        </p>
        <h2 className="text-3xl font-semibold sm:text-4xl">
          From wallet connect to payout in four steps.
        </h2>
      </AnimatedSection>

      <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Connecting line (desktop only) */}
        <div
          className="absolute left-[12.5%] right-[12.5%] top-10 hidden h-px lg:block"
          style={{
            background:
              'linear-gradient(90deg, transparent, hsl(var(--brand-primary)) 20%, hsl(var(--brand-primary)) 80%, transparent)',
            opacity: 0.25,
          }}
        />

        {STEPS.map((step, idx) => (
          <AnimatedSection
            key={step.number}
            className="relative flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
          >
            {/* Number circle */}
            <div className="relative z-10 mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-dt-border bg-dt-surface shadow-md">
              <span className="text-sm font-bold text-brand">{step.number}</span>
            </div>

            <div className="mb-2 flex items-center gap-2 text-dt-text-muted">
              {step.icon}
            </div>

            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="mt-2 max-w-[240px] text-sm leading-relaxed text-dt-text-muted">
              {step.description}
            </p>
          </AnimatedSection>
        ))}
      </div>
    </section>
  );
}
