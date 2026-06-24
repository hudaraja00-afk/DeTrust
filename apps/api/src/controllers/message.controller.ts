import { Request, Response, NextFunction } from 'express';
import { SecureFileCategory, SecureFileResourceType, SecureFileVisibility } from '@prisma/client';

import { AuthenticatedRequest } from '../middleware';
import { ValidationError } from '../middleware';
import { messageService } from '../services/message.service';
import { storageService } from '../services/storage.service';
import { config } from '../config';

/**
 * Send a message
 * POST /api/messages
 */
const sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const senderId = authReq.userId!;
    const { receiverId, content, jobId, attachments } = req.body;

    const message = await messageService.sendMessage({
      senderId,
      receiverId,
      content,
      jobId,
      attachments,
    });
    res.status(201).json({ success: true, data: message, message: 'Message sent' });
  } catch (error) {
    next(error);
  }
};

/**
 * Get conversation threads
 * GET /api/messages/conversations
 */
const getConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);

    const result = await messageService.getConversations(userId, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Get messages in a conversation
 * GET /api/messages/:partnerId
 */
const getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const { partnerId } = req.params;

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 100);

    const result = await messageService.getMessages(userId, partnerId, { page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark conversation as read
 * PATCH /api/messages/:partnerId/read
 */
const markConversationRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;
    const { partnerId } = req.params;

    const result = await messageService.markConversationRead(userId, partnerId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread message count
 * GET /api/messages/unread-count
 */
const getUnreadCount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;

    const result = await messageService.getUnreadCount(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload a file attachment for a message
 * POST /api/messages/upload-attachment
 */
const uploadAttachment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId!;

    if (!req.file) {
      throw new ValidationError('No file provided');
    }

    const secureFile = await storageService.uploadSecureFile({
      buffer: req.file.buffer,
      filename: req.file.originalname || `msg-attachment-${Date.now()}`,
      mimeType: req.file.mimetype,
      size: req.file.size,
      userId,
      category: SecureFileCategory.MESSAGE_ATTACHMENT,
      visibility: SecureFileVisibility.AUTHENTICATED,
      resourceType: SecureFileResourceType.MESSAGE,
      resourceId: userId,
    });

    const baseUrl = config.server.apiUrl.replace(/\/$/, '');
    const url = `${baseUrl}/api/uploads/${secureFile.id}`;

    res.status(201).json({
      success: true,
      data: {
        url,
        fileId: secureFile.id,
        mimeType: secureFile.mimeType,
        size: secureFile.size,
        filename: secureFile.filename,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const messageController = {
  sendMessage,
  getConversations,
  getMessages,
  markConversationRead,
  getUnreadCount,
  uploadAttachment,
};
