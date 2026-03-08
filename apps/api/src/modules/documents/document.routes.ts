/**
 * Document Routes
 */
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import multer from 'fastify-multer';
import path from 'path';
import { env } from '../../config/env';
import { documentService } from './document.service';

const upload = multer({ dest: path.resolve(process.cwd(), env.UPLOAD_DIR) });

const DocumentUploadSchema = z.object({
  memberId: z.string(),
  docType: z.string(),
});

export async function documentRoutes(fastify: FastifyInstance) {
  fastify.register(multer.contentParser);

  // Upload document
  fastify.post('/documents', {
    preHandler: [upload.single('file')],
    handler: async (request: any, reply) => {
      const result = DocumentUploadSchema.safeParse(request.body);
      if (!result.success) {
        return reply.code(400).send({ error: 'Invalid body', details: result.error.issues });
      }
      const file = request.file;
      if (!file) return reply.code(400).send({ error: 'No file uploaded' });

      const doc = await documentService.upload(result.data.memberId, result.data.docType, file);
      reply.code(201).send(doc);
    },
  });

  // List documents for a member
  fastify.get('/members/:id/documents', async (request, reply) => {
    const { id } = request.params as { id: string };
    const docs = await documentService.listByMember(id);
    reply.send(docs);
  });
}
