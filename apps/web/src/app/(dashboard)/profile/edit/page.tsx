'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useMemo } from 'react';
import { Sparkles, Shield, WalletMinimal, RefreshCw, CheckCircle2, Clock3, Building2 } from 'lucide-react';

import { BasicProfileCard } from '@/components/profile/basic-profile-card';
import { FreelancerProfileForm } from '@/components/profile/freelancer-profile-form';
import { FreelancerSkillsCard } from '@/components/profile/freelancer-skills-card';
import { FreelancerEducationCard } from '@/components/profile/freelancer-education-card';
import { FreelancerExperienceCard } from '@/components/profile/freelancer-experience-card';
import { FreelancerPortfolioCard } from '@/components/profile/freelancer-portfolio-card';
import { FreelancerDocumentsCard } from '@/components/profile/freelancer-documents-card';
import { ClientProfileForm } from '@/components/profile/client-profile-form';
import { ProfileProgressRing } from '@/components/profile/profile-progress-ring';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { User, FreelancerProfile, ClientProfile, FreelancerSkill, EducationEntry, CertificationEntry, ExperienceEntry, PortfolioItemEntry } from '@/lib/api/user';
import { computeProfileCompletion, shortWallet } from '@/lib/profile-utils';
import { useAuthStore } from '@/store/auth.store';
import { useCurrentUser } from '@/hooks/queries/use-user';
import { useSafeAccount } from '@/hooks/use-safe-account';
import { useSecureObjectUrl } from '@/hooks/use-secure-object-url';

