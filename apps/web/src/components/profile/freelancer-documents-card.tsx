"use client";

import { useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { toast } from 'sonner';
import { FileText, Trash2, UploadCloud, FileBadge } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { uploadApi } from '@/lib/api/upload';
import { userApi, type CertificationEntry, type FreelancerProfile } from '@/lib/api/user';
import { openSecureFileInNewTab } from '@/lib/secure-files';
import { useAuthStore } from '@/store/auth.store';

const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024; // 8 MB
const ACCEPTED_DOC_TYPES = 'application/pdf,image/png,image/jpeg,image/webp';

interface FreelancerDocumentsCardProps {
  profile?: FreelancerProfile | null;
  onResumeUpdated?: (resumeUrl: string | null) => void;
  onCertificationAdded?: (certification: CertificationEntry) => void;
  onCertificationRemoved?: (certificationId: string) => void;
}

interface CertificationFormState {
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
}

const initialCertForm: CertificationFormState = {
  name: '',
  issuer: '',
  issueDate: '',
  expiryDate: '',
  credentialId: '',
};

export function FreelancerDocumentsCard({ profile, onResumeUpdated, onCertificationAdded, onCertificationRemoved }: FreelancerDocumentsCardProps) {
  const [isResumeUploading, setIsResumeUploading] = useState(false);
  const [isResumeDeleting, setIsResumeDeleting] = useState(false);
  const [isCertUploading, setIsCertUploading] = useState(false);
  const [resumeAction, setResumeAction] = useState<'view' | 'download' | null>(null);
  const [certPreviewId, setCertPreviewId] = useState<string | null>(null);
  const [removingCertificationId, setRemovingCertificationId] = useState<string | null>(null);
  const [certForm, setCertForm] = useState(initialCertForm);
  const [certFile, setCertFile] = useState<File | null>(null);
  const [confirmResumeDelete, setConfirmResumeDelete] = useState(false);
  const [confirmCertDeleteId, setConfirmCertDeleteId] = useState<string | null>(null);

  const resumeInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const resumeUrl = profile?.resumeUrl ?? '';
  const certifications = profile?.certifications ?? [];

  const resumeCta = resumeUrl ? 'Replace resume' : 'Upload resume';
  const certificationCountLabel = useMemo(() => {
    if (!certifications.length) return 'No certifications yet';
    return `${certifications.length} certification${certifications.length > 1 ? 's' : ''}`;
  }, [certifications.length]);

  const requireAuth = () => {
    if (!isAuthenticated) {
      toast.error('Sign back in to open encrypted documents.');
      return false;
    }
    return true;
  };

  const openResume = async (action: 'view' | 'download') => {
    if (!resumeUrl) return;
    if (!requireAuth()) return;

    try {
      setResumeAction(action);
      await openSecureFileInNewTab(resumeUrl, {
        token: api.getToken() ?? undefined,
        download: action === 'download',
        fallbackName: action === 'download' ? 'resume.pdf' : undefined,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to open resume');
    } finally {
      setResumeAction(null);
    }
  };

  const openCertification = async (credentialUrl: string, certificationId?: string) => {
    if (!requireAuth()) return;

    try {
      setCertPreviewId(certificationId ?? credentialUrl);
      await openSecureFileInNewTab(credentialUrl, {
        token: api.getToken() ?? undefined,
        fallbackName: 'certification.pdf',
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to open certification');
    } finally {
      setCertPreviewId(null);
    }
  };

  const triggerResumeDialog = () => resumeInputRef.current?.click();
  const triggerCertDialog = () => certInputRef.current?.click();

  const handleResumeChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_DOCUMENT_BYTES) {
      toast.error('Resume must be 8 MB or smaller.');
      return;
    }

    setIsResumeUploading(true);
    const response = await uploadApi.uploadResume(file);
    setIsResumeUploading(false);

    if (!response.success || !response.data) {
      toast.error(response.error?.message || 'Resume upload failed');
      return;
    }

    toast.success('Resume encrypted & stored');
    onResumeUpdated?.(response.data.resumeUrl ?? response.data.url);
  };

  const handleResumeDelete = async () => {
    if (!resumeUrl) return;
    if (!confirmResumeDelete) {
      setConfirmResumeDelete(true);
      return;
    }

    setConfirmResumeDelete(false);
    setIsResumeDeleting(true);
    const response = await userApi.updateFreelancerProfile({ resumeUrl: null });
    setIsResumeDeleting(false);

    if (!response.success) {
      toast.error(response.error?.message || 'Unable to delete resume');
      return;
    }

    toast.success('Resume removed');
    onResumeUpdated?.(null);
  };

  const handleCertFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_DOCUMENT_BYTES) {
      toast.error('Certification files must be 8 MB or smaller.');
      return;
    }
    setCertFile(file);
  };

  const handleCertFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCertForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitCertification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!certFile) {
      toast.error('Attach a credential document before submitting.');
      return;
    }
    if (!certForm.name.trim() || !certForm.issuer.trim()) {
      toast.error('Certification name and issuer are required.');
      return;
    }

    setIsCertUploading(true);
    const response = await uploadApi.uploadCertification(certFile, {
      name: certForm.name.trim(),
      issuer: certForm.issuer.trim(),
      issueDate: certForm.issueDate || undefined,
      expiryDate: certForm.expiryDate || undefined,
      credentialId: certForm.credentialId.trim() || undefined,
    });
    setIsCertUploading(false);

    if (!response.success || !response.data) {
      toast.error(response.error?.message || 'Certification upload failed');
      return;
    }

    toast.success('Certification secured on Lighthouse');
    onCertificationAdded?.(response.data.certification);
    setCertFile(null);
    setCertForm(initialCertForm);
  };

  const handleCertificationDelete = async (certificationId: string) => {
    if (confirmCertDeleteId !== certificationId) {
      setConfirmCertDeleteId(certificationId);
      return;
    }

    setConfirmCertDeleteId(null);
    setRemovingCertificationId(certificationId);
    const response = await userApi.removeCertification(certificationId);
    setRemovingCertificationId(null);

    if (!response.success) {
      toast.error(response.error?.message || 'Unable to delete credential');
      return;
    }

    toast.success('Credential deleted');
    onCertificationRemoved?.(certificationId);
  };

  return (
    <Card id="documents" className="border border-dt-border bg-dt-surface">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-dt-text">Documents</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Resume Section */}
        <section className="rounded-xl border border-dt-border bg-dt-surface-alt p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dt-surface text-dt-text">
              <FileText className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-dt-text">Resume</p>
              <p className="text-xs text-dt-text-muted">{resumeUrl ? 'Uploaded' : 'Not uploaded'}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={triggerResumeDialog} disabled={isResumeUploading}>
              {isResumeUploading ? 'Uploading…' : resumeCta}
            </Button>
          </div>
          
          {resumeUrl && (
            <div className="mt-4 space-y-3">
              <p className="text-xs text-dt-text-muted break-all">{resumeUrl}</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" disabled={resumeAction === 'view'} onClick={() => openResume('view')}>
                  {resumeAction === 'view' ? 'Opening…' : 'View'}
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={resumeAction === 'download'} onClick={() => openResume('download')}>
                  {resumeAction === 'download' ? 'Preparing…' : 'Download'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className={confirmResumeDelete ? 'text-red-600' : 'text-dt-text-muted hover:text-red-600'}
                  disabled={isResumeDeleting}
                  onClick={handleResumeDelete}
                  onBlur={() => setConfirmResumeDelete(false)}
                >
                  {isResumeDeleting ? 'Removing…' : confirmResumeDelete ? 'Confirm?' : <Trash2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
          <input ref={resumeInputRef} type="file" accept={ACCEPTED_DOC_TYPES} className="hidden" onChange={handleResumeChange} />
        </section>

        {/* Certifications Section */}
        <section className="rounded-xl border border-dt-border bg-dt-surface-alt p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dt-surface text-dt-text">
              <FileBadge className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-dt-text">Certifications</p>
              <p className="text-xs text-dt-text-muted">{certificationCountLabel}</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={triggerCertDialog}>
              Attach
            </Button>
            <input ref={certInputRef} type="file" accept={ACCEPTED_DOC_TYPES} className="hidden" onChange={handleCertFileChange} />
          </div>

          {/* Add Certification Form */}
          <form className="mt-4 space-y-3" onSubmit={submitCertification}>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="text-xs text-dt-text-muted">Name</label>
                <Input name="name" placeholder="Certification name" value={certForm.name} onChange={handleCertFieldChange} className="mt-1 border-dt-border bg-dt-surface" />
              </div>
              <div>
                <label className="text-xs text-dt-text-muted">Issuer</label>
                <Input name="issuer" placeholder="Organization" value={certForm.issuer} onChange={handleCertFieldChange} className="mt-1 border-dt-border bg-dt-surface" />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div>
                <label className="text-xs text-dt-text-muted">Issued</label>
                <Input type="date" name="issueDate" value={certForm.issueDate} onChange={handleCertFieldChange} className="mt-1 border-dt-border bg-dt-surface" />
              </div>
              <div>
                <label className="text-xs text-dt-text-muted">Expires</label>
                <Input type="date" name="expiryDate" value={certForm.expiryDate} onChange={handleCertFieldChange} className="mt-1 border-dt-border bg-dt-surface" />
              </div>
              <div>
                <label className="text-xs text-dt-text-muted">ID</label>
                <Input name="credentialId" placeholder="Credential ID" value={certForm.credentialId} onChange={handleCertFieldChange} className="mt-1 border-dt-border bg-dt-surface" />
              </div>
            </div>
            
            {certFile ? (
              <div className="rounded-lg border border-dt-border bg-dt-surface p-2 text-xs text-dt-text">
                <span className="text-dt-text-muted">Selected:</span> {certFile.name}
              </div>
            ) : (
              <p className="text-xs text-dt-text-muted flex items-center gap-1">
                <UploadCloud className="h-3 w-3" /> PDF or PNG up to 8 MB
              </p>
            )}
            
            <Button type="submit" size="sm" disabled={isCertUploading || !certFile}>
              {isCertUploading ? 'Saving…' : 'Add certification'}
            </Button>
          </form>

          {/* Certifications List */}
          {certifications.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-dt-border pt-4">
              {certifications.map((cert) => {
                const credentialUrl = cert.credentialUrl ?? null;
                const isPreviewing = credentialUrl ? certPreviewId === cert.id || certPreviewId === credentialUrl : false;
                return (
                  <div key={cert.id} className="flex items-center justify-between rounded-lg border border-dt-border bg-dt-surface p-3">
                    <div>
                      <p className="text-sm font-medium text-dt-text">{cert.name}</p>
                      <p className="text-xs text-dt-text-muted">{cert.issuer}</p>
                      <div className="flex gap-2 text-xs text-dt-text-muted">
                        {cert.issueDate && <span>Issued: {new Date(cert.issueDate).toLocaleDateString()}</span>}
                        {cert.expiryDate && <span>· Expires: {new Date(cert.expiryDate).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {credentialUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPreviewing}
                          onClick={() => openCertification(credentialUrl, cert.id)}
                        >
                          {isPreviewing ? '…' : 'View'}
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={confirmCertDeleteId === cert.id ? 'text-red-600' : 'text-dt-text-muted hover:text-red-600'}
                        disabled={removingCertificationId === cert.id}
                        onClick={() => handleCertificationDelete(cert.id)}
                        onBlur={() => setConfirmCertDeleteId(null)}
                      >
                        {removingCertificationId === cert.id ? '…' : confirmCertDeleteId === cert.id ? 'Confirm?' : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}

export default FreelancerDocumentsCard;
