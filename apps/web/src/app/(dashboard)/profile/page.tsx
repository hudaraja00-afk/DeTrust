'use client';

import { Clock3 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useProfileViewData } from '@/hooks/use-profile-view-data';

import { LinkedInProfileCard } from '@/components/profile/linkedin-profile-card';
import { ProfileChecklistCard } from '@/components/profile/profile-checklist-card';
import { ProfileActivityCard } from '@/components/profile/profile-activity-card';

export default function ProfileViewPage() {
  const d = useProfileViewData();

  if (!d.profile && d.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!d.profile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center space-y-4 py-10">
          <p className="text-center text-sm text-dt-text-muted">We couldn&apos;t load your profile. Try again.</p>
          <Button onClick={() => void d.refetch()} className="gap-2">
            <Clock3 className="h-4 w-4" />Reload
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {d.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">{d.error.message}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
        {/* Main Profile - LinkedIn Style */}
        <div>
          <LinkedInProfileCard
            profile={d.profile}
            isFreelancer={d.isFreelancer}
            freelancerProfile={d.freelancerProfile}
            clientProfile={d.clientProfile}
            avatarObjectUrl={d.avatarObjectUrl}
            avatarLoading={d.avatarLoading}
            walletBadgeLabel={d.walletBadgeLabel}
            completion={d.completion}
            languages={d.languages}
            topSkills={d.topSkills}
            educationEntries={d.educationEntries}
            experienceEntries={d.experienceEntries}
            portfolioItems={d.portfolioItems}
            certifications={d.certifications}
            certPreviewMap={d.certPreviewMap}
            resumeUploaded={d.resumeUploaded}
            formatEducationRange={d.formatEducationRange}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <ProfileChecklistCard taskList={d.taskList} onRefetch={() => void d.refetch()} isFetching={d.isFetching} />
          <ProfileActivityCard activityCards={d.activityCards} />
        </div>
      </div>
    </div>
  );
}
