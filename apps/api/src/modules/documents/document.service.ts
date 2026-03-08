/**
 * Document Service — Business logic for document operations
 */
import { prisma } from '@ce/db';
import path from 'path';
import { env } from '../../config/env';

export class DocumentService {
  async upload(memberId: string, docType: string, file: Express.Multer.File) {
    return prisma.document.create({
      data: {
        memberId,
        docType,
        storagePath: file.path,
        mimeType: file.mimetype,
        extractionStatus: 'PENDING',
      },
    });
  }

  async listByMember(memberId: string) {
    return prisma.document.findMany({ where: { memberId } });
  }
}

export const documentService = new DocumentService();
