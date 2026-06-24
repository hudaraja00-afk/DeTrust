'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Shield, Key, Bell, User, Eye, EyeOff, Copy, Check,
  Smartphone, Lock, Mail, Wallet, Calendar, ChevronRight,
} from 'lucide-react';

import { useAuthStore } from '@/store/auth.store';
import { authApi } from '@/lib/api/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// ─── Change Password Section ─────────────────────────────────────────────────
function ChangePasswordSection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    const res = await authApi.changePassword(currentPassword, newPassword);
    setLoading(false);
    if (res.success) {
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast.error(res.error?.message || 'Failed to change password');
    }
  };

  return (
    <Card className="border border-dt-border bg-dt-surface/90 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-dt-text">
          <Key className="h-4 w-4 text-emerald-500" /> Change Password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dt-text-muted">Current Password</label>
            <div className="relative">
              <input type={showPasswords ? 'text' : 'password'} value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)} required
                className="w-full rounded-xl border border-dt-border bg-dt-surface px-4 py-2.5 text-sm text-dt-text focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40 pr-10" />
              <button type="button" onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dt-text-muted hover:text-dt-text">
                {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dt-text-muted">New Password</label>
            <input type={showPasswords ? 'text' : 'password'} value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)} required minLength={12}
              placeholder="Min 12 chars, upper, lower, number, special"
              className="w-full rounded-xl border border-dt-border bg-dt-surface px-4 py-2.5 text-sm text-dt-text placeholder:text-dt-text-muted/50 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-dt-text-muted">Confirm New Password</label>
            <input type={showPasswords ? 'text' : 'password'} value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)} required minLength={12}
              className="w-full rounded-xl border border-dt-border bg-dt-surface px-4 py-2.5 text-sm text-dt-text focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40" />
          </div>
          {/* Live password requirements */}
          <div className="rounded-xl border border-dt-border bg-dt-surface-alt p-3">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-dt-text-muted">Requirements</p>
            <div className="grid grid-cols-2 gap-1 text-xs text-dt-text-muted">
              {[
                [newPassword.length >= 12, '12+ characters'],
                [/[A-Z]/.test(newPassword), 'Uppercase'],
                [/[a-z]/.test(newPassword), 'Lowercase'],
                [/[0-9]/.test(newPassword), 'Number'],
                [/[^A-Za-z0-9]/.test(newPassword), 'Special char'],
                [newPassword === confirmPassword && newPassword.length > 0, 'Passwords match'],
              ].map(([ok, label]) => (
                <span key={label as string} className={cn(ok ? 'text-emerald-600 dark:text-emerald-400' : '')}>
                  {ok ? '✓' : '○'} {label as string}
                </span>
              ))}
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
            {loading ? 'Changing…' : 'Update Password'}
          </button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Two-Factor Auth Section ─────────────────────────────────────────────────
