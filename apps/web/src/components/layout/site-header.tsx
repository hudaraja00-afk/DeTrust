"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { useState } from 'react';

import { BrandMark } from './brand-mark';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Talent', href: '#talent' },
  { label: 'Testimonials', href: '#testimonials' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/register');

  const links = (
    <nav className="flex flex-col gap-6 text-lg text-dt-text-muted md:flex-row md:items-center md:text-sm">
      {NAV_LINKS.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="group relative transition-colors duration-200 hover:text-dt-text"
          onClick={() => setMobileOpen(false)}
        >
          {item.label}
          <span className="absolute -bottom-1 left-0 h-px w-0 bg-gradient-to-r from-emerald-400 to-sky-400 transition-all duration-300 group-hover:w-full" />
        </a>
      ))}
    </nav>
  );

  return (
    <header className="relative z-30 flex w-full items-center justify-between rounded-3xl border border-dt-border bg-dt-surface/90 px-4 py-3 text-sm shadow-sm backdrop-blur md:px-6">
      <div className="flex items-center gap-8">
        <BrandMark />
        <div className="hidden gap-6 md:flex">{links}</div>
      </div>

      <div className="hidden items-center gap-3 md:flex">
        <ThemeToggle />
        {!isAuthPage && (
          <Link href="/login" className="btn-ghost">
            Sign in
          </Link>
        )}
        <Link href="/register" className="btn-primary">
          Get started
        </Link>
      </div>

      <button
        className="md:hidden"
        aria-label="Toggle navigation"
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        <Menu className="h-6 w-6 text-dt-text" />
      </button>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="absolute left-0 right-0 top-full mt-3 rounded-3xl border border-dt-border bg-dt-surface p-6 shadow-2xl md:hidden"
        >
          <div className="flex flex-col gap-6">
            {links}
            <ThemeToggle className="self-start" />
            <div className="flex flex-col gap-4">
              {!isAuthPage && (
                <Link href="/login" className="btn-secondary" onClick={() => setMobileOpen(false)}>
                  Sign in
                </Link>
              )}
              <Link href="/register" className="btn-primary" onClick={() => setMobileOpen(false)}>
                Get started
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
}
