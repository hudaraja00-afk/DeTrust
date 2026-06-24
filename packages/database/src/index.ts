// DeTrust Database Package
// Re-export Prisma client and types

export { prisma, default as prismaClient } from './client';

// Re-export all Prisma types
export * from '@prisma/client';
