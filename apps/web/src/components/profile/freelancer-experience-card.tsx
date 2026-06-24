"use client";

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { userApi, type ExperienceEntry, type ExperiencePayload } from '@/lib/api/user';

const experienceSchema = z.object({
  title: z.string().min(2, 'Job title is required').max(200),
  company: z.string().min(2, 'Company name is required').max(200),
  location: z.string().max(100).optional(),
  startMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM format'),
  endMonth: z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM format').optional().or(z.literal('')),
  isCurrent: z.boolean().optional(),
  description: z.string().max(2000).optional(),
});

type ExperienceFormValues = z.infer<typeof experienceSchema>;

const monthToISO = (value?: string | null) => (value ? `${value}-01T00:00:00.000Z` : undefined);

const formatMonth = (value?: string | null) => {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat('en', { month: 'short', year: 'numeric' }).format(new Date(value));
  } catch {
    return null;
  }
};

const formatRange = (start: string, end?: string | null, isCurrent?: boolean) => {
  const startLabel = formatMonth(start) ?? 'Start TBD';
  const endLabel = isCurrent ? 'Present' : end ? formatMonth(end) : 'Present';
  return `${startLabel} — ${endLabel}`;
};

const sortExperience = (entries: ExperienceEntry[]) =>
  [...entries].sort((a, b) => {
    const aDate = new Date(a.endDate || a.startDate || 0).getTime();
    const bDate = new Date(b.endDate || b.startDate || 0).getTime();
    return bDate - aDate;
  });

interface FreelancerExperienceCardProps {
  experience?: ExperienceEntry[];
  onAdded?: (entry: ExperienceEntry) => void;
  onRemoved?: (id: string) => void;
  onSync?: () => Promise<void> | void;
}

export function FreelancerExperienceCard({
  experience = [],
  onAdded,
  onRemoved,
  onSync,
}: FreelancerExperienceCardProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const ordered = useMemo(() => sortExperience(experience), [experience]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ExperienceFormValues>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      title: '',
      company: '',
      location: '',
      startMonth: '',
      endMonth: '',
      isCurrent: false,
      description: '',
    },
  });

  const isCurrent = watch('isCurrent');

  const onSubmit = async (values: ExperienceFormValues) => {
    const payload: ExperiencePayload = {
      title: values.title.trim(),
      company: values.company.trim(),
      location: values.location?.trim() || undefined,
      startDate: monthToISO(values.startMonth)!,
      endDate: values.isCurrent ? undefined : monthToISO(values.endMonth),
      isCurrent: values.isCurrent ?? false,
      description: values.description?.trim() || undefined,
    };

    const response = await userApi.addExperience(payload);

    if (!response.success || !response.data) {
      toast.error(response.error?.message || 'Could not add experience entry');
      return;
    }

    toast.success('Experience entry added');
    reset();
    onAdded?.(response.data as ExperienceEntry);
    await onSync?.();
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    const response = await userApi.removeExperience(id);
    setRemovingId(null);

    if (!response.success) {
      toast.error(response.error?.message || 'Unable to remove experience entry');
      return;
    }

    toast.success('Experience entry removed');
    onRemoved?.(id);
    await onSync?.();
  };

  return (
    <Card className="border-dt-border bg-dt-surface shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base text-dt-text">
          <span className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-dt-text" />
            Work experience
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {ordered.length ? (
            ordered.map((entry) => (
              <div key={entry.id} className="relative rounded-2xl border border-dt-border bg-dt-surface-alt/80 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-dt-text">{entry.title}</p>
                    <p className="text-sm text-dt-text-muted">{entry.company}</p>
                    {entry.location ? (
                      <p className="text-xs text-dt-text-muted">{entry.location}</p>
                    ) : null}
                    <p className="text-xs text-dt-text-muted">
                      {formatRange(entry.startDate, entry.endDate, entry.isCurrent)}
                    </p>
                    {entry.isCurrent ? (
                      <Badge variant="secondary" className="mt-1 text-[10px]">Current</Badge>
                    ) : null}
                    {entry.description ? (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-dt-text-muted">{entry.description}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(entry.id)}
                    disabled={removingId === entry.id}
                    aria-label="Remove experience entry"
                  >
                    <Trash2 className={`h-4 w-4 ${removingId === entry.id ? 'animate-pulse text-dt-text-muted' : 'text-dt-text-muted'}`} />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-dt-border bg-dt-surface-alt p-6 text-center text-sm text-dt-text-muted">
              No work experience yet. Adding past roles enriches AI capability analysis and trust scoring.
            </div>
          )}
        </div>

        <form
          className="space-y-4 rounded-2xl border border-dt-border bg-dt-surface/80 p-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-dt-text-muted">Job title</label>
              <Input placeholder="Senior Solidity Engineer" className="mt-2" {...register('title')} />
              {errors.title ? <p className="mt-1 text-xs text-red-500">{errors.title.message}</p> : null}
            </div>
            <div>
              <label className="text-sm text-dt-text-muted">Company</label>
              <Input placeholder="Acme Protocol" className="mt-2" {...register('company')} />
              {errors.company ? <p className="mt-1 text-xs text-red-500">{errors.company.message}</p> : null}
            </div>
          </div>
          <div>
            <label className="text-sm text-dt-text-muted">Location (optional)</label>
            <Input placeholder="Remote / London, UK" className="mt-2" {...register('location')} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm text-dt-text-muted">Start month</label>
              <Input type="month" placeholder="YYYY-MM" className="mt-2" {...register('startMonth')} />
              {errors.startMonth ? <p className="mt-1 text-xs text-red-500">{errors.startMonth.message}</p> : null}
            </div>
            <div>
              <label className="text-sm text-dt-text-muted">End month</label>
              <Input type="month" placeholder="YYYY-MM" className="mt-2" disabled={!!isCurrent} {...register('endMonth')} />
              {errors.endMonth ? <p className="mt-1 text-xs text-red-500">{errors.endMonth.message}</p> : null}
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-dt-text-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-dt-text"
                  {...register('isCurrent')}
                />
                I currently work here
              </label>
            </div>
          </div>
          <div>
            <label className="text-sm text-dt-text-muted">Key achievements</label>
            <Textarea
              rows={3}
              placeholder="Shipped X, reduced latency by Y%, led team of Z."
              className="mt-2"
              {...register('description')}
            />
            {errors.description ? <p className="mt-1 text-xs text-red-500">{errors.description.message}</p> : null}
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : 'Add experience'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default FreelancerExperienceCard;
