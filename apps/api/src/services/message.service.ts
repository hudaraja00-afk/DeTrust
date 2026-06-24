import { prisma } from '../config/database';
import { getIO } from '../config/socket';
import { NotFoundError, ValidationError } from '../middleware';
import { notificationService } from './notification.service';

interface SendMessageParams {
  senderId: string;
  receiverId: string;
  content: string;
  jobId?: string;
  attachments?: string[];
}

interface GetConversationsParams {
  page?: number;
  limit?: number;
}

interface GetMessagesParams {
  page?: number;
  limit?: number;
}

export class MessageService {
  /**
   * Send a message to another user.
   */
  async sendMessage(params: SendMessageParams) {
    const { senderId, receiverId, content, jobId, attachments } = params;

    if (senderId === receiverId) {
      throw new ValidationError('Cannot send a message to yourself');
    }

    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true, status: true },
    });

    if (!receiver || receiver.status !== 'ACTIVE') {
      throw new NotFoundError('Recipient not found');
    }

    // Verify job exists if provided
    if (jobId) {
      const job = await prisma.job.findUnique({ where: { id: jobId }, select: { id: true } });
      if (!job) {
        throw new NotFoundError('Job not found');
      }
    }

    const message = await prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        jobId: jobId ?? null,
        attachments: attachments ?? [],
      },
      include: {
        sender: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    // Push real-time via Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user:${receiverId}`).emit('message:new', message);
    }

    // Create a notification for the receiver
    const senderName = message.sender?.name ?? 'Someone';
    await notificationService.createNotification({
      userId: receiverId,
      type: 'MESSAGE_RECEIVED',
      title: 'New Message',
      message: `${senderName} sent you a message`,
      data: { senderId, messageId: message.id, jobId: jobId ?? undefined },
    });

    return message;
  }

  /**
   * Get conversation threads for a user.
   * Groups messages by the other participant.
   */
  async getConversations(userId: string, params: GetConversationsParams = {}) {
    const { page = 1, limit = 20 } = params;

    // Get the latest message for each conversation partner
    const sent = await prisma.message.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ['receiverId'],
    });

    const received = await prisma.message.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ['senderId'],
    });

    // Unique conversation partner IDs
    const partnerIds = [
      ...new Set([
        ...sent.map((m: { receiverId: string }) => m.receiverId),
        ...received.map((m: { senderId: string }) => m.senderId),
      ]),
    ];

    const total = partnerIds.length;
    const paginatedIds = partnerIds.slice((page - 1) * limit, page * limit);

    // Build conversation objects
    const conversations = await Promise.all(
      paginatedIds.map(async (partnerId) => {
        const [partner, lastMessage, unreadCount] = await Promise.all([
          prisma.user.findUnique({
            where: { id: partnerId },
            select: { id: true, name: true, avatarUrl: true },
          }),
          prisma.message.findFirst({
            where: {
              OR: [
                { senderId: userId, receiverId: partnerId },
                { senderId: partnerId, receiverId: userId },
              ],
            },
            orderBy: { createdAt: 'desc' },
            include: {
              sender: { select: { id: true, name: true, avatarUrl: true } },
            },
          }),
          prisma.message.count({
            where: {
              senderId: partnerId,
              receiverId: userId,
              readAt: null,
            },
          }),
        ]);

        return {
          id: `${userId}_${partnerId}`,
          participantId: partnerId,
          participant: partner ?? { id: partnerId, name: null, avatarUrl: null },
          lastMessage,
          unreadCount,
          jobId: lastMessage?.jobId ?? null,
        };
      }),
    );

    // Sort by last message date
    conversations.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt?.getTime() ?? 0;
      const bTime = b.lastMessage?.createdAt?.getTime() ?? 0;
      return bTime - aTime;
    });

    return {
      items: conversations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  /**
   * Get messages in a conversation between two users.
   */
  async getMessages(
    userId: string,
    partnerId: string,
    params: GetMessagesParams = {},
  ) {
    const { page = 1, limit = 50 } = params;

    const where = {
      OR: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId },
      ],
    };

    const [items, total] = await Promise.all([
      prisma.message.findMany({
        where,
        include: {
          sender: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.message.count({ where }),
    ]);

    return {
      items: items.reverse(), // chronological order
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  /**
   * Mark all messages from a specific sender as read.
   */
  async markConversationRead(userId: string, partnerId: string) {
    await prisma.message.updateMany({
      where: {
        senderId: partnerId,
        receiverId: userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    // Emit read receipt
    const io = getIO();
    if (io) {
      io.to(`user:${partnerId}`).emit('message:read', { readerId: userId });
    }

    return { success: true };
  }

  /**
   * Get total unread message count for a user.
   */
  async getUnreadCount(userId: string) {
    const count = await prisma.message.count({
      where: { receiverId: userId, readAt: null },
    });
    return { count };
  }
}

export const messageService = new MessageService();
export default messageService;
