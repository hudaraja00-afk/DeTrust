'use client';

import { FileText, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Job } from '@/lib/api/job';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface JobDescriptionCardProps {
  job: Job;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JobDescriptionCard({ job }: JobDescriptionCardProps) {
  return (
    <>
      {/* Job Description */}
      <Card className="border-dt-border bg-dt-surface shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-dt-text">
            <FileText className="h-5 w-5 text-emerald-500" />
            Job Description
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-slate max-w-none">
          <p className="whitespace-pre-wrap text-dt-text-muted">{job.description}</p>
        </CardContent>
      </Card>

      {/* Required Skills */}
      <Card className="border-dt-border bg-dt-surface shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-dt-text">
            <Sparkles className="h-5 w-5 text-emerald-500" />
            Required Skills
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {job.skills.map((js) => (
              <Badge
                key={js.id}
                variant="secondary"
                className="bg-dt-surface-alt px-3 py-1 text-dt-text-muted"
              >
                {js.skill.name}
                {js.isRequired && (
                  <span className="ml-1 text-emerald-600">*</span>
                )}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
