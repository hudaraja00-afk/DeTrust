import { api } from './client';

export interface ClientPublicProfile {
  user: {
    id: string;
    name: string | null;
    avatarUrl: string | null;
    role: string;
    createdAt: string;
    clientProfile: {
      companyName: string | null;
      companySize: string | null;
      companyWebsite: string | null;
      description: string | null;
      industry: string | null;
      location: string | null;
      trustScore: number;
      avgRating: number;
      totalReviews: number;
      jobsPosted: number;
      hireRate: number;
      totalSpent: number;
      paymentVerified: boolean;
      profileComplete: boolean;
      completenessScore: number;
    } | null;
  };
  recentContracts: Array<{
    id: string;
    title: string;
    totalAmount: number;
    completedAt: string | null;
    freelancer: { name: string | null };
  }>;
}

export const clientProfileApi = {
  getClientProfile: (id: string) =>
    api.get<ClientPublicProfile>(`/users/clients/${id}/profile`),
};
