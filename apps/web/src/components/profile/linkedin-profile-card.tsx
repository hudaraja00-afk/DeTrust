'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Globe, Calendar, Briefcase, GraduationCap, FolderOpen, Layers, ExternalLink, Shield, Sparkles, Building2, Award, UploadCloud, WalletMinimal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { AiCapabilityBadge } from '@/components/trust-score/ai-capability-badge';
import { openSecureFileInNewTab } from '@/lib/secure-files';
import { api } from '@/lib/api/client';
import type { User, FreelancerProfile, ClientProfile, FreelancerSkill, EducationEntry, ExperienceEntry, PortfolioItemEntry, CertificationEntry } from '@/lib/api/user';

export interface LinkedInProfileCardProps {
  profile: User;
  isFreelancer: boolean;
  freelancerProfile: FreelancerProfile | null;
  clientProfile: ClientProfile | null;
  avatarObjectUrl: string | null;
  avatarLoading: boolean;
  walletBadgeLabel: string;
  completion: number;
  languages: string;
  topSkills: FreelancerSkill[];
  educationEntries: EducationEntry[];
  experienceEntries: ExperienceEntry[];
  portfolioItems: PortfolioItemEntry[];
  certifications: CertificationEntry[];
  certPreviewMap: Record<string, { url: string; mimeType: string }>;
  resumeUploaded: boolean;
  formatEducationRange: (start?: Date | string | null, end?: Date | string | null) => string;
}

