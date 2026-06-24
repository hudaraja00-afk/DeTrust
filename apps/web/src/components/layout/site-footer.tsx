import Link from 'next/link';
import { BrandMark } from './brand-mark';

const LINKS = [
  {
    title: 'Product',
    items: [
      { label: 'Overview', href: '/' },
      { label: 'Job Board', href: '/jobs' },
      { label: 'Trust Engine', href: '#trust' },
      { label: 'Disputes', href: '#workflow' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'About', href: '/about' },
      { label: 'Docs', href: '/docs' },
      { label: 'Careers', href: '/careers' },
      { label: 'Press', href: '/press' },
    ],
  },
  {
    title: 'Legal',
    items: [
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Security', href: '/security' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="relative mt-24 rounded-3xl border border-dt-border bg-dt-surface px-6 py-10 shadow-lg shadow-slate-100/70 dark:shadow-slate-900/30">
      <div className="grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <BrandMark href="/" />
          <p className="text-sm text-dt-text-muted">
            DeTrust blends AI capability scoring, provable escrow, and decentralized arbitration into a single workspace for serious hiring teams.
          </p>
        </div>
        {LINKS.map((group) => (
          <div key={group.title} className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-dt-text-muted">
              {group.title}
            </p>
            <ul className="space-y-2 text-sm text-dt-text-muted">
              {group.items.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="transition-colors hover:text-dt-text">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-10 border-t border-dt-border pt-6 text-xs text-dt-text-muted">
        © {new Date().getFullYear()} DeTrust. All rights reserved.
      </div>
    </footer>
  );
}
