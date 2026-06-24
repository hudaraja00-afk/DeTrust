'use client';

import Link from 'next/link';
import { Award, UploadCloud } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { CertificationEntry } from '@/lib/api/user';

export interface DossierCredentialsProps {
  certifications: CertificationEntry[];
  certPreviewMap: Record<string, { url: string; mimeType: string }>;
}

export function DossierCredentials({ certifications, certPreviewMap }: DossierCredentialsProps) {
  const certificationCount = certifications.length;

  return (
    <div className="rounded-2xl border border-dt-border bg-dt-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-dt-text-muted">Credentials</p>
          <p className="text-lg font-semibold text-dt-text">{certificationCount ? 'Certifications' : 'No credentials yet'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary">{certificationCount} on file</Badge>
          <Award className="h-6 w-6 text-dt-text" />
        </div>
      </div>
      {certificationCount > 0 ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.3fr),minmax(0,0.9fr)]">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {certifications.slice(0, 3).map((cert) => {
              const preview = certPreviewMap[cert.id];
              return (
                <div key={cert.id} className="rounded-xl border border-dt-border bg-dt-surface p-3">
                  <div className="relative overflow-hidden rounded-lg border border-dt-border bg-dt-surface-alt">
                    {preview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={preview.url} alt={`${cert.name} credential`} className="h-28 w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="flex h-28 items-center justify-center text-xs text-dt-text-muted">
                        {cert.credentialUrl ? 'Asset ready' : 'No credential attached'}
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-sm font-medium text-dt-text">{cert.name}</p>
                  <p className="text-xs text-dt-text-muted">{cert.issuer}</p>
                </div>
              );
            })}
          </div>
          <div className="rounded-xl border border-dt-border bg-dt-surface-alt p-4">
            <ul className="space-y-3 text-sm text-dt-text-muted">
              {certifications.slice(0, 4).map((cert) => (
                <li key={cert.id} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-dt-text">{cert.name}</p>
                    <p className="text-xs text-dt-text-muted">{cert.issuer}</p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {cert.issueDate ? new Date(cert.issueDate).getFullYear() : 'Year TBD'}
                  </Badge>
                </li>
              ))}
            </ul>
            {certificationCount > 4 && (
              <p className="mt-3 text-xs text-dt-text-muted">+{certificationCount - 4} more</p>
            )}
            <Button asChild variant="ghost" className="mt-4 w-full justify-center">
              <Link href="/profile/edit#documents" className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4" /> Manage credentials
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-dt-border bg-dt-surface-alt p-6 text-sm text-dt-text-muted">
          Add certifications or references inside the documents section.
        </div>
      )}
    </div>
  );
}
