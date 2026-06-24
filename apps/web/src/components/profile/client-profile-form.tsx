"use client";

import { useEffect, useState } from 'react';
import { useForm, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { userApi, type ClientProfile } from '@/lib/api/user';

const companySizeOptions = ['1-10', '11-50', '51-200', '201-500', '500+'] as const;
type CompanySizeOption = (typeof companySizeOptions)[number];

const isCompanySizeOption = (value: string): value is CompanySizeOption =>
  (companySizeOptions as readonly string[]).includes(value as CompanySizeOption);

const normalizeCompanySize = (value?: string | null): '' | CompanySizeOption => {
  if (!value) return '';
  return isCompanySizeOption(value) ? value : '';
};

const clientProfileSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  companySize: z.enum(companySizeOptions).optional().or(z.literal('')),
  industry: z.string().optional().or(z.literal('')),
  companyWebsite: z.string().url('Enter a valid URL including https://').optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  location: z.string().optional().or(z.literal('')),
});

export type ClientProfileFormValues = z.infer<typeof clientProfileSchema>;

interface ClientProfileFormProps {
  profile?: ClientProfile | null;
  onUpdated?: (profile: ClientProfile) => void;
}

export function ClientProfileForm({ profile, onUpdated }: ClientProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ClientProfileFormValues>({
    resolver: zodResolver(clientProfileSchema) as Resolver<ClientProfileFormValues>,
    defaultValues: {
      companyName: profile?.companyName || '',
      companySize: normalizeCompanySize(profile?.companySize),
      industry: profile?.industry || '',
      companyWebsite: profile?.companyWebsite || '',
      description: profile?.description || '',
      location: profile?.location || '',
    },
  });

  useEffect(() => {
    reset({
      companyName: profile?.companyName || '',
      companySize: normalizeCompanySize(profile?.companySize),
      industry: profile?.industry || '',
      companyWebsite: profile?.companyWebsite || '',
      description: profile?.description || '',
      location: profile?.location || '',
    });
  }, [profile, reset]);

  const onSubmit = async (values: ClientProfileFormValues) => {
    setIsSaving(true);

    const payload = {
      companyName: values.companyName,
      companySize: values.companySize?.trim() || undefined,
      industry: values.industry?.trim() || undefined,
      companyWebsite: values.companyWebsite?.trim() || undefined,
      description: values.description?.trim() || undefined,
      location: values.location?.trim() || undefined,
    };

    const response = await userApi.updateClientProfile(payload);
    setIsSaving(false);

    if (!response.success || !response.data) {
      toast.error(response.error?.message || 'Unable to update client profile');
      return;
    }

    toast.success('Client profile saved');
    onUpdated?.(response.data);
  };

  return (
    <Card className="border-dt-border bg-dt-surface shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl text-dt-text">Client organization</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-dt-text-muted">Company name</label>
              <Input placeholder="Atlas Robotics" {...register('companyName')} className="mt-2" />
              {errors.companyName && <p className="text-sm text-red-500">{errors.companyName.message}</p>}
            </div>
            <div>
              <label className="text-sm text-dt-text-muted">Team size</label>
              <select
                className="mt-2 w-full rounded-xl border border-dt-border bg-dt-input-bg px-3 py-2 text-sm text-dt-text-muted focus:border-emerald-400 focus:outline-none"
                {...register('companySize')}
              >
                <option value="">Select size</option>
                {companySizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.companySize && <p className="text-sm text-red-500">Choose one of the supported ranges.</p>}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm text-dt-text-muted">Industry</label>
              <Input placeholder="Climate fintech" {...register('industry')} className="mt-2" />
            </div>
            <div>
              <label className="text-sm text-dt-text-muted">Website</label>
              <Input placeholder="https://atlas.io" {...register('companyWebsite')} className="mt-2" />
              {errors.companyWebsite && <p className="text-sm text-red-500">{errors.companyWebsite.message}</p>}
            </div>
          </div>

          <div>
            <label className="text-sm text-dt-text-muted">Location</label>
            <Input placeholder="Toronto, CA" {...register('location')} className="mt-2" />
          </div>

          <div>
            <label className="text-sm text-dt-text-muted">Company narrative</label>
            <Textarea rows={5} placeholder="What should freelancers know before collaborating?" {...register('description')} className="mt-2" />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving || !isDirty}>
              {isSaving ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default ClientProfileForm;
