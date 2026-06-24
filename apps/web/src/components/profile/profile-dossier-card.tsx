'use client';

import Link from 'next/link';
import { Briefcase, ExternalLink, FolderOpen, GraduationCap, Layers, ScrollText, UploadCloud } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { openSecureFileInNewTab } from '@/lib/secure-files';
import { api } from '@/lib/api/client';
import type { FreelancerProfile, FreelancerSkill, EducationEntry, CertificationEntry, ExperienceEntry, PortfolioItemEntry } from '@/lib/api/user';
import { DossierCredentials } from './dossier-credentials';

export interface ProfileDossierCardProps {
  freelancerProfile: FreelancerProfile;
  isAuthenticated: boolean;
  topSkills: FreelancerSkill[];
  educationEntries: EducationEntry[];
  experienceEntries: ExperienceEntry[];
  portfolioItems: PortfolioItemEntry[];
  certifications: CertificationEntry[];
  certPreviewMap: Record<string, { url: string; mimeType: string }>;
  resumeUploaded: boolean;
  formatEducationRange: (start?: Date | string | null, end?: Date | string | null) => string;
}

export function ProfileDossierCard({
  freelancerProfile,
  isAuthenticated,
  topSkills,
  educationEntries,
  experienceEntries,
  portfolioItems,
  certifications,
  certPreviewMap,
  resumeUploaded,
  formatEducationRange,
}: ProfileDossierCardProps) {
  return (
    <Card className="border-dt-border bg-dt-surface text-dt-text shadow-xl">
      <CardHeader className="space-y-3">
        <p className="text-xs uppercase tracking-[0.45em] text-dt-text-muted">Professional dossier</p>
        <CardTitle className="flex flex-wrap items-center gap-3 text-2xl text-dt-text">
          <Layers className="h-6 w-6 text-dt-text" /> Professional dossier
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {/* Resume */}
          <div className="rounded-3xl border border-dt-border bg-dt-surface-alt p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-dt-text-muted">Resume</p>
                <p className="text-lg font-semibold text-dt-text">{resumeUploaded ? 'Private PDF ready' : 'No resume uploaded'}</p>
              </div>
              <ScrollText className="h-8 w-8 text-dt-text" />
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <Link href="/profile/edit#documents" className="flex items-center gap-2">
                  <UploadCloud className="h-4 w-4" /> Manage
                </Link>
              </Button>
              {resumeUploaded && isAuthenticated && freelancerProfile?.resumeUrl && (
                <Button
                  type="button"
                  variant="secondary"
                                    onClick={() =>
                    openSecureFileInNewTab(freelancerProfile.resumeUrl!, { token: api.getToken() ?? undefined, fallbackName: 'resume.pdf' })
                  }
                >
                  View PDF
                </Button>
              )}
            </div>
          </div>

          {/* Skills */}
          <div className="rounded-3xl border border-dt-border bg-dt-surface-alt p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-dt-text-muted">Skills</p>
                <p className="text-lg font-semibold text-dt-text">{topSkills.length ? 'Core stack' : 'Add skills'}</p>
              </div>
              <Briefcase className="h-7 w-7 text-dt-text-muted" />
            </div>
            {topSkills.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {topSkills.map((skill) => (
                  <div
                    key={skill.id ?? skill.skillId}
                    className="group inline-flex items-center gap-2 rounded-full border border-dt-border bg-dt-surface px-3 py-1 text-sm font-medium text-dt-text-muted"
                  >
                    <span>{skill.skill?.name ?? 'Unnamed skill'}</span>
                    <span className="text-xs uppercase tracking-wide text-dt-text-muted">{skill.verificationStatus ? skill.verificationStatus.toLowerCase() : 'unverified'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed border-dt-border bg-dt-surface/60 p-4 text-sm text-dt-text-muted">Document skills inside the editor.</p>
            )}
          </div>

          {/* Education */}
          <div className="rounded-3xl border border-dt-border bg-dt-surface-alt p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-dt-text-muted">Education</p>
                <p className="text-lg font-semibold text-dt-text">{educationEntries.length ? 'Recent study' : 'Add entries'}</p>
              </div>
              <GraduationCap className="h-7 w-7 text-dt-text-muted" />
            </div>
            {educationEntries.length ? (
              <div className="mt-4 space-y-3">
                {educationEntries.map((entry) => (
                  <div key={entry.id} className="rounded-2xl border border-slate-100 bg-dt-surface-alt/70 p-3">
                    <p className="text-sm font-semibold text-dt-text">{entry.degree || 'Program'} &middot; {entry.institution}</p>
                    <p className="text-xs text-dt-text-muted">{formatEducationRange(entry.startDate, entry.endDate)}</p>
                    {entry.fieldOfStudy ? <p className="text-xs text-dt-text-muted">{entry.fieldOfStudy}</p> : null}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed border-dt-border bg-dt-surface-alt/60 p-4 text-sm text-dt-text-muted">Log schools, bootcamps, or certifications.</p>
            )}
          </div>

          {/* Credentials */}
          <DossierCredentials certifications={certifications} certPreviewMap={certPreviewMap} />

          {/* Experience */}
          <div className="rounded-3xl border border-dt-border bg-dt-surface-alt p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-dt-text-muted">Work experience</p>
                <p className="text-lg font-semibold text-dt-text">{experienceEntries.length ? 'Career timeline' : 'No entries yet'}</p>
              </div>
              <Briefcase className="h-7 w-7 text-dt-text-muted" />
            </div>
            {experienceEntries.length ? (
              <div className="mt-4 space-y-3">
                {experienceEntries.map((exp) => (
                  <div key={exp.id} className="rounded-2xl border border-slate-100 bg-dt-surface-alt/70 p-3">
                    <p className="text-sm font-semibold text-dt-text">{exp.title}</p>
                    <p className="text-xs text-dt-text-muted">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                    <p className="text-xs text-dt-text-muted">
                      {formatEducationRange(exp.startDate, exp.isCurrent ? null : exp.endDate)}
                      {exp.isCurrent && <span className="ml-2 text-dt-text-muted">· Current</span>}
                    </p>
                    {exp.description && <p className="mt-1 text-xs text-dt-text-muted">{exp.description}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed border-dt-border bg-dt-surface-alt/60 p-4 text-sm text-dt-text-muted">Add work experience from your profile editor.</p>
            )}
          </div>

          {/* Portfolio */}
          <div className="rounded-3xl border border-dt-border bg-dt-surface-alt p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-dt-text-muted">Portfolio</p>
                <p className="text-lg font-semibold text-dt-text">{portfolioItems.length ? 'Showcase projects' : 'No projects yet'}</p>
              </div>
              <FolderOpen className="h-7 w-7 text-dt-text-muted" />
            </div>
            {portfolioItems.length ? (
              <div className="mt-4 space-y-3">
                {portfolioItems.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-100 bg-dt-surface-alt/70 p-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-dt-text">{item.title}</p>
                      {item.isFeatured && <span className="rounded-full bg-dt-surface px-2 py-0.5 text-[10px] font-medium text-dt-text">Featured</span>}
                    </div>
                    {item.description && <p className="mt-1 text-xs text-dt-text-muted">{item.description}</p>}
                    {item.techStack.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.techStack.map((tech) => (
                          <span key={tech} className="rounded-full border border-dt-border bg-dt-surface px-2 py-0.5 text-[10px] text-dt-text-muted">{tech}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2 flex gap-3">
                      {item.projectUrl && (
                        <a href={item.projectUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-dt-text underline">
                          Live <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {item.repoUrl && (
                        <a href={item.repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-dt-text underline">
                          Repo <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-2xl border border-dashed border-dt-border bg-dt-surface-alt/60 p-4 text-sm text-dt-text-muted">Showcase your best projects from the profile editor.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
