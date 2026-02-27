/**
 * Shared Prisma Client Singleton
 * Single database connection reused across all Mastra tools.
 */
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
