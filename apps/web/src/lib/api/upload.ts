import { api } from './client';
import type { CertificationEntry } from './user';

export interface UploadPayload {
  url: string;
  fileId: string;
  mimeType: string;
  size: number;
}

export interface ResumeUploadPayload extends UploadPayload {
  resumeUrl: string;
}

export interface CertificationUploadPayload extends UploadPayload {
  certification: CertificationEntry;
}

export interface CertificationUploadForm {
  name: string;
  issuer: string;
  issueDate?: string;
  expiryDate?: string;
  credentialId?: string;
}

export interface DeliverableUploadPayload extends UploadPayload {
  deliverableUrl: string;
}

const uploadFormFile = <T extends UploadPayload>(endpoint: string, fieldName: string, file: File, extraFields?: Record<string, string>) => {
  const formData = new FormData();
  formData.append(fieldName, file);

  Object.entries(extraFields ?? {}).forEach(([key, value]) => {
    formData.append(key, value);
  });

  return api.post<T>(endpoint, formData);
};

export const uploadApi = {
  uploadAvatar: (file: File) => uploadFormFile('/uploads/avatar', 'avatar', file),
  uploadResume: (file: File) => uploadFormFile<ResumeUploadPayload>('/uploads/resume', 'document', file),
  uploadCertification: (file: File, metadata: CertificationUploadForm) => {
    const filtered = Object.fromEntries(
      Object.entries(metadata).filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
    );
    return uploadFormFile<CertificationUploadPayload>('/uploads/certifications', 'document', file, filtered);
  },
  uploadDeliverable: (file: File) => uploadFormFile<DeliverableUploadPayload>('/uploads/deliverable', 'document', file),
};

export default uploadApi;