function TwoFactorSection() {
  const { user, fetchUser } = useAuthStore();
  const is2FAEnabled = user?.twoFactorEnabled ?? false;

  // Setup flow state
  const [setupStep, setSetupStep] = useState<'idle' | 'qr' | 'backup'>('idle');
  const [qrData, setQrData] = useState<{ secret: string; qrCodeUrl: string } | null>(null);
  const [verifyCode, setVerifyCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  // Disable flow state
  const [showDisable, setShowDisable] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');

  const handleSetup = async () => {
    setLoading(true);
    const res = await authApi.setup2FA();
    setLoading(false);
    if (res.success && res.data) {
      setQrData(res.data);
      setSetupStep('qr');
    } else {
      toast.error(res.error?.message || 'Failed to setup 2FA');
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await authApi.verify2FA(verifyCode);
    setLoading(false);
    if (res.success && res.data) {
      setBackupCodes(res.data.backupCodes);
      setSetupStep('backup');
      toast.success('2FA enabled!');
      fetchUser();
    } else {
      toast.error(res.error?.message || 'Invalid code');
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await authApi.disable2FA(disableCode, disablePassword);
    setLoading(false);
    if (res.success) {
      toast.success('2FA disabled');
      setShowDisable(false);
      setDisableCode('');
      setDisablePassword('');
      fetchUser();
    } else {
      toast.error(res.error?.message || 'Failed to disable 2FA');
    }
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopiedBackup(true);
    toast.success('Backup codes copied');
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  return (
    <Card className="border border-dt-border bg-dt-surface/90 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-dt-text">
          <Smartphone className="h-4 w-4 text-emerald-500" /> Two-Factor Authentication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status indicator */}
        <div className={cn(
          'flex items-center gap-3 rounded-xl border p-4',
          is2FAEnabled
            ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-800 dark:bg-emerald-950/30'
            : 'border-amber-200 bg-amber-50/80 dark:border-amber-800 dark:bg-amber-950/30'
        )}>
          <div className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full',
            is2FAEnabled ? 'bg-emerald-100 dark:bg-emerald-900/60' : 'bg-amber-100 dark:bg-amber-900/60'
          )}>
            <Shield className={cn('h-5 w-5', is2FAEnabled ? 'text-emerald-600' : 'text-amber-600')} />
          </div>
          <div className="flex-1">
            <p className={cn('text-sm font-semibold', is2FAEnabled ? 'text-emerald-900 dark:text-emerald-200' : 'text-amber-900 dark:text-amber-200')}>
              {is2FAEnabled ? '2FA is Active' : '2FA is Not Enabled'}
            </p>
            <p className="text-xs text-dt-text-muted">
              {is2FAEnabled ? 'Your account has an extra layer of security.' : 'Add authenticator app protection to your account.'}
            </p>
          </div>
        </div>

        {/* IDLE: show enable/disable button */}
        {setupStep === 'idle' && !showDisable && (
          is2FAEnabled ? (
            <button onClick={() => setShowDisable(true)}
              className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50">
              Disable 2FA
            </button>
          ) : (
            <button onClick={handleSetup} disabled={loading}
              className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
              {loading ? 'Setting up…' : 'Enable 2FA'}
            </button>
          )
        )}

        {/* QR code step */}
        {setupStep === 'qr' && qrData && (
          <div className="space-y-4">
            <p className="text-sm text-dt-text-muted">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.):</p>
            <div className="flex justify-center">
              <div className="rounded-2xl border border-dt-border bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qrData.qrCodeUrl} alt="2FA QR Code" className="h-48 w-48" />
              </div>
            </div>
            <div className="rounded-xl border border-dt-border bg-dt-surface-alt p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-dt-text-muted">Manual Entry Key</p>
              <code className="block break-all text-sm font-mono text-dt-text">{qrData.secret}</code>
            </div>
            <form onSubmit={handleVerify} className="space-y-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dt-text-muted">Enter 6-digit code</label>
                <input type="text" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000" maxLength={6} required
                  className="w-full rounded-xl border border-dt-border bg-dt-surface px-4 py-2.5 text-center text-lg font-mono tracking-[0.5em] text-dt-text focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40" />
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setSetupStep('idle'); setQrData(null); setVerifyCode(''); }}
                  className="flex-1 rounded-xl border border-dt-border px-4 py-2.5 text-sm font-semibold text-dt-text-muted transition hover:bg-dt-surface-alt">
                  Cancel
                </button>
                <button type="submit" disabled={loading || verifyCode.length !== 6}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50">
                  {loading ? 'Verifying…' : 'Verify & Enable'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Backup codes step */}
        {setupStep === 'backup' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">⚠️ Save Your Backup Codes</p>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Store these codes safely. Each can be used once if you lose access to your authenticator.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-dt-border bg-dt-surface-alt p-4">
              {backupCodes.map((code) => (
                <code key={code} className="rounded bg-dt-surface px-2 py-1 text-center text-sm font-mono text-dt-text">{code}</code>
              ))}
            </div>
            <button onClick={copyBackupCodes}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dt-border px-4 py-2.5 text-sm font-semibold text-dt-text transition hover:bg-dt-surface-alt">
              {copiedBackup ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              {copiedBackup ? 'Copied!' : 'Copy All Codes'}
            </button>
            <button onClick={() => { setSetupStep('idle'); setBackupCodes([]); }}
              className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
              I&apos;ve Saved My Codes
            </button>
          </div>
        )}

        {/* Disable form */}
        {showDisable && (
          <form onSubmit={handleDisable} className="space-y-3">
            <p className="text-sm text-dt-text-muted">Enter your current 2FA code and password to disable:</p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dt-text-muted">2FA Code</label>
              <input type="text" value={disableCode} onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000" maxLength={6} required
                className="w-full rounded-xl border border-dt-border bg-dt-surface px-4 py-2.5 text-center text-lg font-mono tracking-[0.5em] text-dt-text focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dt-text-muted">Password</label>
              <input type="password" value={disablePassword} onChange={(e) => setDisablePassword(e.target.value)} required
                className="w-full rounded-xl border border-dt-border bg-dt-surface px-4 py-2.5 text-sm text-dt-text focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/40" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShowDisable(false); setDisableCode(''); setDisablePassword(''); }}
                className="flex-1 rounded-xl border border-dt-border px-4 py-2.5 text-sm font-semibold text-dt-text-muted transition hover:bg-dt-surface-alt">
                Cancel
              </button>
              <button type="submit" disabled={loading || disableCode.length !== 6}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50">
                {loading ? 'Disabling…' : 'Disable 2FA'}
              </button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Notification Preferences Section ────────────────────────────────────────
function NotificationPreferencesSection() {
  const [prefs, setPrefs] = useState({
    emailProposals: true,
    emailContracts: true,
    emailDisputes: true,
    emailMessages: false,
    emailReviews: true,
    emailMilestones: true,
  });

  const toggle = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    toast.success('Preference updated');
  };

  const items = [
    { key: 'emailProposals' as const, label: 'Proposal updates', desc: 'When proposals are received, accepted, or rejected' },
    { key: 'emailContracts' as const, label: 'Contract activity', desc: 'Contract creation and status changes' },
    { key: 'emailDisputes' as const, label: 'Dispute alerts', desc: 'When disputes are opened or resolved' },
    { key: 'emailMessages' as const, label: 'New messages', desc: 'Email notifications for chat messages' },
    { key: 'emailReviews' as const, label: 'Review notifications', desc: 'When you receive a new review' },
    { key: 'emailMilestones' as const, label: 'Milestone updates', desc: 'Submission, approval, and payment events' },
  ];

  return (
    <Card className="border border-dt-border bg-dt-surface/90 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-dt-text">
          <Bell className="h-4 w-4 text-emerald-500" /> Email Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-dt-border">
          {items.map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-dt-text">{item.label}</p>
                <p className="text-xs text-dt-text-muted">{item.desc}</p>
              </div>
              <button type="button" onClick={() => toggle(item.key)}
                className={cn(
                  'relative h-6 w-11 rounded-full transition-colors',
                  prefs[item.key] ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                )}>
                <span className={cn(
                  'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                  prefs[item.key] && 'translate-x-5'
                )} />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Account Info Section ────────────────────────────────────────────────────
function AccountInfoSection() {
  const { user } = useAuthStore();
  const items = [
    { icon: Mail, label: 'Email', value: user?.email || 'Not set' },
    { icon: Wallet, label: 'Wallet', value: user?.walletAddress ? `${user.walletAddress.slice(0, 6)}…${user.walletAddress.slice(-4)}` : 'Not connected' },
    { icon: User, label: 'Role', value: user?.role?.toLowerCase() || '—' },
    { icon: Calendar, label: 'Member since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—' },
  ];

  return (
    <Card className="border border-dt-border bg-dt-surface/90 shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-dt-text">
          <User className="h-4 w-4 text-emerald-500" /> Account Information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="divide-y divide-dt-border">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                <item.icon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-dt-text-muted">{item.label}</p>
                <p className="text-sm font-medium text-dt-text capitalize">{item.value}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-dt-text-muted" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Settings Page ──────────────────────────────────────────────────────
export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-dt-text">Settings</h1>
        <p className="mt-1 text-sm text-dt-text-muted">Manage your account security, notifications, and preferences.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column */}
        <div className="space-y-6">
          <AccountInfoSection />
          <ChangePasswordSection />
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <TwoFactorSection />
          <NotificationPreferencesSection />
        </div>
      </div>
    </div>
  );
}
