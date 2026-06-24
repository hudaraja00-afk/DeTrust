'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ShieldCheck, Eye, EyeOff } from 'lucide-react';

import { useAuthStore } from '@/store/auth.store';
import { isWalletConnectConfigured } from '@/lib/env';
import { MetaMaskPriorityConnect } from '@/components/wallet/meta-mask-priority';

export default function LoginPage() {
  const router = useRouter();

  const { login, isLoading, error, requires2FA } = useAuthStore();
  const walletReady = isWalletConnectConfigured;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    twoFactorCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Wallet enforcement lives here once SIWE is mandatory for login.

    const success = await login(
      formData.email,
      formData.password,
      requires2FA ? formData.twoFactorCode : undefined
    );

    if (success) {
      toast.success('Login successful!');
      // Admin users go to /admin dashboard; all others to /dashboard
      const { user: loggedInUser } = useAuthStore.getState();
      router.push(loggedInUser?.role === 'ADMIN' ? '/admin' : '/dashboard');
    }
  };

  return (
    <div
      className="animate-fade-in space-y-10 text-dt-text"
    >
      <div className="text-center">
        <h1 className="text-3xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-dt-text-muted">Sign in with your wallet and email</p>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-dt-border bg-dt-surface p-4">
          <p className="flex items-center gap-2 text-sm font-medium text-dt-text">
            <ShieldCheck className="h-4 w-4" /> Two-step verification required
          </p>
          <p className="mt-1 text-sm text-dt-text-muted">
            Connect your wallet to verify ownership, then sign in with email to access your account.
          </p>
        </div>
        {!walletReady && (
          <div className="rounded-2xl border border-dt-border bg-dt-surface p-4 text-sm">
            <p className="font-medium text-dt-text">Mobile wallets</p>
            <p className="mt-1 text-dt-text-muted">
              Add WalletConnect project ID to enable Rainbow, Trust Wallet, and other mobile options.
            </p>
          </div>
        )}
        <MetaMaskPriorityConnect />
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-5 rounded-2xl border border-dt-border bg-dt-surface p-6">
        <div>
          <label className="text-sm font-medium text-dt-text">Email address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="input-glass mt-2"
            placeholder="you@example.com"
            required
            disabled={requires2FA}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-dt-text">Password</label>
          <div className="relative mt-2">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="input-glass w-full pr-10"
              placeholder="••••••••"
              required
              disabled={requires2FA}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-dt-text-muted hover:text-dt-text"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {requires2FA && (
          <div>
            <label className="text-sm font-medium text-dt-text">Two-factor code</label>
            <input
              type="text"
              name="twoFactorCode"
              value={formData.twoFactorCode}
              onChange={handleInputChange}
              className="input-glass mt-2"
              placeholder="000000"
              maxLength={6}
            />
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}
        <button
          type="submit"
          className="w-full justify-center rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 font-medium text-white transition-all hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? 'Signing in…' : requires2FA ? 'Verify code' : 'Continue with email'}
        </button>
      </form>

      <div className="flex flex-col gap-3 text-center text-sm">
        <Link href="/forgot-password" className="text-dt-text-muted hover:text-dt-text transition-colors">
          Forgot your password?
        </Link>
        <p className="text-dt-text-muted">
          New to DeTrust?{' '}
          <Link href="/register" className="font-medium text-dt-text hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
