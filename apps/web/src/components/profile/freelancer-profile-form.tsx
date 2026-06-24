"use client";

import { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray, type FieldValues } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AiCapabilityBadge } from '@/components/trust-score/ai-capability-badge';
import { userApi, type FreelancerProfile } from '@/lib/api/user';

const availabilityOptions = ['Full-time', 'Part-time', 'Not Available'] as const;

const hourlyRateSchema = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return undefined;
    if (typeof val === 'number') {
      return Number.isNaN(val) ? undefined : val;
    }
    if (typeof val === 'string') {
      if (!val.trim()) return undefined;
      const parsed = Number(val);
      return Number.isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  },
  z
    .number({ invalid_type_error: 'Enter a valid hourly rate' })
    .min(1, 'Hourly rate must be at least $1/hr')
    .max(1000, 'Hourly rate must be under $1,000/hr')
    .optional()
);

const freelancerProfileSchema = z.object({
  title: z
    .string()
    .min(5, 'Add a descriptive headline')
    .max(100, 'Headlines must be under 100 characters'),
  bio: z
    .string()
    .min(120, 'Aim for ~100 words so clients get context')
    .max(2000, 'Keep it under 2,000 characters'),
  hourlyRate: hourlyRateSchema,
  availability: z.preprocess(
    (value) => (value === '' ? undefined : value),
    z.enum(availabilityOptions).optional()
  ),
  location: z
    .string()
    .max(100, 'Location names should stay under 100 characters')
    .optional()
    .or(z.literal('')),
  timezone: z
    .string()
    .max(50, 'Timezone labels should stay under 50 characters')
    .optional()
    .or(z.literal('')),
  languages: z
    .array(z.string().min(2, 'Language names need at least two characters'))
    .min(1, 'Add at least one language')
    .max(10, 'You can track up to 10 languages'),
  portfolioLinks: z
    .array(z.string().url('Use a full URL (https://...)'))
    .max(10, 'Limit portfolio links to 10')
    .default([]),
});

export type FreelancerProfileFormValues = z.infer<typeof freelancerProfileSchema> & FieldValues;

interface FreelancerProfileFormProps {
  profile?: FreelancerProfile | null;
  onUpdated?: (profile: FreelancerProfile) => void;
}

