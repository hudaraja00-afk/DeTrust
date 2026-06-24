'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Shield, Sparkles, WalletMinimal } from 'lucide-react';

import type { HighlightStat } from '@/components/profile/profile-hero';
import { computeProfileCompletion, shortWallet } from '@/lib/profile-utils';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api/client';
import { useSafeAccount } from '@/hooks/use-safe-account';
import { fetchSecureFile, releaseObjectUrl } from '@/lib/secure-files';
import { useSecureObjectUrl } from '@/hooks/use-secure-object-url';
import { useCurrentUser } from '@/hooks/queries/use-user';

/**
 * Bundles every piece of derived profile state consumed by the profile view page
 * and its child components. Keeps the page component thin (<80 lines).
 */
export function useProfileViewData() {
  const { user } = useAuthStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { address: connectedAddress, isConnected } = useSafeAccount();
  const { data: profileData, isLoading, isFetching, error, refetch } = useCurrentUser();
  const profile = profileData ?? user;

  const { objectUrl: avatarObjectUrl, isLoading: avatarLoading } = useSecureObjectUrl(profile?.avatarUrl);

  /* ---------- Scalars ---------- */

  const completion = useMemo(() => computeProfileCompletion(profile), [profile]);
  const role = profile?.role ?? 'FREELANCER';
  const isFreelancer = role === 'FREELANCER';
  const freelancerProfile = profile?.freelancerProfile ?? null;
  const clientProfile = profile?.clientProfile ?? null;
  const profileComplete = isFreelancer ? Boolean(freelancerProfile?.profileComplete) : completion >= 70;
  // Always prefer the live connected address; fall back to stored only when disconnected
  const walletDisplayAddress = (isConnected && connectedAddress) ? connectedAddress : (profile?.walletAddress ?? null);
  const isSyncedWithConnected = !isConnected || connectedAddress?.toLowerCase() === profile?.walletAddress?.toLowerCase();
  const walletBadgeLabel = walletDisplayAddress
    ? isSyncedWithConnected
      ? `Wallet ${shortWallet(walletDisplayAddress)}`
      : `Wallet ${shortWallet(walletDisplayAddress)} \u00b7 syncing\u2026`
    : 'Wallet not linked';
  const languages = (freelancerProfile?.languages ?? []).join(' \u00b7 ');
  const resumeUploaded = Boolean(freelancerProfile?.resumeUrl);

  /* ---------- Collections ---------- */

  const certifications = useMemo(() => freelancerProfile?.certifications ?? [], [freelancerProfile?.certifications]);

  const topSkills = useMemo(() => {
    const skills = freelancerProfile?.skills ?? [];
    return [...skills]
      .sort((a, b) => {
        const aScore = a.verificationScore ?? a.proficiencyLevel ?? 0;
        const bScore = b.verificationScore ?? b.proficiencyLevel ?? 0;
        return bScore - aScore;
      })
      .slice(0, 8);
  }, [freelancerProfile?.skills]);

  const educationEntries = useMemo(() => {
    const entries = freelancerProfile?.education ?? [];
    return [...entries]
      .sort((a, b) => {
        const aDate = a.endDate ?? a.startDate ?? new Date(0);
        const bDate = b.endDate ?? b.startDate ?? new Date(0);
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      })
      .slice(0, 3);
  }, [freelancerProfile?.education]);

  const experienceEntries = useMemo(() => {
    const entries = freelancerProfile?.experience ?? [];
    return [...entries]
      .sort((a, b) => {
        const aDate = a.endDate ?? a.startDate ?? new Date(0);
        const bDate = b.endDate ?? b.startDate ?? new Date(0);
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
  }, [freelancerProfile?.experience]);

  const portfolioItems = useMemo(() => {
    return freelancerProfile?.portfolioItems ?? [];
  }, [freelancerProfile?.portfolioItems]);

  const formatEducationRange = useCallback((start?: Date | string | null, end?: Date | string | null) => {
    if (!start && !end) return 'Dates not provided';
    const startYear = start ? new Date(start).getFullYear() : '\u2014';
    const endYear = end ? new Date(end).getFullYear() : 'Present';
    return `${startYear} \u2013 ${endYear}`;
  }, []);

  /* ---------- Highlight stats / task / activity lists ---------- */

  const highlightStats: HighlightStat[] = isFreelancer
    ? [
        { label: 'Trust score', value: `${freelancerProfile?.trustScore ?? 0}%`, detail: `${freelancerProfile?.totalReviews ?? 0} on-chain reviews`, icon: <Shield className="h-4 w-4 text-emerald-500" /> },
        { label: 'AI capability', value: `${freelancerProfile?.aiCapabilityScore ?? 0}%`, detail: 'Signals refresh after each skill update', icon: <Sparkles className="h-4 w-4 text-cyan-500" /> },
        { label: 'Jobs shipped', value: `${freelancerProfile?.completedJobs ?? 0}`, detail: `${freelancerProfile?.avgRating != null ? Number(freelancerProfile.avgRating).toFixed(1) : '\u2014'} star avg`, icon: <Building2 className="h-4 w-4 text-slate-500" /> },
      ]
    : [
        { label: 'Trust score', value: `${clientProfile?.trustScore ?? 0}%`, detail: `${clientProfile?.totalReviews ?? 0} talent reviews`, icon: <Shield className="h-4 w-4 text-emerald-500" /> },
        { label: 'Hire rate', value: `${clientProfile?.hireRate ?? 0}%`, detail: `${clientProfile?.jobsPosted ?? 0} jobs posted`, icon: <Building2 className="h-4 w-4 text-cyan-500" /> },
        { label: 'Payment status', value: clientProfile?.paymentVerified ? 'Verified' : 'Pending', detail: clientProfile?.paymentVerified ? 'Escrow ready' : 'Connect wallet to auto-verify', icon: <WalletMinimal className="h-4 w-4 text-slate-500" /> },
      ];

  const taskList = isFreelancer
    ? [
        { label: 'Add headline & timezone', complete: Boolean(freelancerProfile?.title && freelancerProfile?.timezone) },
        { label: 'Write 100+ word narrative', complete: (freelancerProfile?.bio?.length ?? 0) >= 100 },
        { label: 'List \u22653 verified skills', complete: (freelancerProfile?.skills?.length ?? 0) >= 3 },
        { label: 'Log an education signal', complete: (freelancerProfile?.education?.length ?? 0) > 0 },
        { label: 'Share a portfolio link', complete: (freelancerProfile?.portfolioLinks?.length ?? 0) > 0 },
      ]
    : [
        { label: 'Name your organization', complete: Boolean(clientProfile?.companyName) },
        { label: 'Describe what you build', complete: Boolean(clientProfile?.description) },
        { label: 'Link website or deck', complete: Boolean(clientProfile?.companyWebsite) },
        { label: 'Verify payment method', complete: Boolean(clientProfile?.paymentVerified) },
      ];

  const certificationCount = certifications.length;

  const activityCards = isFreelancer
    ? [
        { label: 'Latest resume status', body: resumeUploaded ? 'Resume ready to share with curated clients.' : 'Upload a polished PDF to boost match quality.' },
        { label: 'Certification pipeline', body: certificationCount ? `${certificationCount} credential${certificationCount === 1 ? '' : 's'} pinned to your dossier.` : 'Add a credential to your dossier to elevate trust signals.' },
        { label: 'Wallet syncing', body: walletDisplayAddress ? 'Wallet connected and synced to your profile.' : 'Connect a wallet from the navigation bar to unlock escrow.' },
      ]
    : [
        { label: 'Payment verification', body: clientProfile?.paymentVerified ? 'Payment method verified \u2014 escrow releases are unlocked for upcoming contracts.' : 'Connect a wallet from the navigation bar to auto-verify your payment method and unlock escrow-backed hires.' },
        { label: 'Company dossier', body: clientProfile?.description ? 'Your narrative is live. Refresh it as the roadmap evolves to keep talent aligned.' : 'Add a short company narrative so senior talent understands the mission.' },
        { label: 'Opportunities pipeline', body: clientProfile?.jobsPosted ? `You've posted ${clientProfile.jobsPosted} job${clientProfile.jobsPosted === 1 ? '' : 's'}. Keep momentum by updating briefs regularly.` : 'Publish your first scoped opportunity to surface in curated freelancer feeds.' },
      ];

  /* ---------- Cert preview thumbnails ---------- */

  const [certPreviewMap, setCertPreviewMap] = useState<Record<string, { url: string; mimeType: string }>>({});

  useEffect(() => {
    if (!isAuthenticated || !certifications.length) {
      setCertPreviewMap((current) => {
        Object.values(current).forEach((entry) => releaseObjectUrl(entry.url));
        return {};
      });
      return undefined;
    }

    const controller = new AbortController();
    const createdUrls: string[] = [];
    let cancelled = false;

    const loadPreviews = async () => {
      const nextEntries: Record<string, { url: string; mimeType: string }> = {};
      for (const cert of certifications) {
        if (!cert.credentialUrl) continue;
        try {
          const file = await fetchSecureFile(cert.credentialUrl, {
            token: api.getToken() ?? undefined,
            signal: controller.signal,
            attachObjectUrl: true,
          });
          if (!file.objectUrl) continue;
          if (!file.mimeType.startsWith('image/')) {
            releaseObjectUrl(file.objectUrl);
            continue;
          }
          createdUrls.push(file.objectUrl);
          nextEntries[cert.id] = { url: file.objectUrl, mimeType: file.mimeType };
        } catch (err) {
          if ((err as Error)?.name === 'AbortError') return;
          console.warn('Unable to fetch certification preview', err);
        }
      }
      if (cancelled) {
        createdUrls.forEach(releaseObjectUrl);
        return;
      }
      setCertPreviewMap((current) => {
        Object.values(current).forEach((entry) => releaseObjectUrl(entry.url));
        return nextEntries;
      });
    };

    void loadPreviews();

    return () => {
      cancelled = true;
      controller.abort();
      createdUrls.forEach(releaseObjectUrl);
    };
  }, [isAuthenticated, certifications]);

  return {
    profile,
    isLoading,
    isFetching,
    error,
    refetch,
    isAuthenticated,
    avatarObjectUrl: avatarObjectUrl ?? null,
    avatarLoading,
    completion,
    role,
    isFreelancer,
    freelancerProfile,
    clientProfile,
    profileComplete,
    walletDisplayAddress,
    walletBadgeLabel,
    highlightStats,
    languages,
    resumeUploaded,
    certifications,
    topSkills,
    educationEntries,
    experienceEntries,
    portfolioItems,
    formatEducationRange,
    taskList,
    activityCards,
    certPreviewMap,
  };
}
