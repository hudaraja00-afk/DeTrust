"use client";

import { useState } from 'react';
import { useForm, useFieldArray, type FieldValues } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink, Github, Layers, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { userApi, type PortfolioItemEntry, type PortfolioItemPayload } from '@/lib/api/user';

const portfolioSchema = z.object({
  title: z.string().min(2, 'Project title is required').max(200),
  description: z.string().max(2000).optional(),
  projectUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  repoUrl: z.string().url('Enter a valid URL').optional().or(z.literal('')),
  techStack: z.array(z.string().min(1).max(50)).max(20).default([]),
  isFeatured: z.boolean().optional(),
});

type PortfolioFormValues = z.infer<typeof portfolioSchema> & FieldValues;

interface FreelancerPortfolioCardProps {
  portfolioItems?: PortfolioItemEntry[];
  onAdded?: (item: PortfolioItemEntry) => void;
  onRemoved?: (id: string) => void;
  onSync?: () => Promise<void> | void;
  maxItems?: number;
}

const ITEM_LIMIT = 12;

export function FreelancerPortfolioCard({
  portfolioItems = [],
  onAdded,
  onRemoved,
  onSync,
  maxItems = ITEM_LIMIT,
}: FreelancerPortfolioCardProps) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const reachedLimit = portfolioItems.length >= maxItems;

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PortfolioFormValues>({
    resolver: zodResolver(portfolioSchema),
    defaultValues: {
      title: '',
      description: '',
      projectUrl: '',
      repoUrl: '',
      techStack: [],
      isFeatured: false,
    },
  });

  const techStackArray = useFieldArray<PortfolioFormValues, 'techStack'>({ control, name: 'techStack' });

  const onSubmit = async (values: PortfolioFormValues) => {
    const payload: PortfolioItemPayload = {
      title: values.title.trim(),
      description: values.description?.trim() || undefined,
      projectUrl: values.projectUrl?.trim() || undefined,
      repoUrl: values.repoUrl?.trim() || undefined,
      techStack: values.techStack.map((t) => t.trim()).filter(Boolean),
      isFeatured: values.isFeatured ?? false,
    };

    const response = await userApi.addPortfolioItem(payload);

    if (!response.success || !response.data) {
      toast.error(response.error?.message || 'Could not add portfolio item');
      return;
    }

    toast.success('Portfolio item added');
    reset();
    onAdded?.(response.data as PortfolioItemEntry);
    await onSync?.();
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    const response = await userApi.removePortfolioItem(id);
    setRemovingId(null);

    if (!response.success) {
      toast.error(response.error?.message || 'Unable to remove portfolio item');
      return;
    }

    toast.success('Portfolio item removed');
    onRemoved?.(id);
    await onSync?.();
  };

  return (
    <Card className="border-dt-border bg-dt-surface shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base text-dt-text">
          <span className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-dt-text" />
            Portfolio
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{portfolioItems.length}/{maxItems}</Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {portfolioItems.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {portfolioItems.map((item) => (
              <div
                key={item.id}
                className="relative flex flex-col gap-3 rounded-2xl border border-dt-border bg-dt-surface-alt/80 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-dt-text">{item.title}</p>
                      {item.isFeatured ? (
                        <Star className="h-3.5 w-3.5 flex-shrink-0 fill-dt-text text-dt-text" />
                      ) : null}
                    </div>
                    {item.description ? (
                      <p className="mt-1 line-clamp-2 text-xs text-dt-text-muted">{item.description}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => handleRemove(item.id)}
                    disabled={removingId === item.id}
                    aria-label="Remove portfolio item"
                  >
                    <Trash2 className={`h-4 w-4 ${removingId === item.id ? 'animate-pulse text-dt-text-muted' : 'text-dt-text-muted'}`} />
                  </Button>
                </div>

                {item.techStack.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {item.techStack.map((tech) => (
                      <Badge key={tech} variant="secondary" className="bg-dt-surface text-xs text-dt-text-muted">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                <div className="flex items-center gap-3 text-xs text-dt-text-muted">
                  {item.projectUrl ? (
                    <a
                      href={item.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-dt-text transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Live
                    </a>
                  ) : null}
                  {item.repoUrl ? (
                    <a
                      href={item.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-dt-text transition-colors"
                    >
                      <Github className="h-3.5 w-3.5" /> Repo
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-dt-border bg-dt-surface-alt p-6 text-center text-sm text-dt-text-muted">
            No portfolio items yet. Showcasing shipped projects signals real-world capability to clients and AI scoring.
          </div>
        )}

        {reachedLimit ? (
          <div className="rounded-2xl border border-dt-border bg-dt-surface-alt p-4 text-sm text-dt-text">
            You&apos;ve reached the maximum of {maxItems} portfolio items. Remove one to add another.
          </div>
        ) : (
          <form
            className="space-y-4 rounded-2xl border border-dt-border bg-dt-surface/80 p-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm text-dt-text-muted">Project title</label>
                <Input placeholder="DeFi Yield Aggregator" className="mt-2" {...register('title')} />
                {errors.title ? <p className="mt-1 text-xs text-red-500">{errors.title.message}</p> : null}
              </div>
              <div>
                <label className="text-sm text-dt-text-muted">Live URL</label>
                <Input placeholder="https://app.xyz" className="mt-2" {...register('projectUrl')} />
                {errors.projectUrl ? <p className="mt-1 text-xs text-red-500">{errors.projectUrl.message}</p> : null}
              </div>
              <div>
                <label className="text-sm text-dt-text-muted">Repository URL</label>
                <Input placeholder="https://github.com/you/repo" className="mt-2" {...register('repoUrl')} />
                {errors.repoUrl ? <p className="mt-1 text-xs text-red-500">{errors.repoUrl.message}</p> : null}
              </div>
            </div>

            <div>
              <label className="text-sm text-dt-text-muted">Description</label>
              <Textarea
                rows={3}
                placeholder="What problem does it solve, what was your role, and what was the outcome?"
                className="mt-2"
                {...register('description')}
              />
              {errors.description ? <p className="mt-1 text-xs text-red-500">{errors.description.message}</p> : null}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-sm text-dt-text-muted">Tech stack</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-xs text-dt-text-muted"
                  onClick={() => techStackArray.fields.length < 20 && techStackArray.append('')}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" /> Add tech
                </Button>
              </div>
              {techStackArray.fields.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {techStackArray.fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-1">
                      <Input
                        {...register(`techStack.${index}`)}
                        placeholder="Solidity"
                        className="w-28 text-xs"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => techStackArray.remove(index)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-dt-text-muted" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-dt-text-muted cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  {...register('isFeatured')}
                />
                Pin as featured project
              </label>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Add project'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

export default FreelancerPortfolioCard;
