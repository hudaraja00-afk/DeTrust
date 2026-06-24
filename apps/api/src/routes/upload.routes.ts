import { Router } from 'express';

import { uploadController } from '../controllers';
import { authenticate, optionalAuth, requireFreelancer } from '../middleware';
import { avatarUpload, documentUpload } from '../middleware/upload.middleware';

const router: Router = Router();

router.post('/avatar', authenticate, avatarUpload, uploadController.uploadAvatar.bind(uploadController));
router.post('/resume', authenticate, requireFreelancer, documentUpload, uploadController.uploadResume.bind(uploadController));
router.post('/certifications', authenticate, requireFreelancer, documentUpload, uploadController.uploadCertification.bind(uploadController));
router.post('/deliverable', authenticate, requireFreelancer, documentUpload, uploadController.uploadDeliverable.bind(uploadController));
router.get('/:fileId', optionalAuth, uploadController.streamFile.bind(uploadController));

export default router;
