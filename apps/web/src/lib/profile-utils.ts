import type { User, ClientProfile } from '@/lib/api/user';

export const computeClientCompletion = (profile?: ClientProfile | null) => {
  if (!profile) return 0;
  const checkpoints = [
    profile.companyName,
    profile.description,
    profile.companyWebsite,
    profile.industry,
    profile.location,
    profile.companySize,
  ];
  const filled = checkpoints.filter((value) => !!value && value.trim().length > 0).length;
  return Math.round((filled / checkpoints.length) * 100);
};

export const computeProfileCompletion = (user?: User | null) => {
  if (!user) return 0;
  if (user.role === 'FREELANCER') {
    return user.freelancerProfile?.completenessScore ?? 0;
  }
  if (user.role === 'CLIENT') {
    return computeClientCompletion(user.clientProfile);
  }
  return 100;
};

export const shortWallet = (address?: string | null) => {
  if (!address) return 'Not linked yet';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
};

/**
 * Alias for Chapter 5 naming convention — delegates to computeProfileCompletion.
 */
export const calculateProfileCompletion = computeProfileCompletion;