export default function ProfileEditPage() {
  const { user, setUser } = useAuthStore();
  const { address: connectedAddress, isConnected } = useSafeAccount();

  const { data: profileData, isLoading, isFetching, error, refetch } = useCurrentUser();

  useEffect(() => {
    if (profileData) {
      setUser(profileData as User);
    }
  }, [profileData, setUser]);

  const { objectUrl: avatarObjectUrl, isLoading: avatarLoading } = useSecureObjectUrl(user?.avatarUrl);

  const completion = useMemo(() => computeProfileCompletion(user), [user]);
  const role = user?.role ?? 'FREELANCER';
  const isFreelancer = role === 'FREELANCER';
  const freelancerProfile = user?.freelancerProfile ?? null;
  const clientProfile = user?.clientProfile ?? null;
  const profileComplete = isFreelancer ? Boolean(freelancerProfile?.profileComplete) : completion >= 70;
  // Always prefer connected wallet for display; fall back to stored only when disconnected
  const walletDisplayAddress = (isConnected && connectedAddress) ? connectedAddress : (user?.walletAddress ?? null);
  const isSyncedWithConnected = !isConnected || connectedAddress?.toLowerCase() === user?.walletAddress?.toLowerCase();
  const walletBadgeLabel = walletDisplayAddress
    ? isSyncedWithConnected
      ? `Wallet ${shortWallet(walletDisplayAddress)}`
      : `Wallet ${shortWallet(walletDisplayAddress)} · syncing…`
    : 'Wallet not linked';
  const walletBadgeTone = isSyncedWithConnected && walletDisplayAddress
    ? 'border-dt-border text-dt-text-muted'
    : walletDisplayAddress
    ? 'border-cyan-200 text-cyan-600'
    : 'border-amber-200 text-amber-500';

  const handleFreelancerUpdated = useCallback((profile: FreelancerProfile) => {
    if (!user) return;
    setUser({ ...user, freelancerProfile: profile });
  }, [user, setUser]);

  const handleClientUpdated = useCallback((profile: ClientProfile) => {
    if (!user) return;
    setUser({ ...user, clientProfile: profile });
  }, [user, setUser]);

  const handleSkillAdded = useCallback((skill: FreelancerSkill) => {
    if (!user || !user.freelancerProfile) return;
    setUser({
      ...user,
      freelancerProfile: {
        ...user.freelancerProfile,
        skills: [...(user.freelancerProfile.skills ?? []), skill],
      },
    });
  }, [user, setUser]);

  const handleSkillRemoved = useCallback((skillId: string) => {
    if (!user || !user.freelancerProfile) return;
    setUser({
      ...user,
      freelancerProfile: {
        ...user.freelancerProfile,
        skills: (user.freelancerProfile.skills ?? []).filter((skill) => skill.skillId !== skillId),
      },
    });
  }, [user, setUser]);

  const handleEducationAdded = useCallback((entry: EducationEntry) => {
    if (!user || !user.freelancerProfile) return;
    setUser({
      ...user,
      freelancerProfile: {
        ...user.freelancerProfile,
        education: [...(user.freelancerProfile.education ?? []), entry],
      },
    });
  }, [user, setUser]);

  const handleEducationRemoved = useCallback((educationId: string) => {
    if (!user || !user.freelancerProfile) return;
    setUser({
      ...user,
      freelancerProfile: {
        ...user.freelancerProfile,
        education: (user.freelancerProfile.education ?? []).filter((entry) => entry.id !== educationId),
      },
    });
  }, [user, setUser]);

  const handleExperienceAdded = useCallback((entry: ExperienceEntry) => {
    if (!user || !user.freelancerProfile) return;
    setUser({
      ...user,
      freelancerProfile: {
        ...user.freelancerProfile,
        experience: [...(user.freelancerProfile.experience ?? []), entry],
      },
    });
  }, [user, setUser]);

  const handleExperienceRemoved = useCallback((experienceId: string) => {
    if (!user || !user.freelancerProfile) return;
    setUser({
      ...user,
      freelancerProfile: {
        ...user.freelancerProfile,
        experience: (user.freelancerProfile.experience ?? []).filter((e) => e.id !== experienceId),
      },
    });
  }, [user, setUser]);

  const handlePortfolioItemAdded = useCallback((item: PortfolioItemEntry) => {
    if (!user || !user.freelancerProfile) return;
    setUser({
      ...user,
      freelancerProfile: {
        ...user.freelancerProfile,
        portfolioItems: [...(user.freelancerProfile.portfolioItems ?? []), item],
      },
    });
  }, [user, setUser]);

  const handlePortfolioItemRemoved = useCallback((itemId: string) => {
    if (!user || !user.freelancerProfile) return;
    setUser({
      ...user,
      freelancerProfile: {
        ...user.freelancerProfile,
        portfolioItems: (user.freelancerProfile.portfolioItems ?? []).filter((item) => item.id !== itemId),
      },
    });
  }, [user, setUser]);

  const handleResumeUpdated = useCallback((resumeUrl: string | null) => {
    if (!user || !user.freelancerProfile) return;
    setUser({
      ...user,
      freelancerProfile: {
        ...user.freelancerProfile,
        resumeUrl: resumeUrl || null,
      },
    });
  }, [user, setUser]);

  const handleCertificationAdded = useCallback((certification: CertificationEntry) => {
    if (!user || !user.freelancerProfile) return;
    setUser({
      ...user,
      freelancerProfile: {
        ...user.freelancerProfile,
        certifications: [...(user.freelancerProfile.certifications ?? []), certification],
      },
    });
  }, [user, setUser]);

  const handleCertificationRemoved = useCallback((certificationId: string) => {
    if (!user || !user.freelancerProfile) return;
    setUser({
      ...user,
      freelancerProfile: {
        ...user.freelancerProfile,
        certifications: (user.freelancerProfile.certifications ?? []).filter((entry) => entry.id !== certificationId),
      },
    });
  }, [user, setUser]);

  const taskList = useMemo(() => isFreelancer
    ? [
        { label: 'Add a headline & timezone', complete: Boolean(freelancerProfile?.title && freelancerProfile?.timezone) },
        { label: 'Write 100+ word narrative', complete: (freelancerProfile?.bio?.length ?? 0) >= 100 },
        { label: 'List at least 3 verified skills', complete: (freelancerProfile?.skills?.length ?? 0) >= 3 },
        { label: 'Log an education signal', complete: (freelancerProfile?.education?.length ?? 0) > 0 },
        { label: 'Share a portfolio link', complete: (freelancerProfile?.portfolioLinks?.length ?? 0) > 0 },
      ]
    : [
        { label: 'Name your organization', complete: Boolean(clientProfile?.companyName) },
        { label: 'Describe what you build', complete: Boolean(clientProfile?.description) },
        { label: 'Link website or deck', complete: Boolean(clientProfile?.companyWebsite) },
        { label: 'Verify payment method', complete: Boolean(clientProfile?.paymentVerified) },
      ], [isFreelancer, freelancerProfile, clientProfile]);

  const insightStats = useMemo(() => isFreelancer
    ? [
        {
          label: 'Trust Score',
          value: `${freelancerProfile?.trustScore ?? 0}%`,
          detail: `${freelancerProfile?.totalReviews ?? 0} on-chain reviews`,
          icon: <Shield className="h-4 w-4 text-dt-text" />,
        },
        {
          label: 'AI Capability',
          value: `${freelancerProfile?.aiCapabilityScore ?? 0}%`,
          detail: 'Updated after each skills update',
          icon: <Sparkles className="h-4 w-4 text-dt-text" />,
        },
        {
          label: 'Completed Jobs',
          value: `${freelancerProfile?.completedJobs ?? 0}`,
          detail: `${freelancerProfile?.avgRating?.toFixed?.(1) ?? '—'} star average`,
          icon: <Building2 className="h-4 w-4 text-dt-text-muted" />,
        },
      ]
    : [
        {
          label: 'Trust Score',
          value: `${clientProfile?.trustScore ?? 0}%`,
          detail: `${clientProfile?.totalReviews ?? 0} feedback cycles`,
          icon: <Shield className="h-4 w-4 text-dt-text" />,
        },
        {
          label: 'Hire Rate',
          value: `${clientProfile?.hireRate ?? 0}%`,
          detail: `${clientProfile?.jobsPosted ?? 0} jobs posted`,
          icon: <Building2 className="h-4 w-4 text-dt-text" />,
        },
        {
          label: 'Payment Status',
          value: clientProfile?.paymentVerified ? 'Verified' : 'Pending',
          detail: clientProfile?.paymentVerified ? 'Escrow ready' : 'Connect wallet to auto-verify',
          icon: <WalletMinimal className="h-4 w-4 text-dt-text-muted" />,
        },
      ], [isFreelancer, freelancerProfile, clientProfile]);

  if (!user && isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center space-y-4 py-10">
          <p className="text-center text-sm text-dt-text-muted">We couldn&apos;t load your profile. Try again.</p>
          <Button onClick={() => { void refetch(); }} className="gap-2">
            <RefreshCw className="h-4 w-4" />Reload
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* LinkedIn-style Header */}
      <div className="overflow-hidden rounded-2xl border border-dt-border bg-dt-surface">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-emerald-500 to-emerald-600" />
        
        {/* Profile Header */}
        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="-mt-16 mb-4 flex items-end justify-between">
            <div className="group relative inline-block h-32 w-32 overflow-hidden rounded-full border-4 border-dt-surface bg-dt-surface shadow-lg">
              {avatarObjectUrl ? (
                <Image 
                  src={avatarObjectUrl} 
                  alt={user?.name || 'Avatar'} 
                  fill 
                  className="object-cover" 
                  sizes="128px" 
                  unoptimized 
                />
              ) : avatarLoading ? (
                <div className="flex h-full w-full items-center justify-center">
                  <Spinner size="sm" />
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl">🪪</div>
              )}
            </div>
            {!profileComplete && (
              <div className="mb-2">
                <ProfileProgressRing
                  value={completion}
                  caption={profileComplete ? 'Ready' : 'In progress'}
                />
              </div>
            )}
          </div>

          {/* Name & Info */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-dt-text">{user?.name || 'Unnamed talent'}</h1>
            <p className="text-base text-dt-text-muted">
              {isFreelancer 
                ? freelancerProfile?.title || 'Add a headline to unlock discovery' 
                : clientProfile?.companyName || 'Add your organization name'
              }
            </p>
            
            {/* Badges */}
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant={profileComplete ? 'success' : 'warning'} className="text-xs">
                {profileComplete ? 'Ready for proposals' : 'Complete profile to unlock'}
              </Badge>
              <Badge variant="secondary" className="text-xs uppercase tracking-wide">
                {role.toLowerCase()}
              </Badge>
              <Badge variant="outline" className={`text-xs ${walletBadgeTone}`}>{walletBadgeLabel}</Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 flex items-center gap-3">
            <Button asChild variant="outline" className="border-dt-border">
              <Link href="/profile">View profile</Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { void refetch(); }} disabled={isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Sync
            </Button>
          </div>

          {/* Highlight Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            {insightStats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-dt-border bg-white p-4">
                <div className="flex items-center gap-3 text-sm text-dt-text-muted">
                  {stat.icon}
                  <span>{stat.label}</span>
                </div>
                <div className="mt-3 text-2xl font-semibold text-dt-text">{stat.value}</div>
                <p className="text-sm text-dt-text-muted">{stat.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error.message}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
        {/* Main Form Area */}
        <div className="space-y-6">
          <BasicProfileCard user={user} onUpdated={(updatedUser) => setUser(updatedUser)} />
          {isFreelancer ? (
            <>
              <FreelancerProfileForm profile={freelancerProfile} onUpdated={handleFreelancerUpdated} />
              <FreelancerSkillsCard
                skills={freelancerProfile?.skills ?? []}
                onSkillAdded={handleSkillAdded}
                onSkillRemoved={handleSkillRemoved}
                onSync={() => { void refetch(); }}
              />
              <FreelancerExperienceCard
                experience={freelancerProfile?.experience ?? []}
                onAdded={handleExperienceAdded}
                onRemoved={handleExperienceRemoved}
                onSync={() => { void refetch(); }}
              />
              <FreelancerEducationCard
                education={freelancerProfile?.education ?? []}
                onAdded={handleEducationAdded}
                onRemoved={handleEducationRemoved}
                onSync={() => { void refetch(); }}
              />
              <FreelancerPortfolioCard
                portfolioItems={freelancerProfile?.portfolioItems ?? []}
                onAdded={handlePortfolioItemAdded}
                onRemoved={handlePortfolioItemRemoved}
                onSync={() => { void refetch(); }}
              />
              <FreelancerDocumentsCard
                profile={freelancerProfile}
                onResumeUpdated={handleResumeUpdated}
                onCertificationAdded={handleCertificationAdded}
                onCertificationRemoved={handleCertificationRemoved}
              />
            </>
          ) : (
            <ClientProfileForm profile={clientProfile} onUpdated={handleClientUpdated} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="border-dt-border bg-dt-surface shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base text-dt-text">
                Completion checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {taskList.map((task) => (
                <div key={task.label} className="flex items-center justify-between rounded-2xl border border-dt-border bg-white px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-dt-text">{task.label}</p>
                    <p className="text-xs text-dt-text-muted">{task.complete ? 'Looks great' : 'Required'}</p>
                  </div>
                  {task.complete ? (
                    <CheckCircle2 className="h-5 w-5 text-dt-text" />
                  ) : (
                    <Clock3 className="h-5 w-5 text-dt-text-muted" />
                  )}
                </div>
              ))}
              <p className="text-xs text-dt-text-muted">
                Need help? <Link href="/docs" className="font-semibold text-dt-text">Profile playbook →</Link>
              </p>
            </CardContent>
          </Card>

          <Card className="border-dt-border bg-dt-surface shadow-lg">
            <CardHeader>
              <CardTitle className="text-base text-dt-text">Identity & channels</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-dt-text-muted">
              <div className="rounded-2xl border border-dt-border bg-white p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-dt-text-muted">Email</p>
                <p className="text-dt-text">{user.email}</p>
              </div>
              <div className="rounded-2xl border border-dt-border bg-white p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-dt-text-muted">Wallet</p>
                <p className="font-mono text-dt-text">{walletDisplayAddress ? shortWallet(walletDisplayAddress) : 'Not paired'}</p>
                {walletDisplayAddress && !isSyncedWithConnected ? (
                  <p className="text-xs text-dt-text-muted">Syncing…</p>
                ) : !walletDisplayAddress ? (
                  <p className="text-xs text-dt-text-muted">Connect from navigation</p>
                ) : null}
              </div>
              <div className="rounded-2xl border border-dt-border bg-white p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-dt-text-muted">Created</p>
                <p className="text-dt-text">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-dt-text">
                Back to dashboard →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