export function FreelancerProfileForm({ profile, onUpdated }: FreelancerProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false);

  const defaultLanguages = profile?.languages?.length ? profile.languages : ['English'];
  const defaultLinks = profile?.portfolioLinks?.length ? profile.portfolioLinks : [];

  const form = useForm<FreelancerProfileFormValues>({
    resolver: zodResolver(freelancerProfileSchema),
    defaultValues: {
      title: profile?.title || '',
      bio: profile?.bio || '',
      hourlyRate: profile?.hourlyRate ? Number(profile.hourlyRate) : undefined,
      availability: (profile?.availability as FreelancerProfileFormValues['availability']) ?? undefined,
      location: profile?.location || '',
      timezone: profile?.timezone || '',
      languages: defaultLanguages,
      portfolioLinks: defaultLinks,
    },
  });

  const { register, control, handleSubmit, reset, formState } = form;
  const { errors, isDirty } = formState;
  const languagesArray = useFieldArray<FreelancerProfileFormValues, 'languages'>({ control, name: 'languages' });
  const linksArray = useFieldArray<FreelancerProfileFormValues, 'portfolioLinks'>({ control, name: 'portfolioLinks' });

  useEffect(() => {
    reset({
      title: profile?.title || '',
      bio: profile?.bio || '',
      hourlyRate: profile?.hourlyRate ? Number(profile.hourlyRate) : undefined,
      availability: (profile?.availability as FreelancerProfileFormValues['availability']) ?? undefined,
      location: profile?.location || '',
      timezone: profile?.timezone || '',
      languages: profile?.languages?.length ? profile.languages : ['English'],
      portfolioLinks: profile?.portfolioLinks || [],
    });
  }, [profile, reset]);

  const addLanguage = () => {
    if (languagesArray.fields.length >= 10) {
      toast.error('You can only track up to 10 languages.');
      return;
    }
    languagesArray.append('');
  };
  const addLink = () => {
    if (linksArray.fields.length >= 10) {
      toast.error('Limit portfolio links to 10.');
      return;
    }
    linksArray.append('https://');
  };

  const completenessScore = useMemo(() => profile?.completenessScore ?? 0, [profile?.completenessScore]);

  const onSubmit = async (values: FreelancerProfileFormValues) => {
    setIsSaving(true);

    const payload = {
      title: values.title.trim(),
      bio: values.bio.trim(),
      hourlyRate: values.hourlyRate,
      availability: values.availability,
      location: values.location?.trim() || undefined,
      timezone: values.timezone?.trim() || undefined,
      languages: values.languages.map((lang) => lang.trim()).filter(Boolean),
      portfolioLinks: values.portfolioLinks?.filter((link) => !!link.trim()),
    };

    const response = await userApi.updateFreelancerProfile(payload);
    setIsSaving(false);

    if (!response.success || !response.data) {
      toast.error(response.error?.message || 'Unable to update freelancer profile');
      return;
    }

    toast.success('Freelancer profile updated');
    onUpdated?.(response.data);
  };

  return (
    <Card className="border-dt-border bg-dt-surface shadow-sm">
      <CardHeader className="flex flex-col gap-2">
        <CardTitle className="text-xl text-dt-text">Freelancer profile</CardTitle>
        <div className="flex items-center gap-3 text-sm text-dt-text-muted">
          <Badge variant="secondary">
            {completenessScore}% complete
          </Badge>
          <span>Trust score {profile?.trustScore ?? 0}%</span>
          <AiCapabilityBadge score={Number(profile?.aiCapabilityScore ?? 0)} size="sm" showScore />
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm text-dt-text-muted">Headline</label>
            <Input placeholder="Lead Solidity Engineer" className="mt-2" {...register('title')} />
            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between text-sm text-dt-text-muted">
              <label>Bio</label>
              <span className="text-xs text-dt-text-muted">Share ~100 words on what you deliver</span>
            </div>
            <Textarea
              rows={6}
              placeholder="Ship how you work, the stacks you own, and proof of impact."
              className="mt-2"
              {...register('bio')}
            />
            {errors.bio && <p className="mt-1 text-sm text-red-500">{errors.bio.message}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm text-dt-text-muted">Hourly rate (USD)</label>
              <Input type="number" step="1" min="1" placeholder="150" className="mt-2" {...register('hourlyRate', { valueAsNumber: true })} />
              {errors.hourlyRate && <p className="mt-1 text-sm text-red-500">{errors.hourlyRate.message as string}</p>}
            </div>
            <div>
              <label className="text-sm text-dt-text-muted">Availability</label>
              <select
                className="mt-2 w-full rounded-xl border border-dt-border bg-dt-input-bg px-3 py-2 text-sm text-dt-text-muted focus:border-emerald-400 focus:outline-none"
                {...register('availability')}
              >
                <option value="">Select availability</option>
                {availabilityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.availability && <p className="mt-1 text-sm text-red-500">{errors.availability.message as string}</p>}
            </div>
            <div>
              <label className="text-sm text-dt-text-muted">Timezone</label>
              <Input placeholder="UTC+1" className="mt-2" {...register('timezone')} />
              {errors.timezone && <p className="mt-1 text-sm text-red-500">{errors.timezone.message as string}</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-dt-text-muted">Location</label>
              <Input placeholder="Lisbon, PT" className="mt-2" {...register('location')} />
              {errors.location && <p className="mt-1 text-sm text-red-500">{errors.location.message as string}</p>}
            </div>
            <div>
              <label className="text-sm text-dt-text-muted">Languages</label>
              <div className="space-y-3">
                {languagesArray.fields.map((field, index) => (
                  <div key={field.id} className="space-y-1">
                    <div className="flex gap-2">
                      <Input {...register(`languages.${index}`)} placeholder="English" />
                      {languagesArray.fields.length > 1 && (
                        <Button type="button" variant="secondary" size="icon" onClick={() => languagesArray.remove(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {errors.languages?.[index]?.message ? (
                      <p className="text-xs text-red-500">{errors.languages?.[index]?.message as string}</p>
                    ) : null}
                  </div>
                ))}
                <Button type="button" variant="ghost" className="text-sm" onClick={addLanguage}>
                  <Plus className="mr-2 h-4 w-4" /> Add language
                </Button>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm text-dt-text-muted">Portfolio links</label>
            <div className="space-y-3">
              {linksArray.fields.map((field, index) => (
                <div key={field.id} className="space-y-1">
                  <div className="flex gap-2">
                    <Input {...register(`portfolioLinks.${index}`)} placeholder="https://" />
                    <Button type="button" variant="secondary" size="icon" onClick={() => linksArray.remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.portfolioLinks?.[index]?.message ? (
                    <p className="text-xs text-red-500">{errors.portfolioLinks?.[index]?.message as string}</p>
                  ) : null}
                </div>
              ))}
            </div>
            <Button type="button" variant="ghost" className="mt-2 text-sm" onClick={addLink}>
              <Plus className="mr-2 h-4 w-4" /> Add link
            </Button>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving || !isDirty}>
              {isSaving ? 'Saving…' : 'Save freelancer profile'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default FreelancerProfileForm;
