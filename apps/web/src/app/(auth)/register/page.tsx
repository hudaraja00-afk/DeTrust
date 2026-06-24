'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAccount, useSignMessage } from 'wagmi';
import { toast } from 'sonner';
import { Check, Wallet, Eye, EyeOff } from 'lucide-react';

import { useAuthStore } from '@/store/auth.store';
import { isWalletConnectConfigured } from '@/lib/env';
import { MetaMaskPriorityConnect } from '@/components/wallet/meta-mask-priority';
import { userApi } from '@/lib/api/user';

type Role = 'FREELANCER' | 'CLIENT';

const STEPS = [
  { id: 'role', label: 'Choose mode', description: 'Client or Freelancer' },
  { id: 'account', label: 'Account basics', description: 'Details & wallet pairing' },
  { id: 'compliance', label: 'Optional compliance', description: 'KYC stays optional' },
];

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[300px] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" /></div>}>
      <RegisterPageContent />
    </Suspense>
  );
}

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRole = searchParams.get('role')?.toUpperCase() as Role | null;

  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const { register, loginWithWallet, isLoading, error } = useAuthStore();
  const walletReady = isWalletConnectConfigured;

  const startStep = initialRole ? 1 : 0;
  const [currentStep, setCurrentStep] = useState(startStep);
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole || 'FREELANCER');
  const [kycEnabled, setKycEnabled] = useState(false);
  const [kycData, setKycData] = useState({ documentType: 'Passport', idNumber: '', country: '' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setCurrentStep(1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    // Clear error for this field
    setFormErrors((prev) => ({ ...prev, [e.target.name]: '' }));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (formData.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email.includes('@')) {
      errors.email = 'Please enter a valid email';
    }
    
    if (formData.password.length < 12) {
      errors.password = 'Password must be at least 12 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      errors.password = 'Password must contain an uppercase letter';
    } else if (!/[a-z]/.test(formData.password)) {
      errors.password = 'Password must contain a lowercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      errors.password = 'Password must contain a number';
    } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
      errors.password = 'Password must contain a special character';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAccountContinue = () => {
    if (validateForm()) {
      setCurrentStep(2);
    }
  };

  const handleEmailRegister = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet before creating a workspace');
      return;
    }

    if (!validateForm()) {
      if (currentStep !== 1) {
        setCurrentStep(1);
      }
      return;
    }

    const success = await register(formData.email, formData.password, formData.name, selectedRole);

    if (success) {
      // Submit KYC data if user opted in
      if (kycEnabled && kycData.idNumber && kycData.country) {
        await userApi.updateKyc({
          documentType: kycData.documentType || 'Passport',
          idNumber: kycData.idNumber,
          country: kycData.country,
        });
      }
      toast.success('Workspace created!');
      router.push('/profile');
    }
  };

  const handleWalletRegister = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet first');
      return;
    }

    const success = await loginWithWallet(address, async (message) => {
      return signMessageAsync({ message });
    });

    if (success) {
      // Set the role the user picked in step 0 (backend defaults to FREELANCER)
      if (selectedRole !== 'FREELANCER') {
        await userApi.setRole(selectedRole);
      }
      toast.success('Wallet connected!');
      router.push('/profile');
    }
  };

  // Role selection step
  const renderRoleStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-dt-text">Choose your workspace type</h1>
        <p className="mt-2 text-dt-text-muted">Create an account to start working or hiring.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {[
          {
            role: 'FREELANCER' as Role,
            title: 'Freelancer',
            points: ['Trust graph reputation', 'Instant escrow payouts', 'AI capability boost'],
          },
          {
            role: 'CLIENT' as Role,
            title: 'Client',
            points: ['Verified talent pools', 'Smart escrow controls', 'Enterprise compliance'],
          },
        ].map((card) => (
          <button
            key={card.role}
            onClick={() => handleRoleSelect(card.role)}
            className="glass-card flex h-full flex-col rounded-2xl p-6 text-left transition-transform hover:-translate-y-1 border border-dt-border"
          >
            <h3 className="text-xl font-semibold text-dt-text">{card.title}</h3>
            <ul className="mt-3 space-y-2 text-sm text-dt-text-muted">
              {card.points.map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <Check className="h-4 w-4" /> {point}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
      <p className="text-center text-sm text-dt-text-muted">
        Already with us? <Link href="/login" className="font-medium text-dt-text hover:underline">Sign in</Link>
      </p>
    </div>
  );

  const renderAccountStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-dt-text">Set up your workspace</h2>
          <p className="text-sm text-dt-text-muted">Wallet-first, email-enhanced.</p>
        </div>
        <button className="text-sm text-dt-text-muted underline" onClick={() => setCurrentStep(0)}>
          Change role
        </button>
      </div>

      <div className="rounded-2xl border border-dt-border bg-dt-surface p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-dt-text">
          <Wallet className="h-4 w-4" /> Step 1: Connect your wallet
        </p>
        <p className="mt-1 text-sm text-dt-text-muted">
          Your wallet proves identity. Email keeps you notified.
        </p>
      </div>

      <div className="space-y-4 rounded-3xl border border-dt-border bg-dt-surface-alt/80 p-4 text-center">
        {!walletReady && (
          <div className="text-left text-sm">
            <p className="font-medium text-dt-text">Mobile wallet support</p>
            <p className="text-dt-text-muted">
              Add WalletConnect project ID to enable mobile wallet connections.
            </p>
          </div>
        )}

        <MetaMaskPriorityConnect />

        {isConnected && (
          <button onClick={handleWalletRegister} className="btn-primary mt-4 w-full" disabled={isLoading}>
            {isLoading ? 'Linking wallet…' : 'Continue with Wallet'}
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-dt-text">Full name</label>
          <input name="name" value={formData.name} onChange={handleInputChange} className="input-glass mt-2" placeholder="Jane Doe" />
          {formErrors.name && <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>}
        </div>
        <div>
          <label className="text-sm font-medium text-dt-text">Email address</label>
          <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="input-glass mt-2" placeholder="you@example.com" />
          {formErrors.email && <p className="mt-1 text-sm text-red-500">{formErrors.email}</p>}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-dt-text">Password</label>
            <div className="relative mt-2">
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                className="input-glass w-full pr-10"
                placeholder="••••••••"
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
            {formErrors.password && <p className="mt-1 text-sm text-red-500">{formErrors.password}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-dt-text">Confirm password</label>
            <div className="relative mt-2">
              <input
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="input-glass w-full pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-dt-text-muted hover:text-dt-text"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {formErrors.confirmPassword && <p className="mt-1 text-sm text-red-500">{formErrors.confirmPassword}</p>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button className="btn-secondary" onClick={() => setCurrentStep(0)}>Back</button>
        <button className="btn-primary" onClick={handleAccountContinue}>Continue to KYC</button>
      </div>
    </div>
  );

  const renderComplianceStep = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-dt-text">Optional compliance</h2>
          <p className="text-sm text-dt-text-muted">Toggle KYC when enterprise buyers need it.</p>
        </div>
        <button className="text-sm text-dt-text-muted underline" onClick={() => setCurrentStep(1)}>
          Edit account info
        </button>
      </div>

      <div className="rounded-2xl border border-dt-border bg-dt-surface p-6">
        <p className="text-sm text-dt-text-muted">KYC verification unlocks contracts ≥$25k and curated talent pools. Completely optional for standard use.</p>
        <label className="mt-4 flex items-center justify-between">
          <span className="text-sm font-medium text-dt-text">Enable KYC now?</span>
          <input type="checkbox" checked={kycEnabled} onChange={(e) => setKycEnabled(e.target.checked)} className="h-5 w-5" />
        </label>
        {kycEnabled && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-dt-text-muted">Document</label>
              <input value={kycData.documentType} onChange={(e) => setKycData((prev) => ({ ...prev, documentType: e.target.value }))} className="input-glass mt-2" placeholder="Passport" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-dt-text-muted">ID Number</label>
              <input value={kycData.idNumber} onChange={(e) => setKycData((prev) => ({ ...prev, idNumber: e.target.value }))} className="input-glass mt-2" placeholder="SAMPLE12345" />
            </div>
            <div>
              <label className="text-xs uppercase tracking-[0.3em] text-dt-text-muted">Country</label>
              <input value={kycData.country} onChange={(e) => setKycData((prev) => ({ ...prev, country: e.target.value }))} className="input-glass mt-2" placeholder="Singapore" />
            </div>
          </div>
        )}
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40 p-3 text-sm text-red-700 dark:text-red-400">{error}</div>}

      <div className="rounded-xl border border-dt-border bg-dt-surface-alt p-3">
        <p className="text-xs text-dt-text-muted">
          By creating an account you agree to our <Link href="/terms" className="underline hover:text-dt-text">Terms</Link> and <Link href="/privacy" className="underline hover:text-dt-text">Privacy Policy</Link>.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button className="btn-secondary" onClick={() => setCurrentStep(1)}>Back</button>
        <button className="btn-primary" onClick={handleEmailRegister} disabled={isLoading}>
          {isLoading ? 'Creating account…' : 'Create account'}
        </button>
      </div>
    </div>
  );

  const stepContent = [renderRoleStep(), renderAccountStep(), renderComplianceStep()];

  return (
    <div className="space-y-6 text-dt-text">
      <div className="rounded-2xl border border-dt-border bg-dt-surface p-4">
        <div className="grid gap-3 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`rounded-xl p-3 ${
                index === currentStep ? 'bg-dt-surface-alt border border-dt-border' : ''
              }`}
            >
              <p className="text-xs uppercase tracking-[0.2em] text-dt-text-muted">Step {index + 1}</p>
              <p className="font-medium text-dt-text">{step.label}</p>
              <p className="text-xs text-dt-text-muted">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-dt-border bg-dt-surface p-6">
        {stepContent[currentStep]}
      </div>
    </div>
  );
}
