'use client';

import { ReactNode, Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';

/** Dynamically import heavy RainbowKit ConnectButton */
const ConnectButton = dynamic(
  () => import('@rainbow-me/rainbowkit').then((m) => m.ConnectButton),
  { ssr: false },
);
import {
  AlertTriangle,
  BarChart3,
  Briefcase,
  CreditCard,
  Crown,
  FileText,
  Home,
  LogOut,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  Star,
  User,
  Users,
  Wallet,
  Zap,
  Activity,
  TrendingUp,
  Scale,
} from 'lucide-react';

import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';
import { useSecureObjectUrl } from '@/hooks/use-secure-object-url';
import { useLiveNotifications } from '@/hooks/use-live-notifications';
import { useSafeAccount } from '@/hooks/use-safe-account';
import { BrandMark } from '@/components/layout/brand-mark';
import { NotificationBell } from '@/components/layout/notification-bell';
import { TokenBalance } from '@/components/layout/token-balance';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { SupportWidget } from '@/components/layout/SupportWidget';
import { NotificationPermissionBanner } from '@/components/layout/NotificationPermissionBanner';

const navigation = {
  FREELANCER: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Find Jobs', href: '/jobs', icon: Search },
    { name: 'My Proposals', href: '/proposals', icon: FileText },
    { name: 'Active Contracts', href: '/contracts', icon: Briefcase },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Disputes', href: '/disputes', icon: Shield },
    { name: 'Reviews', href: '/reviews', icon: Star },
    { name: 'AI Capability', href: '/ai-capability', icon: Zap },
    { name: 'Skill Verification', href: '/skill-verification', icon: ShieldCheck },
    { name: 'Earnings', href: '/payments', icon: Wallet },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ],
  CLIENT: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Post Job', href: '/jobs/new', icon: PlusCircle },
    { name: 'My Jobs', href: '/jobs/mine', icon: Briefcase },
    { name: 'Find Talent', href: '/talent', icon: Users },
    { name: 'Active Contracts', href: '/contracts', icon: FileText },
    { name: 'Messages', href: '/messages', icon: MessageSquare },
    { name: 'Disputes', href: '/disputes', icon: Shield },
    { name: 'Reviews', href: '/reviews', icon: Star },
    { name: 'Payments', href: '/payments', icon: CreditCard },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Settings', href: '/settings', icon: Settings },
  ],
  ADMIN: [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Analytics', href: '/admin/reports', icon: BarChart3 },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Flagged Accounts', href: '/admin/flagged', icon: AlertTriangle },
    { name: 'Jobs', href: '/admin/jobs', icon: Briefcase },
    { name: 'Contracts', href: '/admin/contracts', icon: FileText },
    { name: 'Disputes', href: '/admin/disputes', icon: Shield },
    { name: 'Trust Scores', href: '/admin/trust-scores', icon: Activity },
    { name: 'Reviews', href: '/admin/reviews', icon: Star },
    { name: 'Messages', href: '/admin/messages', icon: MessageSquare },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ],
};

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isNewUser, setUser } = useAuthStore();
  const { address: connectedAddress, isConnected } = useSafeAccount();
  const isProfileRoute = pathname?.startsWith('/profile');
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Subscribe to real-time WebSocket notifications
  useLiveNotifications(user?.id);

  useEffect(() => {
    if (!user) return;
    if (!isNewUser) return;
    if (isProfileRoute) return;
    router.replace('/profile');
  }, [isNewUser, isProfileRoute, router, user]);

  // Wallet sync is handled globally by useWalletSync in providers.tsx (WalletSyncWatcher)
  
  const role = user?.role || 'FREELANCER';
  const navItems = navigation[role as keyof typeof navigation] || navigation.FREELANCER;
  const { objectUrl: secureAvatarUrl, isLoading: avatarLoading } = useSecureObjectUrl(user?.avatarUrl);
  const userInitial = useMemo(() => user?.name?.[0]?.toUpperCase?.() ?? 'P', [user?.name]);

  const handleSignOut = () => {
    logout();
    router.push('/login');
  };

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-dt-text dark:bg-[hsl(222,47%,6%)] dark:text-slate-100">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 border-r border-slate-100 bg-gradient-to-b from-white via-emerald-50/40 to-white/90 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl transition-[width] duration-300 dark:border-slate-800 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900/90 dark:shadow-[0_30px_90px_rgba(0,0,0,0.3)]',
        )}
        style={{ width: isSidebarCollapsed ? '96px' : '18rem' }}
      >
        {/* Logo */}
        <div className="flex h-20 items-center border-b border-slate-100 px-4 dark:border-slate-800">
          <BrandMark
            href={role === 'ADMIN' ? '/admin' : '/dashboard'}
            showWordmark={!isSidebarCollapsed}
            className={cn(
              'flex w-full items-center justify-start text-2xl font-semibold tracking-tight text-dt-text dark:text-slate-100',
              isSidebarCollapsed && 'justify-center'
            )}
            contentClassName={cn('gap-3', isSidebarCollapsed && 'gap-0')}
          />
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.name}
                className={cn(
                  'group flex items-center rounded-2xl px-4 py-3 text-sm font-medium transition-all',
                  isSidebarCollapsed ? 'justify-center' : 'gap-3',
                  isActive
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_10px_30px_rgba(16,185,129,0.35)]'
                    : 'text-dt-text-muted hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-400 dark:hover:bg-emerald-950/50 dark:hover:text-emerald-400'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-white' : 'text-dt-text-muted group-hover:text-emerald-500')} />
                <span
                  className={cn(
                    'whitespace-nowrap text-sm font-medium transition-all duration-200',
                    isSidebarCollapsed ? 'max-w-0 opacity-0' : 'max-w-xs opacity-100'
                  )}
                >
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="absolute inset-x-0 bottom-0 space-y-3 border-t border-slate-100 p-4 dark:border-slate-800">
          {/* Premium Badge — hidden for ADMIN (admins have no trust score) */}
          {role !== 'ADMIN' && (
            <div className={cn('rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 p-4 text-white shadow-lg', isSidebarCollapsed && 'p-2')}>
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-300" />
                {!isSidebarCollapsed && (
                  <span className="text-xs font-semibold uppercase tracking-wider">Trust Signal</span>
                )}
              </div>
              {!isSidebarCollapsed && (
                <>
                  <p className="mt-2 text-2xl font-bold">{user?.freelancerProfile?.trustScore ?? user?.clientProfile?.trustScore ?? 0}%</p>
                  <p className="text-xs text-emerald-100">{role === 'FREELANCER' ? 'Freelancer Score' : 'Client Score'}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-dt-surface/20">
                    <div 
                      className="h-full rounded-full bg-dt-surface/90 transition-all" 
                      style={{ width: `${user?.freelancerProfile?.trustScore ?? user?.clientProfile?.trustScore ?? 0}%` }}
                    />
                  </div>
                </>
              )}
            </div>
          )}
          <button
            onClick={handleSignOut}
            className={cn(
              'flex w-full items-center rounded-2xl border border-dt-border bg-dt-surface px-4 py-3 text-sm font-medium text-dt-text-muted transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-red-900 dark:hover:bg-red-950/50 dark:hover:text-red-400',
              isSidebarCollapsed ? 'justify-center' : 'gap-3'
            )}
          >
            <LogOut className="h-5 w-5" />
            {!isSidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div
        className="transition-[padding] duration-300"
        style={{ paddingLeft: isSidebarCollapsed ? '96px' : '18rem' }}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-20 items-center justify-between border-b border-slate-100 bg-dt-surface/90 px-6 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          {/* Search */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                toggleSidebar();
              }}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-dt-border bg-dt-surface text-dt-text-muted shadow-sm transition hover:border-emerald-200 hover:text-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-emerald-800 dark:hover:text-emerald-400"
              aria-label="Toggle sidebar"
              aria-pressed={isSidebarCollapsed}
            >
              {isSidebarCollapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
            <div className="relative w-[280px] md:w-[360px]">
              <input
                type="search"
                placeholder="Search..."
                aria-label="Search"
                className="w-full rounded-2xl border border-dt-border bg-dt-surface px-4 py-3 pl-12 text-sm text-dt-text placeholder:text-dt-text-muted focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-emerald-600 dark:focus:ring-emerald-900/40"
              />
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-dt-text-muted" />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Token Balance */}
            <TokenBalance />

            {/* Notifications */}
            <NotificationBell />

            {/* Wallet */}
            <ConnectButton
              showBalance={false}
              chainStatus="icon"
              accountStatus="avatar"
            />

            {/* User menu */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-semibold text-dt-text dark:text-slate-100">{user?.name || 'User'}</div>
                <div className="text-xs text-dt-text-muted capitalize dark:text-slate-400">
                  {role.toLowerCase()}
                  {isNewUser && !isProfileRoute ? ' · complete profile' : ''}
                </div>
              </div>
              <div className="h-11 w-11 overflow-hidden rounded-full border-2 border-emerald-200 bg-emerald-50 ring-2 ring-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:ring-emerald-900">
                {secureAvatarUrl ? (
                  <Image
                    src={secureAvatarUrl}
                    alt={user?.name || 'User'}
                    width={44}
                    height={44}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-emerald-500">
                    {avatarLoading ? <Zap className="h-5 w-5 animate-pulse" /> : userInitial}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Notification permission prompt */}
        <NotificationPermissionBanner />

        {/* Page content */}
        <main id="main-content" className="min-h-[calc(100vh-5rem)] p-8">
          <Suspense fallback={
            <div className="flex min-h-[50vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
            </div>
          }>
            {children}
          </Suspense>
        </main>
      </div>

      {/* Floating customer support widget */}
      <SupportWidget />
    </div>
  );
}
