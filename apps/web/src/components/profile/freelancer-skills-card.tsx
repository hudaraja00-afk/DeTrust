"use client";

import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { Loader2, Plus, ShieldCheck, Sparkles, Target, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { skillApi, type SkillSummary } from '@/lib/api/skill';
import { userApi, type FreelancerSkill } from '@/lib/api/user';

interface FreelancerSkillsCardProps {
  skills?: FreelancerSkill[];
  onSkillAdded?: (skill: FreelancerSkill) => void;
  onSkillRemoved?: (skillId: string) => void;
  onSync?: () => void | Promise<void>;
  maxSkills?: number;
}

const SKILL_LIMIT = 15;
const PROFICIENCY_MIN = 1;
const PROFICIENCY_MAX = 5;

const statusStyles: Record<
  FreelancerSkill['verificationStatus'],
  { label: string; variant: 'success' | 'warning' | 'secondary' | 'destructive'; className?: string }
> = {
  VERIFIED: { label: 'Verified', variant: 'success' },
  PENDING: { label: 'Pending', variant: 'warning' },
  UNVERIFIED: { label: 'Unverified', variant: 'secondary', className: 'bg-dt-surface-alt text-dt-text-muted' },
  EXPIRED: { label: 'Expired', variant: 'destructive' },
};

type SkillResult = SkillSummary;

export function FreelancerSkillsCard({
  skills = [],
  onSkillAdded,
  onSkillRemoved,
  onSync,
  maxSkills = SKILL_LIMIT,
}: FreelancerSkillsCardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [catalog, setCatalog] = useState<SkillResult[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillResult | null>(null);
  const [yearsExperience, setYearsExperience] = useState('3');
  const [proficiency, setProficiency] = useState(3);
  const [pendingSkillId, setPendingSkillId] = useState<string | null>(null);
  const [removingSkillId, setRemovingSkillId] = useState<string | null>(null);
  const [hasLoadedCatalog, setHasLoadedCatalog] = useState(false);

  const reachedLimit = skills.length >= maxSkills;
  const skillIds = useMemo(() => new Set(skills.map((entry) => entry.skillId)), [skills]);

  const fetchCatalog = useCallback(
    async (term?: string) => {
      setIsLoadingCatalog(true);
      const response = await skillApi.list({ search: term, limit: 50 });
      setIsLoadingCatalog(false);

      if (!response.success || !response.data) {
        setCatalogError(response.error?.message || 'Skill directory unavailable.');
        setCatalog([]);
        return;
      }

      setCatalogError(null);
      setCatalog(response.data.items);
      setHasLoadedCatalog(true);
    },
    []
  );

  useEffect(() => {
    void fetchCatalog();
  }, [fetchCatalog]);

  useEffect(() => {
    if (!hasLoadedCatalog && !searchTerm) {
      return;
    }

    const handler = setTimeout(() => {
      void fetchCatalog(searchTerm || undefined);
    }, 350);

    return () => clearTimeout(handler);
  }, [fetchCatalog, searchTerm, hasLoadedCatalog]);

  const filteredCatalog = useMemo(() => catalog.filter((skill) => !skillIds.has(skill.id)), [catalog, skillIds]);
  const topSuggestion = useMemo(() => filteredCatalog[0] ?? null, [filteredCatalog]);

  const resetSelection = () => {
    setSelectedSkill(null);
    setYearsExperience('3');
    setProficiency(3);
    setPendingSkillId(null);
  };

  const handleAddSkill = async () => {
    if (!selectedSkill) {
      toast.error('Select a skill before adding it to your profile.');
      return;
    }

    if (reachedLimit) {
      toast.error(`You can only showcase ${maxSkills} skills.`);
      return;
    }

    const parsedYears = yearsExperience.trim() === '' ? undefined : Number(yearsExperience);
    if (parsedYears !== undefined && (Number.isNaN(parsedYears) || parsedYears < 0 || parsedYears > 50)) {
      toast.error('Years of experience must be between 0 and 50.');
      return;
    }

    setPendingSkillId(selectedSkill.id);
    const response = await userApi.addSkill(selectedSkill.id, parsedYears, proficiency);
    setPendingSkillId(null);

    if (!response.success || !response.data) {
      toast.error(response.error?.message || 'Unable to add skill');
      return;
    }

    toast.success(`${selectedSkill.name} added to your profile`);
    onSkillAdded?.(response.data);
    resetSelection();
    await onSync?.();
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    if (pendingSkillId) return;
    event.preventDefault();
    if (selectedSkill) {
      void handleAddSkill();
      return;
    }
    if (topSuggestion) {
      setSelectedSkill(topSuggestion);
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    setRemovingSkillId(skillId);
    const response = await userApi.removeSkill(skillId);
    setRemovingSkillId(null);

    if (!response.success) {
      toast.error(response.error?.message || 'Unable to remove skill');
      return;
    }

    toast.success('Skill removed');
    onSkillRemoved?.(skillId);
    await onSync?.();
  };

  const emptyState = (
    <div className="rounded-2xl border border-dashed border-dt-border bg-dt-surface-alt p-6 text-center">
      <Sparkles className="mx-auto h-6 w-6 text-dt-text" />
      <p className="mt-3 text-sm font-medium text-dt-text">No skills yet</p>
      <p className="text-sm text-dt-text-muted">Add at least three skills to improve your profile.</p>
    </div>
  );

  const renderSkillRow = (entry: FreelancerSkill) => {
    const status = statusStyles[entry.verificationStatus] ?? statusStyles.UNVERIFIED;
    return (
      <div
        key={entry.skillId}
        className="flex flex-col gap-3 rounded-2xl border border-dt-border bg-dt-surface/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p className="text-sm font-semibold text-dt-text">{entry.skill?.name}</p>
          <div className="text-xs text-dt-text-muted">
            <span>{entry.skill?.category}</span>
            {entry.yearsExperience !== undefined && (
              <span className="ml-2">· {entry.yearsExperience} yrs</span>
            )}
            {entry.proficiencyLevel && (
              <span className="ml-2">· Level {entry.proficiencyLevel}</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={status.variant} className={status.className}>
            {status.label}
          </Badge>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-dt-text-muted"
            disabled={removingSkillId === entry.skillId}
            onClick={() => handleRemoveSkill(entry.skillId)}
          >
            {removingSkillId === entry.skillId ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removing
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" /> Remove
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-dt-border bg-dt-surface shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-dt-text">
          <ShieldCheck className="h-5 w-5 text-dt-text" /> Skills
        </CardTitle>
        <p className="text-sm text-dt-text-muted">Track up to {maxSkills} skills.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <section>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-dt-text-muted">
            <Target className="h-4 w-4" /> Your current stack
          </div>
          <div className="mt-4 space-y-3">
            {skills.length ? skills.map(renderSkillRow) : emptyState}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-dt-text-muted">
            <Sparkles className="h-4 w-4 text-dt-text" /> Add skills
          </div>
          {reachedLimit ? (
            <div className="mt-4 rounded-2xl border border-dt-border bg-dt-surface-alt p-4 text-sm text-dt-text">
              You&apos;ve added the maximum number of skills. Remove one to add another.
            </div>
          ) : (
            <div className="mt-4 space-y-4 rounded-3xl border border-dt-border bg-dt-surface/90 p-5 shadow-sm">
              <div className="flex items-center justify-between text-sm text-dt-text-muted">
                <span>Skill directory</span>
                <Badge variant="outline">{skills.length}/{maxSkills} filled</Badge>
              </div>
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search e.g. Solidity, React"
                onKeyDown={handleSearchKeyDown}
              />
              {catalogError ? (
                <p className="text-sm text-red-500">{catalogError}</p>
              ) : isLoadingCatalog ? (
                <div className="flex items-center gap-2 text-sm text-dt-text-muted">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading catalog…
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredCatalog.length === 0 ? (
                    <p className="text-sm text-dt-text-muted">No matching skills found.</p>
                  ) : (
                    filteredCatalog.slice(0, 6).map((skill) => (
                      <button
                        key={skill.id}
                        type="button"
                        className={`w-full rounded-2xl border px-3 py-2 text-left transition hover:border-dt-border ${
                          selectedSkill?.id === skill.id ? 'border-dt-border bg-dt-surface-alt' : 'border-dt-border bg-dt-surface'
                        }`}
                        onClick={() => setSelectedSkill(skill)}
                        disabled={pendingSkillId !== null}
                      >
                        <p className="text-sm font-medium text-dt-text">{skill.name}</p>
                        <p className="text-xs text-dt-text-muted">{skill.category}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedSkill ? (
                <div className="space-y-4 rounded-2xl border border-dt-border bg-dt-surface-alt p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-dt-text">{selectedSkill.name}</p>
                      <p className="text-xs text-dt-text-muted">{selectedSkill.category}</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={resetSelection}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs uppercase tracking-[0.3em] text-dt-text-muted">Years experience</label>
                      <Input
                        type="number"
                        min={0}
                        max={50}
                        value={yearsExperience}
                        onChange={(event) => setYearsExperience(event.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs uppercase tracking-[0.3em] text-dt-text-muted">Proficiency (1-5)</label>
                      <div className="mt-3 flex items-center gap-3">
                        <input
                          type="range"
                          min={PROFICIENCY_MIN}
                          max={PROFICIENCY_MAX}
                          value={proficiency}
                          onChange={(event) => setProficiency(Number(event.target.value))}
                          className="h-1 flex-1"
                        />
                        <span className="text-sm text-dt-text-muted">Lvl {proficiency}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-dt-border bg-dt-surface/70 p-4 text-sm text-dt-text-muted">
                  Select a skill from the directory.
                </div>
              )}
              <Button
                type="button"
                className="w-full"
                disabled={!selectedSkill || pendingSkillId !== null}
                onClick={handleAddSkill}
              >
                {pendingSkillId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding skill…
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" /> Add skill
                  </>
                )}
              </Button>
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

export default FreelancerSkillsCard;
