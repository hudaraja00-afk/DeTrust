import { Response, NextFunction } from 'express';
import { SecureFileCategory, SecureFileResourceType, SecureFileVisibility } from '@prisma/client';

import { config } from '../config';
import { prisma } from '../config/database';
import { ValidationError } from '../middleware';
import type { AuthenticatedRequest } from '../middleware';
import { storageService } from '../services/storage.service';

export class UploadController {
  private getBaseUrl() {
    return config.server.apiUrl.replace(/\/$/, '');
  }

  private resolveFileUrl(fileId: string) {
    const baseUrl = this.getBaseUrl();
    const relativePath = `/api/uploads/${fileId}`;
    return {
      baseUrl,
      relativePath,
      url: `${baseUrl}${relativePath}`,
    };
  }

  private normalizeDate(value: unknown) {
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const date = new Date(trimmed);
    if (Number.isNaN(date.getTime())) {
      throw new ValidationError('Invalid date format provided for certification');
    }
    return date.toISOString();
  }

  private parseCertificationPayload(raw: Record<string, unknown>) {
    const toStringValue = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
    const name = toStringValue(raw.name);
    const issuer = toStringValue(raw.issuer);

    if (!name || !issuer) {
      throw new ValidationError('Certification name and issuer are required');
    }

    return {
      name,
      issuer,
      credentialId: toStringValue(raw.credentialId) || undefined,
      issueDate: this.normalizeDate(raw.issueDate),
      expiryDate: this.normalizeDate(raw.expiryDate),
    };
  }

  private async requireFreelancerProfileId(userId: string) {
    const profile = await prisma.freelancerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new ValidationError('Freelancer profile not found');
    }

    return profile.id;
  }

  async uploadAvatar(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError('No file provided');
      }

      if (!req.userId) {
        throw new ValidationError('Missing user context for avatar upload');
      }

      const secureFile = await storageService.replaceCategoryFile({
        buffer: req.file.buffer,
        filename: req.file.originalname || `avatar-${Date.now()}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
        userId: req.userId,
        category: SecureFileCategory.AVATAR,
        visibility: SecureFileVisibility.AUTHENTICATED,
        resourceType: SecureFileResourceType.USER,
        resourceId: req.userId,
      });

      const { url } = this.resolveFileUrl(secureFile.id);

      res.status(201).json({
        success: true,
        message: 'Avatar uploaded',
        data: {
          url,
          fileId: secureFile.id,
          mimeType: secureFile.mimeType,
          size: secureFile.size,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadResume(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError('No document provided');
      }

      if (!req.userId) {
        throw new ValidationError('Missing user context for resume upload');
      }

      const profileId = await this.requireFreelancerProfileId(req.userId);

      const secureFile = await storageService.replaceCategoryFile({
        buffer: req.file.buffer,
        filename: req.file.originalname || `resume-${Date.now()}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
        userId: req.userId,
        category: SecureFileCategory.RESUME,
        visibility: SecureFileVisibility.AUTHENTICATED,
        resourceType: SecureFileResourceType.FREELANCER_PROFILE,
        resourceId: profileId,
      });

      const { url } = this.resolveFileUrl(secureFile.id);

      await prisma.freelancerProfile.update({
        where: { id: profileId },
        data: { resumeUrl: url },
      });

      res.status(201).json({
        success: true,
        message: 'Resume uploaded',
        data: {
          url,
          fileId: secureFile.id,
          mimeType: secureFile.mimeType,
          size: secureFile.size,
          resumeUrl: url,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadCertification(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError('No document provided');
      }

      if (!req.userId) {
        throw new ValidationError('Missing user context for certification upload');
      }

      const profileId = await this.requireFreelancerProfileId(req.userId);

      const metadata = this.parseCertificationPayload(req.body ?? {});
      const metadataForStorage = Object.fromEntries(
        Object.entries(metadata).filter(([, value]) => value !== undefined && value !== null)
      );

      const secureFile = await storageService.uploadSecureFile({
        buffer: req.file.buffer,
        filename: req.file.originalname || `cert-${Date.now()}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
        userId: req.userId,
        category: SecureFileCategory.CERTIFICATION,
        visibility: SecureFileVisibility.AUTHENTICATED,
        resourceType: SecureFileResourceType.FREELANCER_PROFILE,
        resourceId: profileId,
        metadata: metadataForStorage,
      });
      const { url } = this.resolveFileUrl(secureFile.id);

      const certification = await prisma.certification.create({
        data: {
          freelancerProfileId: profileId,
          name: metadata.name,
          issuer: metadata.issuer,
          credentialId: metadata.credentialId,
          credentialUrl: url,
          issueDate: metadata.issueDate ? new Date(metadata.issueDate) : undefined,
          expiryDate: metadata.expiryDate ? new Date(metadata.expiryDate) : undefined,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Certification asset uploaded',
        data: {
          url,
          fileId: secureFile.id,
          mimeType: secureFile.mimeType,
          size: secureFile.size,
          certification,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async uploadDeliverable(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) {
        throw new ValidationError('No document provided');
      }

      if (!req.userId) {
        throw new ValidationError('Missing user context for deliverable upload');
      }

      const secureFile = await storageService.uploadSecureFile({
        buffer: req.file.buffer,
        filename: req.file.originalname || `deliverable-${Date.now()}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
        userId: req.userId,
        category: SecureFileCategory.CERTIFICATION, // Using CERTIFICATION as a general document category
        visibility: SecureFileVisibility.AUTHENTICATED,
        resourceType: SecureFileResourceType.USER,
        resourceId: req.userId,
      });

      const { url } = this.resolveFileUrl(secureFile.id);

      res.status(201).json({
        success: true,
        message: 'Deliverable uploaded',
        data: {
          url,
          fileId: secureFile.id,
          mimeType: secureFile.mimeType,
          size: secureFile.size,
          deliverableUrl: url,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async streamFile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[upload] streamFile request for ${req.params.fileId}, userId=${req.userId ?? '(none)'}, hasCookie=${!!req.cookies?.['detrust-auth-token']}, hasBearer=${!!req.headers.authorization}`);
      }
      const secureFile = await storageService.getAccessibleFile(req.params.fileId, req.userId);
      const buffer = await storageService.downloadDecryptedFile(secureFile);

      res.setHeader('Content-Type', secureFile.mimeType);
      res.setHeader('Content-Length', buffer.length.toString());
      // Allow cross-origin embedding (Next.js on :3000 loading images from API on :4000)
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      if (req.query.download === '1') {
        res.setHeader('Content-Disposition', `attachment; filename="${secureFile.filename}"`);
      }
      res.setHeader('Cache-Control', secureFile.visibility === SecureFileVisibility.PUBLIC ? 'public, max-age=300' : 'private, max-age=60');

      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();
export default uploadController;
