'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Award,
  Briefcase,
  Clock3,
  ExternalLink,
  FileText,
  FolderOpen,
  GraduationCap,
  Layers,
  Mail,
  MapPin,
  ScrollText,
  Shield,
  Sparkles,
  Star,
  UploadCloud,
  XCircle,
} from 'lucide-react';

import { SecureAvatar } from '@/components/secure-avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useUser } from '@/hooks/queries/use-user';
import { useUserReviews, useReviewSummary } from '@/hooks/queries/use-reviews';
import { useTrustScore } from '@/hooks/queries/use-trust-score';
import { ReviewSummaryCard } from '@/components/reviews/review-summary';
import { ReviewList } from '@/components/reviews/review-list';
import { TrustScoreCard } from '@/components/trust-score/trust-score-card';
import { openSecureFileInNewTab } from '@/lib/secure-files';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/lib/utils';

export default function FreelancerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const freelancerId = params.id as string;

  const { data: freelancer, isLoading: loading } = useUser(freelancerId);
  const { data: reviewSummary } = useReviewSummary(freelancerId);
  const { data: reviewsData } = useUserReviews(freelancerId, { page: 1, limit: 10 });
  const { data: trustScoreBreakdown } = useTrustScore(freelancerId);
  const { isAuthenticated } = useAuthStore();

  const profile = freelancer?.freelancerProfile;
  const languages = (profile?.languages ?? []).join(' · ');
  const portfolioLinks = profile?.portfolioLinks ?? [];
  const certifications = profile?.certifications ?? [];
  const certificationCount = certifications.length;
  const resumeUploaded = Boolean(profile?.resumeUrl);

  const experienceEntries = useMemo(() => {
    const entries = profile?.experience ?? [];
    return [...entries]
      .sort((a, b) => {
        const aDate = a.endDate ?? a.startDate ?? new Date(0);
        const bDate = b.endDate ?? b.startDate ?? new Date(0);
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
  }, [profile?.experience]);

  const portfolioItems = useMemo(() => {
    return profile?.portfolioItems ?? [];
  }, [profile?.portfolioItems]);

  const highlightStats = useMemo(
    () => [
      {
        label: 'Trust score',
        value: `${profile?.trustScore ?? 0}%`,
        detail: `${profile?.totalReviews ?? 0} on-chain reviews`,
        icon: <Shield className="h-4 w-4 text-emerald-500" />,
      },
      {
        label: 'Rating',
        value: Number(profile?.avgRating ?? 0).toFixed(1),
        detail: `${profile?.totalReviews ?? 0} reviews`,
        icon: <Star className="h-4 w-4 text-amber-500" />,
      },
      {
        label: 'Jobs shipped',
        value: `${profile?.completedJobs ?? 0}`,
        detail: 'Across DeTrust marketplace',
        icon: <Briefcase className="h-4 w-4 text-blue-500" />,
      },
      {
        label: 'AI capability',
        value: `${profile?.aiCapabilityScore ?? 0}%`,
        detail: 'Signal refreshes per skill update',
        icon: <Sparkles className="h-4 w-4 text-fuchsia-500" />,
      },
    ],
    [
      profile?.trustScore,
      profile?.totalReviews,
      profile?.avgRating,
      profile?.completedJobs,
      profile?.aiCapabilityScore,
    ]
  );

  const topSkills = useMemo(() => {
    const skills = profile?.skills ?? [];
    return [...skills]
      .sort((a, b) => {
        const aScore = a.verificationScore ?? a.proficiencyLevel ?? 0;
        const bScore = b.verificationScore ?? b.proficiencyLevel ?? 0;
        return bScore - aScore;
      })
      .slice(0, 8);
  }, [profile?.skills]);

  const educationEntries = useMemo(() => {
    const entries = profile?.education ?? [];
    return [...entries]
      .sort((a, b) => {
        const aDate = a.endDate ?? a.startDate ?? new Date(0);
        const bDate = b.endDate ?? b.startDate ?? new Date(0);
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      })
      .slice(0, 4);
  }, [profile?.education]);

  const formatEducationRange = (start?: Date | string | null, end?: Date | string | null) => {
    if (!start && !end) return 'Dates not provided';
    const startYear = start ? new Date(start).getFullYear() : '—';
    const endYear = end ? new Date(end).getFullYear() : 'Present';
    return `${startYear} – ${endYear}`;
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!freelancer || freelancer.role !== 'FREELANCER') {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <XCircle className="h-12 w-12 text-slate-300" />
        <h3 className="mt-4 text-lg font-semibold text-dt-text">Profile not found</h3>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/talent">Back to Talent</Link>
        </Button>
      </div>
    );
  }


  const getLinkLabel = (value: string) => {
    try {
      const url = new URL(value);
      return url.hostname.replace(/^www\./, '');
    } catch {
      return value;
    }
  };

  return (
    <div className="space-y-8">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="gap-2 text-dt-text-muted hover:text-dt-text"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to talent
      </Button>

      <section className="relative overflow-hidden rounded-[32px] bg-dt-surface-alt p-8 shadow-[0_35px_120px_rgba(15,23,42,0.12)]">
        <div className="absolute inset-0 opacity-90" aria-hidden>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(34,197,94,0.08),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(59,130,246,0.08),transparent_45%)]" />
        </div>
        <div className="relative z-10 flex flex-wrap items-start gap-8">
          <div className="flex items-start gap-6">
            <div className="group relative h-28 w-28 rounded-3xl border border-white/60 bg-dt-surface p-1 shadow-2xl">
              <SecureAvatar
                src={freelancer.avatarUrl}
                alt={freelancer.name || 'Freelancer avatar'}
                size={108}
                fallbackInitial={freelancer.name?.[0] || 'F'}
                containerClassName="h-full w-full overflow-hidden rounded-2xl"
              />
              <div className="absolute inset-0 rounded-3xl border border-emerald-300/50 opacity-0 transition group-hover:opacity-100" />
            </div>
            <div className="space-y-3">
              <div className="text-xs uppercase tracking-[0.4em] text-dt-text-muted">Freelancer dossier</div>
              <h1 className="text-3xl font-semibold text-dt-text">{freelancer.name || 'Anonymous talent'}</h1>
              <p className="text-lg text-dt-text-muted">{profile?.title || 'Independent builder'}</p>
              <div className="flex flex-wrap gap-3 text-sm text-dt-text-muted">
                <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-400" /> {profile?.location || 'Location TBD'}</span>
                {profile?.timezone && <span>UTC {profile.timezone}</span>}
                {languages && <span>{languages}</span>}
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge
                  variant="secondary"
                  className={cn(
                    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
                    profile?.availability === 'Part-time' && 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
                    !profile?.availability && 'bg-dt-surface-alt text-dt-text-muted'
                  )}
                >
                  {profile?.availability || 'Availability pending'}
                </Badge>
                {profile?.hourlyRate ? (
                  <Badge variant="outline" className="border-dt-border text-dt-text-muted">
                    ${profile.hourlyRate}/hr
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-dt-border text-dt-text-muted">
                    Rate on request
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="ml-auto flex flex-col items-end gap-3 text-right">
            <p className="text-xs uppercase tracking-[0.4em] text-dt-text-muted">Signals</p>
            <p className="text-sm text-dt-text-muted">Profile completion helps prioritize outreach.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {highlightStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-white/40 bg-dt-surface/70 p-4 text-left shadow-inner dark:border-slate-700">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-dt-text-muted">
                    {stat.icon}
                    <span>{stat.label}</span>
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-dt-text">{stat.value}</div>
                  <p className="text-xs text-dt-text-muted">{stat.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {profile?.bio ? (
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-dt-text">About</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-base leading-relaxed text-dt-text-muted">{profile.bio}</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dt-border bg-dt-surface shadow-lg">
          <CardContent className="py-6 text-sm text-dt-text-muted">
            This talent hasn’t written a long-form narrative yet. Start a conversation to understand their craft and recent wins.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.65fr,1fr]">
        <div className="space-y-6">
          <Card className="border-dt-border bg-dt-surface text-dt-text shadow-xl">
            <CardHeader className="space-y-3">
              <p className="text-xs uppercase tracking-[0.45em] text-dt-text-muted">Professional dossier</p>
              <CardTitle className="flex flex-wrap items-center gap-3 text-2xl text-dt-text">
                <Layers className="h-6 w-6 text-emerald-500" /> Proof that travels well
              </CardTitle>
              <p className="text-sm text-dt-text-muted">Signal-rich resumes, verified skills, and recent study help triage the best collaborator for a mission.</p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white p-5 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-transparent dark:to-transparent">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-emerald-500">Resume signal</p>
                      <p className="text-lg font-semibold text-dt-text">{resumeUploaded ? 'Resume on file' : 'No resume uploaded yet'}</p>
                      <p className="text-sm text-dt-text-muted">{resumeUploaded ? 'View the resume to evaluate qualifications.' : 'Invite them to upload a PDF to unlock deeper screening.'}</p>
                    </div>
                    <ScrollText className="h-8 w-8 text-emerald-400" />
                  </div>
                  <div className="mt-5 flex flex-wrap gap-3">
                    {resumeUploaded && isAuthenticated ? (
                      <Button
                        variant="outline"
                        className="border-emerald-200 text-emerald-700"
                        onClick={() => openSecureFileInNewTab(profile!.resumeUrl!, { token: api.getToken() ?? undefined })}
                      >
                        <FileText className="mr-2 h-4 w-4" /> View Resume
                      </Button>
                    ) : (
                      <Button asChild variant="outline" className="border-emerald-200 text-emerald-700">
                        <Link href={`/messages?to=${freelancer.id}`} className="flex items-center gap-2">
                          <Mail className="h-4 w-4" /> Request resume
                        </Link>
                      </Button>
                    )}
                    {resumeUploaded && <Badge variant="secondary" className="bg-dt-surface/70 text-emerald-600 dark:text-emerald-400">Available to view</Badge>}
                  </div>
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-white p-5 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-transparent dark:to-transparent">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-dt-text-muted">Core stack</p>
                      <p className="text-lg font-semibold text-dt-text">{topSkills.length ? 'Featured skills' : 'Awaiting entries'}</p>
                    </div>
                    <Sparkles className="h-6 w-6 text-emerald-400" />
                  </div>
                  {topSkills.length ? (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {topSkills.map((skill) => (
                        <div
                          key={skill.id ?? skill.skillId}
                          className="group inline-flex items-center gap-2 rounded-full border border-dt-border bg-dt-surface px-3 py-1 text-sm font-medium text-dt-text-muted"
                        >
                          <span>{skill.skill?.name ?? 'Unnamed skill'}</span>
                          <span className="text-xs uppercase tracking-wide text-emerald-500">
                            {skill.verificationStatus ? skill.verificationStatus.toLowerCase() : 'unverified'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-2xl border border-dashed border-dt-border bg-dt-surface/70 p-4 text-sm text-dt-text-muted">Skills will appear here as soon as they are documented inside their editor.</p>
                  )}
                </div>

                <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 via-white to-white p-5 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/30 dark:via-transparent dark:to-transparent">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-dt-text-muted">Education & study</p>
                      <p className="text-lg font-semibold text-dt-text">{educationEntries.length ? 'Recent learning' : 'No entries yet'}</p>
                    </div>
                    <GraduationCap className="h-6 w-6 text-dt-text-muted" />
                  </div>
                  {educationEntries.length ? (
                    <div className="mt-4 space-y-3">
                      {educationEntries.map((entry) => (
                        <div key={entry.id} className="rounded-2xl border border-slate-100 bg-dt-surface-alt/70 p-3 dark:border-slate-700">
                          <p className="text-sm font-semibold text-dt-text">{entry.degree || 'Program'} · {entry.institution}</p>
                          <p className="text-xs text-dt-text-muted">{formatEducationRange(entry.startDate, entry.endDate)}</p>
                          {entry.fieldOfStudy ? <p className="text-xs text-dt-text-muted">{entry.fieldOfStudy}</p> : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 rounded-2xl border border-dashed border-dt-border bg-dt-surface-alt/70 p-4 text-sm text-dt-text-muted">Once the talent logs universities, bootcamps, or certifications, they will appear here.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dt-border bg-dt-surface text-dt-text shadow-xl">
            <CardHeader className="space-y-3">
              <p className="text-xs uppercase tracking-[0.45em] text-dt-text-muted">Trust artifacts</p>
              <CardTitle className="flex items-center gap-3 text-2xl text-dt-text">
                <Award className="h-6 w-6 text-emerald-500" /> Certifications & references
              </CardTitle>
            </CardHeader>
            <CardContent>
              {certificationCount ? (
                <div className="space-y-4">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="rounded-2xl border border-slate-100 bg-dt-surface-alt/80 p-4 dark:border-slate-700">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-semibold text-dt-text">{cert.name}</h4>
                        <Badge variant="outline" className="border-cyan-200 text-cyan-700 dark:border-cyan-800 dark:text-cyan-300">{cert.issuer}</Badge>
                      </div>
                      <div className="mt-1 text-xs text-dt-text-muted">
                        {cert.issueDate ? `Issued ${new Date(cert.issueDate).toLocaleDateString()}` : 'Issue date not provided'}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3">
                        {cert.credentialId && <Badge variant="secondary" className="bg-dt-surface text-dt-text-muted">ID · {cert.credentialId}</Badge>}
                        {cert.credentialUrl && (
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline dark:text-emerald-400"
                          >
                            View credential <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-3xl border border-dashed border-dt-border bg-dt-surface-alt/70 p-6 text-sm text-dt-text-muted">
                  No certifications published yet. Ask the talent to pin references or credentials from their documents tab.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Experience */}
          {experienceEntries.length > 0 && (
            <Card className="border-dt-border bg-dt-surface text-dt-text shadow-xl">
              <CardHeader className="space-y-3">
                <p className="text-xs uppercase tracking-[0.45em] text-dt-text-muted">Career history</p>
                <CardTitle className="flex items-center gap-3 text-2xl text-dt-text">
                  <Briefcase className="h-6 w-6 text-emerald-500" /> Work experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {experienceEntries.map((exp) => (
                    <div key={exp.id} className="rounded-2xl border border-slate-100 bg-dt-surface-alt/80 p-4 dark:border-slate-700">
                      <h4 className="text-base font-semibold text-dt-text">{exp.title}</h4>
                      <p className="text-sm text-dt-text-muted">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</p>
                      <p className="mt-1 text-xs text-dt-text-muted">
                        {formatEducationRange(exp.startDate, exp.isCurrent ? null : exp.endDate)}
                        {exp.isCurrent && <span className="ml-2 text-emerald-500">· Current</span>}
                      </p>
                      {exp.description && <p className="mt-2 text-sm text-dt-text-muted">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Portfolio Items */}
          {portfolioItems.length > 0 && (
            <Card className="border-dt-border bg-dt-surface text-dt-text shadow-xl">
              <CardHeader className="space-y-3">
                <p className="text-xs uppercase tracking-[0.45em] text-dt-text-muted">Showcase</p>
                <CardTitle className="flex items-center gap-3 text-2xl text-dt-text">
                  <FolderOpen className="h-6 w-6 text-emerald-500" /> Portfolio projects
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolioItems.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-100 bg-dt-surface-alt/80 p-4 dark:border-slate-700">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-base font-semibold text-dt-text">{item.title}</h4>
                        {item.isFeatured && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">Featured</Badge>
                        )}
                      </div>
                      {item.description && <p className="mt-1 text-sm text-dt-text-muted">{item.description}</p>}
                      {item.techStack && item.techStack.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {item.techStack.map((tech) => (
                            <span key={tech} className="rounded-full border border-dt-border bg-dt-surface px-2.5 py-0.5 text-xs text-dt-text-muted">{tech}</span>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-3">
                        {item.projectUrl && (
                          <a href={item.projectUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline dark:text-emerald-400">
                            Live demo <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {item.repoUrl && (
                          <a href={item.repoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline dark:text-emerald-400">
                            Source code <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-dt-border bg-dt-surface shadow-lg">
            <CardHeader>
              <CardTitle className="text-base text-dt-text">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full bg-emerald-500 text-white shadow-lg shadow-emerald-300/70 hover:bg-emerald-600">
                <Link href={`/messages?to=${freelancer.id}`}>
                  <Mail className="mr-2 h-4 w-4" /> Start a conversation
                </Link>
              </Button>
              <p className="text-xs text-dt-text-muted">Direct messaging keeps everything on-chain ready and avoids sharing personal emails too early.</p>
            </CardContent>
          </Card>

          <Card className="border-dt-border bg-dt-surface shadow-lg">
            <CardHeader>
              <CardTitle className="text-base text-dt-text">Availability & logistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-dt-text-muted">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-dt-text-muted"><Clock3 className="h-4 w-4 text-emerald-400" /> Status</span>
                <Badge
                  className={cn(
                    profile?.availability === 'Full-time'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : profile?.availability === 'Part-time'
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                      : 'bg-dt-surface-alt text-dt-text-muted'
                  )}
                >
                  {profile?.availability || 'Not specified'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dt-text-muted">Hourly rate</span>
                <span className="font-semibold text-dt-text">{profile?.hourlyRate ? `$${profile.hourlyRate}/hr` : 'Share in chat'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dt-text-muted">Timezone</span>
                <span className="text-dt-text">{profile?.timezone || 'Not set'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dt-text-muted">Languages</span>
                <span className="text-right text-dt-text">{languages || 'Add languages'}</span>
              </div>
            </CardContent>
          </Card>

          {portfolioLinks.length > 0 && (
            <Card className="border-dt-border bg-dt-surface shadow-lg">
              <CardHeader>
                <CardTitle className="text-base text-dt-text">Portfolio links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {portfolioLinks.map((link, index) => (
                  <a
                    key={`${link}-${index}`}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-dt-surface-alt/80 px-4 py-3 text-sm text-emerald-700 transition hover:border-emerald-200 hover:bg-dt-surface dark:border-slate-700 dark:text-emerald-400 dark:hover:border-emerald-700"
                  >
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      <span className="font-medium">{getLinkLabel(link)}</span>
                    </div>
                    <span className="text-xs uppercase tracking-[0.35em] text-dt-text-muted">Visit</span>
                  </a>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="border-dt-border bg-dt-surface shadow-lg">
            <CardHeader>
              <CardTitle className="text-base text-dt-text">Credentials summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-dt-text-muted">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-dt-text-muted"><UploadCloud className="h-4 w-4 text-emerald-400" /> Documents</span>
                <span className="font-semibold text-dt-text">{resumeUploaded ? 'Resume ready' : 'Awaiting upload'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dt-text-muted">Certifications</span>
                <span className="font-semibold text-dt-text">{certificationCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-dt-text-muted">Education entries</span>
                <span className="font-semibold text-dt-text">{educationEntries.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Trust Score Breakdown (Module 4) */}
      {trustScoreBreakdown && trustScoreBreakdown.components.length > 0 && (
        <TrustScoreCard breakdown={trustScoreBreakdown} />
      )}

      {/* Reviews Section */}
      <Card className="border-dt-border bg-dt-surface text-dt-text shadow-xl">
        <CardHeader className="space-y-3">
          <p className="text-xs uppercase tracking-[0.45em] text-dt-text-muted">Reputation</p>
          <CardTitle className="flex items-center gap-3 text-2xl text-dt-text">
            <Star className="h-6 w-6 text-amber-400" /> Reviews & Ratings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {reviewSummary && <ReviewSummaryCard summary={reviewSummary} subjectRole="FREELANCER" />}
          <ReviewList
            reviews={reviewsData?.items ?? []}
            emptyMessage="No reviews yet. Reviews will appear here once contracts are completed."
          />
        </CardContent>
      </Card>
    </div>
  );
}
