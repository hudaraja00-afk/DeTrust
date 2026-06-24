'use client';

import Link from 'next/link';
import { FileText } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FreelancerProfile, ClientProfile } from '@/lib/api/user';

export interface ProfileAboutCardProps {
  isFreelancer: boolean;
  freelancerProfile: FreelancerProfile | null;
  clientProfile: ClientProfile | null;
}

export function ProfileAboutCard({ isFreelancer, freelancerProfile, clientProfile }: ProfileAboutCardProps) {
  const portfolio = freelancerProfile?.portfolioLinks?.[0];
  const clientWebsite = clientProfile?.companyWebsite;
  const clientIndustry = clientProfile?.industry;
  const clientTeamSize = clientProfile?.companySize;

  return (
    <Card className="border-dt-border bg-dt-surface text-dt-text-muted shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg text-dt-text">
          <FileText className="h-5 w-5 text-dt-text" /> About
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm leading-relaxed text-dt-text-muted">
        <p>{isFreelancer ? freelancerProfile?.bio || 'Share how you work, the stacks you own, and proof of impact.' : clientProfile?.description || 'Describe what you are building to attract senior talent.'}</p>
        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-dt-text-muted">
          {isFreelancer ? (
            <>
              {portfolio ? (
                <Link href={portfolio} target="_blank" className="text-dt-text underline">
                  Portfolio &rarr;
                </Link>
              ) : (
                <span>Add portfolio links in edit mode</span>
              )}
              <span>{freelancerProfile?.languages?.length ? `${freelancerProfile.languages.length} languages` : 'Add languages'}</span>
              <span>{freelancerProfile?.availability || 'Availability not set'}</span>
            </>
          ) : (
            <>
              {clientWebsite ? (
                <Link href={clientWebsite} target="_blank" className="text-dt-text underline">
                  Company site &rarr;
                </Link>
              ) : (
                <span>Add company site in edit mode</span>
              )}
              <span>{clientIndustry || 'Industry not set'}</span>
              <span>{clientTeamSize ? `${clientTeamSize} team` : 'Team size TBD'}</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
