-- Add MESSAGE_ATTACHMENT category and MESSAGE resource type for chat file attachments
ALTER TYPE "SecureFileCategory" ADD VALUE IF NOT EXISTS 'MESSAGE_ATTACHMENT';
ALTER TYPE "SecureFileResourceType" ADD VALUE IF NOT EXISTS 'MESSAGE';