export function LinkedInProfileCard({
  profile,
  isFreelancer,
  freelancerProfile,
  clientProfile,
  avatarObjectUrl,
  avatarLoading,
  walletBadgeLabel,
  completion,
  languages,
  topSkills,
  educationEntries,
  experienceEntries,
  portfolioItems,
  certifications,
  certPreviewMap,
  resumeUploaded,
  formatEducationRange,
}: LinkedInProfileCardProps) {
  const portfolio = freelancerProfile?.portfolioLinks?.[0];
  const clientWebsite = clientProfile?.companyWebsite;
  const certificationCount = certifications.length;

  // Highlight stats for freelancers
  const highlightStats = isFreelancer
    ? [
        { label: 'Trust score', value: `${freelancerProfile?.trustScore ?? 0}%`, detail: `${freelancerProfile?.totalReviews ?? 0} on-chain reviews`, icon: <Shield className="h-4 w-4 text-dt-text" /> },
        { label: 'AI capability', value: `${freelancerProfile?.aiCapabilityScore ?? 0}%`, detail: 'Signals refresh after each skill update', icon: <Sparkles className="h-4 w-4 text-dt-text" /> },
        { label: 'Jobs shipped', value: `${freelancerProfile?.completedJobs ?? 0}`, detail: `${freelancerProfile?.avgRating != null ? Number(freelancerProfile.avgRating).toFixed(1) : '—'} star avg`, icon: <Building2 className="h-4 w-4 text-dt-text" /> },
      ]
    : [
        { label: 'Trust score', value: `${clientProfile?.trustScore ?? 0}%`, detail: `${clientProfile?.totalReviews ?? 0} talent reviews`, icon: <Shield className="h-4 w-4 text-dt-text" /> },
        { label: 'Hire rate', value: `${clientProfile?.hireRate ?? 0}%`, detail: `${clientProfile?.jobsPosted ?? 0} jobs posted`, icon: <Building2 className="h-4 w-4 text-dt-text" /> },
        { label: 'Payment status', value: clientProfile?.paymentVerified ? 'Verified' : 'Pending', detail: clientProfile?.paymentVerified ? 'Escrow ready' : 'Connect wallet to auto-verify', icon: <WalletMinimal className="h-4 w-4 text-dt-text" /> },
      ];

  return (
    <div className="overflow-hidden rounded-2xl border border-dt-border bg-dt-surface">
      {/* Cover/Header Area */}
      <div className="h-32 bg-gradient-to-r from-emerald-500 to-emerald-600" />
      
      {/* Profile Header */}
      <div className="px-6 pb-6">
        {/* Avatar */}
        <div className="-mt-16 mb-4">
          <div className="group relative inline-block h-32 w-32 overflow-hidden rounded-full border-4 border-dt-surface bg-dt-surface shadow-lg">
            {avatarObjectUrl ? (
              <Image 
                src={avatarObjectUrl} 
                alt={profile.name ?? 'Avatar'} 
                fill 
                className="object-cover" 
                sizes="128px" 
                unoptimized 
              />
            ) : avatarLoading ? (
              <div className="flex h-full w-full items-center justify-center">
                <Spinner size="sm" />
              </div>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl">{'\u{1FAAA}'}</div>
            )}
          </div>
        </div>

        {/* Name & Headline */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-dt-text">{profile.name || 'Unnamed talent'}</h1>
          <p className="text-base text-dt-text-muted">
            {isFreelancer ? freelancerProfile?.title || 'Add a headline to unlock discovery' : clientProfile?.companyName || 'Add your organization name'}
          </p>
          
          {/* Location & Info */}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-dt-text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {freelancerProfile?.location || clientProfile?.location || 'Location TBD'}
            </span>
            {languages && (
              <span className="inline-flex items-center gap-1">
                <Globe className="h-4 w-4" />
                {languages}
              </span>
            )}
            {freelancerProfile?.timezone && (
              <span className="inline-flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                UTC {freelancerProfile.timezone}
              </span>
            )}
          </div>

          {/* Links */}
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            {portfolio && (
              <Link href={portfolio} target="_blank" className="inline-flex items-center gap-1 font-medium text-dt-text underline">
                <Globe className="h-4 w-4" /> Portfolio
              </Link>
            )}
            {clientWebsite && (
              <Link href={clientWebsite} target="_blank" className="inline-flex items-center gap-1 font-medium text-dt-text underline">
                <Globe className="h-4 w-4" /> Website
              </Link>
            )}
            {resumeUploaded && (
              <button
                onClick={() => freelancerProfile?.resumeUrl && openSecureFileInNewTab(freelancerProfile.resumeUrl, { token: api.getToken() ?? undefined, fallbackName: 'resume.pdf' })}
                className="inline-flex items-center gap-1 font-medium text-dt-text underline"
              >
                <Briefcase className="h-4 w-4" /> Resume
              </button>
            )}
          </div>

          {/* Badges */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-dt-surface-alt px-3 py-1 text-xs font-medium text-dt-text">
              {walletBadgeLabel}
            </span>
            {isFreelancer && typeof freelancerProfile?.aiCapabilityScore === 'number' && (
              <AiCapabilityBadge score={freelancerProfile.aiCapabilityScore} size="sm" />
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-dt-surface-alt px-3 py-1 text-xs text-dt-text-muted">
              Profile {completion}% complete
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <Button asChild>
            <Link href="/profile/edit">Edit profile</Link>
          </Button>
        </div>

        {/* All Sections - Single Page View */}
        <div className="space-y-8">
          {/* About Section */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-dt-text">About</h2>
            <p className="text-sm leading-relaxed text-dt-text-muted">
              {isFreelancer 
                ? freelancerProfile?.bio || 'Share how you work, the stacks you own, and proof of impact.' 
                : clientProfile?.description || 'Describe what you are building to attract senior talent.'
              }
            </p>
          </section>

          {/* Highlight Stats */}
          <section>
            <div className="grid gap-4 md:grid-cols-3">
              {highlightStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-dt-border bg-dt-surface-alt p-4">
                  <div className="flex items-center gap-3 text-sm text-dt-text-muted">
                    {stat.icon}
                    <span>{stat.label}</span>
                  </div>
                  <div className="mt-3 text-2xl font-semibold text-dt-text">{stat.value}</div>
                  <p className="text-sm text-dt-text-muted">{stat.detail}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Freelancer Sections */}
          {isFreelancer && (
            <>
              {/* Experience Section */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-dt-text flex items-center gap-2">
                  <Briefcase className="h-5 w-5" /> Experience
                </h2>
                {experienceEntries.length ? (
                  <div className="space-y-4">
                    {experienceEntries.map((exp) => (
                      <div key={exp.id} className="border-l-2 border-dt-border pl-4">
                        <h3 className="font-semibold text-dt-text">{exp.title}</h3>
                        <p className="text-sm text-dt-text-muted">{exp.company}</p>
                        <p className="text-xs text-dt-text-muted">
                          {formatEducationRange(exp.startDate, exp.isCurrent ? null : exp.endDate)}
                          {exp.isCurrent && <span className="ml-2 text-dt-text-muted">· Current</span>}
                        </p>
                        {exp.location && <p className="text-xs text-dt-text-muted">{exp.location}</p>}
                        {exp.description && <p className="mt-2 text-sm text-dt-text-muted">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-dt-text-muted">No work experience added yet.</p>
                )}
              </section>

              {/* Skills Section */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-dt-text flex items-center gap-2">
                  <Layers className="h-5 w-5" /> Skills
                </h2>
                {topSkills.length ? (
                  <div className="flex flex-wrap gap-2">
                    {topSkills.map((skill) => (
                      <span
                        key={skill.id ?? skill.skillId}
                        className="rounded-full border border-dt-border bg-dt-surface px-4 py-2 text-sm font-medium text-dt-text"
                      >
                        {skill.skill?.name ?? 'Unnamed skill'}
                        {skill.verificationStatus && (
                          <span className="ml-2 text-xs text-dt-text-muted">{skill.verificationStatus.toLowerCase()}</span>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-dt-text-muted">No skills added yet.</p>
                )}
              </section>

              {/* Education Section */}
              {educationEntries.length > 0 && (
                <section>
                  <h2 className="mb-4 text-lg font-semibold text-dt-text flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" /> Education
                  </h2>
                  <div className="space-y-4">
                    {educationEntries.map((entry) => (
                      <div key={entry.id} className="border-l-2 border-dt-border pl-4">
                        <h3 className="font-semibold text-dt-text">{entry.institution}</h3>
                        <p className="text-sm text-dt-text-muted">{entry.degree}</p>
                        {entry.fieldOfStudy && <p className="text-sm text-dt-text-muted">{entry.fieldOfStudy}</p>}
                        <p className="text-xs text-dt-text-muted">{formatEducationRange(entry.startDate, entry.endDate)}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Certifications Section */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-dt-text flex items-center gap-2">
                  <Award className="h-5 w-5" /> Certifications
                </h2>
                {certificationCount > 0 ? (
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr),minmax(0,0.9fr)]">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {certifications.slice(0, 3).map((cert) => {
                        const preview = certPreviewMap[cert.id];
                        return (
                          <div key={cert.id} className="rounded-2xl border border-dt-border bg-dt-surface-alt p-3">
                            <div className="relative overflow-hidden rounded-xl border border-dt-border bg-dt-surface">
                              {preview ? (
                                <img src={preview.url} alt={`${cert.name} credential`} className="h-28 w-full object-cover" loading="lazy" />
                              ) : (
                                <div className="flex h-28 items-center justify-center text-xs text-dt-text-muted">
                                  {cert.credentialUrl ? 'Asset ready — open to review' : 'No credential attached'}
                                </div>
                              )}
                            </div>
                            <p className="mt-3 text-sm font-medium text-dt-text">{cert.name}</p>
                            <p className="text-xs text-dt-text-muted">{cert.issuer}</p>
                          </div>
                        );
                      })}
                    </div>
                    <div className="rounded-2xl border border-dt-border bg-dt-surface-alt p-4">
                      <ul className="space-y-3 text-sm text-dt-text-muted">
                        {certifications.slice(0, 4).map((cert) => (
                          <li key={cert.id} className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-dt-text">{cert.name}</p>
                              <p className="text-xs text-dt-text-muted">{cert.issuer}</p>
                            </div>
                            <Badge variant="outline" className="border-dt-border text-xs text-dt-text-muted">
                              {cert.issueDate ? new Date(cert.issueDate).getFullYear() : 'Year TBD'}
                            </Badge>
                          </li>
                        ))}
                      </ul>
                      {certificationCount > 4 && (
                        <p className="mt-3 text-xs text-dt-text-muted">+{certificationCount - 4} more credential{certificationCount - 4 === 1 ? '' : 's'} stored</p>
                      )}
                      <Button asChild variant="ghost" className="mt-4 w-full justify-center">
                        <Link href="/profile/edit#documents" className="flex items-center gap-2">
                          <UploadCloud className="h-4 w-4" /> Manage credentials
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-dt-border bg-dt-surface-alt p-6 text-sm text-dt-text-muted">
                    Add certifications or references inside the documents section.
                  </div>
                )}
              </section>

              {/* Portfolio Section */}
              <section>
                <h2 className="mb-4 text-lg font-semibold text-dt-text flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" /> Portfolio
                </h2>
                {portfolioItems.length ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {portfolioItems.map((item) => (
                      <div key={item.id} className="rounded-xl border border-dt-border p-4">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-dt-text">{item.title}</h3>
                          {item.isFeatured && (
                            <span className="rounded-full bg-dt-surface-alt px-2 py-0.5 text-[10px] font-medium text-dt-text">
                              Featured
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="mt-2 text-sm text-dt-text-muted line-clamp-2">{item.description}</p>
                        )}
                        {item.techStack.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {item.techStack.map((tech) => (
                              <span key={tech} className="rounded-full bg-dt-surface-alt px-2 py-0.5 text-[10px] text-dt-text-muted">
                                {tech}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-3 flex gap-3">
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
                  <p className="text-sm text-dt-text-muted">No portfolio projects added yet.</p>
                )}
              </section>
            </>
          )}

          {/* Additional Info for All */}
          <section>
            <h2 className="mb-3 text-lg font-semibold text-dt-text">Additional Info</h2>
            <div className="flex flex-wrap gap-4 text-sm text-dt-text-muted">
              {isFreelancer ? (
                <>
                  <span>{freelancerProfile?.languages?.length ? `${freelancerProfile.languages.length} languages` : 'Add languages'}</span>
                  <span>{freelancerProfile?.availability || 'Availability not set'}</span>
                  <span>Profile {completion}% complete</span>
                </>
              ) : (
                <>
                  <span>{clientProfile?.industry || 'Industry not set'}</span>
                  <span>{clientProfile?.companySize ? `${clientProfile.companySize} team` : 'Team size TBD'}</span>
                  <span>Profile {completion}% complete</span>
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
