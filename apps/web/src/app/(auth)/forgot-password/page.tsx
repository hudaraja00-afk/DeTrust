'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, EyeOff, CheckCircle2, ArrowLeft } from 'lucide-react';

import { authApi } from '@/lib/api/auth';

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const resetToken = searchParams.get('token');

  // ---------- EMAIL REQUEST FORM STATE ----------
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // ---------- RESET PASSWORD FORM STATE ----------
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isResetComplete, setIsResetComplete] = useState(false);

  // ---------- EMAIL REQUEST HANDLER ----------
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const response = await authApi.forgotPassword(email);
    
    setIsLoading(false);
    
    if (response.success) {
      setIsSubmitted(true);
      toast.success('Reset link sent!');
    } else {
      toast.error(response.error?.message || 'Failed to send reset link');
    }
  };

  // ---------- RESET PASSWORD HANDLER ----------
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 12) {
      toast.error('Password must be at least 12 characters');
      return;
    }

    setIsResetting(true);

    const response = await authApi.resetPassword(resetToken!, newPassword);
    
    setIsResetting(false);

    if (response.success) {
      setIsResetComplete(true);
      toast.success('Password reset successfully!');
    } else {
      toast.error(response.error?.message || 'Failed to reset password');
    }
  };

  // ========== RESET COMPLETE VIEW ==========
  if (isResetComplete) {
    return (
      <div className="w-full max-w-md">
        <div className="glass-card rounded-2xl p-8 text-center text-dt-text">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="mb-2 text-2xl font-bold">Password Reset!</h1>
          <p className="mb-6 text-dt-text-muted">
            Your password has been reset successfully. You can now sign in with your new password.
          </p>
          <Link
            href="/login"
            className="btn-primary inline-flex w-full items-center justify-center"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // ========== RESET PASSWORD FORM (when token is present) ==========
  if (resetToken) {
    return (
      <div className="w-full max-w-md">
        <div className="glass-card rounded-2xl p-8 text-dt-text">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-2xl font-bold">Set New Password</h1>
            <p className="text-dt-text-muted">
              Enter your new password below
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-dt-text-muted">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 12 chars, uppercase, lowercase, number, special"
                  className="input-glass pr-10"
                  required
                  minLength={12}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dt-text-muted hover:text-dt-text"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-dt-text-muted">
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="input-glass"
                required
                minLength={12}
              />
            </div>

            {/* Password requirements */}
            <div className="rounded-xl border border-dt-border bg-dt-surface-alt p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-dt-text-muted">Password Requirements</p>
              <ul className="space-y-1 text-xs text-dt-text-muted">
                <li className={newPassword.length >= 12 ? 'text-emerald-600' : ''}>
                  {newPassword.length >= 12 ? '✓' : '○'} At least 12 characters
                </li>
                <li className={/[A-Z]/.test(newPassword) ? 'text-emerald-600' : ''}>
                  {/[A-Z]/.test(newPassword) ? '✓' : '○'} One uppercase letter
                </li>
                <li className={/[a-z]/.test(newPassword) ? 'text-emerald-600' : ''}>
                  {/[a-z]/.test(newPassword) ? '✓' : '○'} One lowercase letter
                </li>
                <li className={/[0-9]/.test(newPassword) ? 'text-emerald-600' : ''}>
                  {/[0-9]/.test(newPassword) ? '✓' : '○'} One number
                </li>
                <li className={/[^A-Za-z0-9]/.test(newPassword) ? 'text-emerald-600' : ''}>
                  {/[^A-Za-z0-9]/.test(newPassword) ? '✓' : '○'} One special character
                </li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={isResetting}
              className="btn-primary w-full"
            >
              {isResetting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>

          {/* Footer Link */}
          <p className="mt-6 text-center text-sm text-dt-text-muted">
            <Link href="/login" className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:underline">
              <ArrowLeft className="h-3 w-3" /> Back to Login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ========== EMAIL SUBMITTED VIEW ==========
  if (isSubmitted) {
    return (
      <div className="w-full max-w-md">
        <div className="glass-card rounded-2xl p-8 text-center text-dt-text">
          <div className="mb-4 text-5xl">📧</div>
          <h1 className="mb-2 text-2xl font-bold">Check Your Email</h1>
          <p className="mb-6 text-dt-text-muted">
            We&apos;ve sent a password reset link to{' '}
            <span className="font-semibold text-dt-text">{email}</span>
          </p>
          <p className="mb-6 text-sm text-dt-text-muted">
            Didn&apos;t receive the email? Check your spam folder or try again.
          </p>
          <button
            onClick={() => setIsSubmitted(false)}
            className="btn-secondary w-full"
          >
            Try Again
          </button>
          <Link
            href="/login"
            className="mt-4 block text-sm text-dt-text-muted hover:text-dt-text"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  // ========== EMAIL REQUEST FORM ==========
  return (
    <div className="w-full max-w-md">
      <div className="glass-card rounded-2xl p-8 text-dt-text">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold">Forgot Password?</h1>
          <p className="text-dt-text-muted">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRequestReset} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-dt-text-muted">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-glass"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        {/* Footer Link */}
        <p className="mt-6 text-center text-sm text-dt-text-muted">
          Remember your password?{' '}
          <Link href="/login" className="font-semibold text-emerald-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
