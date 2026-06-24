import { Router } from 'express';
import { authenticate, validateBody } from '../middleware';
import { messageController } from '../controllers/message.controller';
import { documentUpload } from '../middleware/upload.middleware';
import { z } from 'zod';

const router: Router = Router();

const stripHtml = (val: string) => val.replace(/<[^>]*>/g, '').trim();

// Validation schema for sending a message
const sendMessageSchema = z.object({
  receiverId: z.string().min(1, 'Receiver ID is required'),
  content: z.string().min(1, 'Message content is required').max(5000).transform(stripHtml),
  jobId: z.string().optional(),
  attachments: z.array(z.string().url()).max(10).optional(),
});

// Get conversation threads (M8-I1)
router.get('/conversations', authenticate, messageController.getConversations);

// Get unread message count
router.get('/unread-count', authenticate, messageController.getUnreadCount);

// Get messages with a specific user (M8-I2)
router.get('/:partnerId', authenticate, messageController.getMessages);

// Send a message (M8-I1)
router.post('/', authenticate, validateBody(sendMessageSchema), messageController.sendMessage);

// Upload a file attachment for messages (M8-I3)
router.post('/upload-attachment', authenticate, documentUpload, messageController.uploadAttachment);

// Mark conversation as read
router.patch('/:partnerId/read', authenticate, messageController.markConversationRead);

export default router;
