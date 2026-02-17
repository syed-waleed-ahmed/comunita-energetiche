import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import multer from 'fastify-multer';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

const upload = multer({ dest: path.join(process.cwd(), 'uploads/') });

const DocumentUploadSchema = z.object({
  memberId: z.string(),
  docType: z.string(),
});

export async function documentRoutes(fastify: FastifyInstance) {
  fastify.register(multer.contentParser);

  // Upload document
  fastify.post('/documents', {
    preHandler: [apiKeyAuth, upload.single('file')],
    handler: async (request: any, reply) => {
      const { memberId, docType } = DocumentUploadSchema.parse(request.body);
      const file = request.file;
      if (!file) return reply.code(400).send({ error: 'No file uploaded' });
      // For MVP: store locally, in prod use Supabase Storage
      const storagePath = file.path;
      const doc = await prisma.document.create({
        data: {
          memberId,
          docType,
          storagePath,
          mimeType: file.mimetype,
          extractionStatus: 'PENDING',
        },
      });
      reply.code(201).send(doc);
    },
  });

  // List documents for a member
  fastify.get('/members/:id/documents', {
    preHandler: [apiKeyAuth],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const docs = await prisma.document.findMany({ where: { memberId: id } });
      reply.send(docs);
    },
  });
}

function apiKeyAuth(request: any, reply: any, done: any) {
  const apiKey = request.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.default_x_api_key) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }
  done();
}
