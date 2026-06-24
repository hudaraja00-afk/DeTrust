import multer from 'multer';
import type { RequestHandler } from 'express';

import { config } from '../config';
import { ValidationError } from './error.middleware';

const memoryStorage = multer.memoryStorage();
const AVATAR_LIMIT_BYTES = Math.min(config.upload.maxFileSize, 4 * 1024 * 1024);
const DOCUMENT_LIMIT_BYTES = config.upload.maxFileSize;

const createUploadHandler = (field: string, limit: number, filter: multer.Options['fileFilter']): RequestHandler => {
	const uploader = multer({
		storage: memoryStorage,
		fileFilter: filter,
		limits: {
			fileSize: limit,
		},
	});

	return (req, res, next) => {
		uploader.single(field)(req, res, (error) => {
			if (error) {
				if (error instanceof multer.MulterError) {
					const message =
						error.code === 'LIMIT_FILE_SIZE'
							? 'File exceeds the allowed size'
							: 'Upload failed, please try again';
					next(new ValidationError(message));
					return;
				}
				next(error);
				return;
			}
			next();
		});
	};
};

const avatarFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
	if (!file.mimetype.startsWith('image/')) {
		cb(new ValidationError('Only image uploads are allowed'));
		return;
	}
	cb(null, true);
};

const DOCUMENT_MIME_TYPES = new Set([
	'application/pdf',
	'image/png',
	'image/jpeg',
	'image/webp',
	'application/zip',
	'application/x-zip-compressed',
	'application/x-7z-compressed',
	'application/x-tar',
	'application/gzip',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'application/vnd.ms-powerpoint',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

const documentFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
	if (!DOCUMENT_MIME_TYPES.has(file.mimetype)) {
		cb(new ValidationError('Unsupported document type. Allowed: PDF, ZIP archives, PNG/JPG images, or Office docs.'));
		return;
	}
	cb(null, true);
};

export const avatarUpload: RequestHandler = createUploadHandler('avatar', AVATAR_LIMIT_BYTES, avatarFilter);
export const documentUpload: RequestHandler = createUploadHandler('document', DOCUMENT_LIMIT_BYTES, documentFilter);

/**
 * Evidence file upload — accepts up to 5 files (PDF, images, Office, ZIP).
 * Max 25 MB per file (SRS FR-P2.2).
 */
const EVIDENCE_LIMIT_BYTES = 25 * 1024 * 1024;

const evidenceFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
	const allowed = new Set([
		...DOCUMENT_MIME_TYPES,
		'text/plain',
		'video/mp4',
		'video/webm',
		'audio/mpeg',
		'audio/ogg',
	]);
	if (!allowed.has(file.mimetype)) {
		cb(new ValidationError('Unsupported file type. Allowed: PDF, images, Office docs, ZIP, text, audio, and video.'));
		return;
	}
	cb(null, true);
};

const createMultiUploadHandler = (
	field: string,
	maxCount: number,
	limit: number,
	filter: multer.Options['fileFilter'],
): RequestHandler => {
	const uploader = multer({
		storage: memoryStorage,
		fileFilter: filter,
		limits: { fileSize: limit },
	});

	return (req, res, next) => {
		uploader.array(field, maxCount)(req, res, (error) => {
			if (error) {
				if (error instanceof multer.MulterError) {
					const message =
						error.code === 'LIMIT_FILE_SIZE'
							? 'File exceeds the 25 MB limit'
							: error.code === 'LIMIT_UNEXPECTED_FILE'
								? 'Maximum 5 evidence files allowed'
								: 'Upload failed, please try again';
					next(new ValidationError(message));
					return;
				}
				next(error);
				return;
			}
			next();
		});
	};
};

export const evidenceUpload: RequestHandler = createMultiUploadHandler(
	'files',
	5,
	EVIDENCE_LIMIT_BYTES,
	evidenceFilter,
);

export default avatarUpload;
