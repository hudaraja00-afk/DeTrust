import { ReactNode } from 'react';
import Link from 'next/link';

import { BrandMark } from '@/components/layout/brand-mark';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { AnimatedSection } from '@/components/ui/animated-section';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-dt-base px-4 py-6 text-dt-text sm:px-6 lg:flex-row lg:px-12 lg:py-12">
      <AnimatedSection
        className="flex-1"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <BrandMark />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/" className="text-sm text-dt-text-muted transition hover:text-dt-text">
              Back to site
            </Link>
          </div>
        </div>
        <div className="mt-10 flex items-center justify-center lg:mt-16">
          <div className="w-full max-w-xl rounded-2xl border border-dt-border bg-dt-surface p-8">
            {children}
          </div>
        </div>
      </AnimatedSection>

      <aside className="relative mt-12 hidden w-full max-w-md flex-col justify-between gap-10 overflow-hidden rounded-[28px] border border-dt-border p-8 text-dt-text-muted lg:mt-0 lg:ml-12 lg:flex">
        <div className="space-y-6">
          <p className="text-xs uppercase tracking-[0.4em] text-dt-text-muted">How it works</p>
          <h2 className="text-2xl font-semibold text-dt-text">Dual-factor authentication for Web3.</h2>
          <p>
            Your wallet proves ownership. Your email ensures continuity. Together they create a secure, recoverable identity that works across devices.
          </p>
          <div className="rounded-2xl border border-dt-border p-6 text-sm text-dt-text-muted">
            <ul className="space-y-4">
              <li>
                <span className="font-semibold text-dt-text">1. Connect wallet</span> — Sign with MetaMask or any WalletConnect wallet to prove identity.
              </li>
              <li>
                <span className="font-semibold text-dt-text">2. Verify email</span> — Add your email for notifications and account recovery.
              </li>
              <li>
                <span className="font-semibold text-dt-text">3. Optional KYC</span> — Enable identity verification to unlock contracts ≥$25k.
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-dt-border p-6 text-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-dt-text-muted">Why DeTrust?</p>
          <blockquote className="text-lg font-medium text-dt-text">
            "Finally, a freelance platform where I own my reputation and pay under 3% in fees."
          </blockquote>
          <p className="text-dt-text-muted">— Sarah K., Smart Contract Developer</p>
        </div>
      </aside>
    </div>
  );
}
