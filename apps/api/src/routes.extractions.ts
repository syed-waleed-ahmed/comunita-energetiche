import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { FakeLLMExtractor } from '../../../packages/core/src/extractor';
import path from 'path';

const prisma = new PrismaClient();
const extractor = new FakeLLMExtractor();

const ExtractionRunSchema = z.object({
  documentId: z.string(),
  schemaName: z.string(),
});

export async function extractionRoutes(fastify: FastifyInstance) {
  // POST /extractions/run
  fastify.post('/extractions/run', {
    preHandler: [apiKeyAuth],
    handler: async (request, reply) => {
      let data;
      try {
        data = ExtractionRunSchema.parse(request.body);
      } catch (e) {
        return reply.code(400).send({ error: 'Invalid body', details: (e as any).errors });
      }
      const doc = await prisma.document.findUnique({ where: { id: data.documentId } });
      if (!doc) return reply.code(404).send({ error: 'Document not found' });
      // For MVP: use local path
      const result = await extractor.extract(doc.storagePath, data.schemaName);
      // Store extraction result
      const extraction = await prisma.extractionResult.create({
        data: {
          documentId: doc.id,
          schemaName: data.schemaName,
          json: result.fields,
          confidence: result.confidence,
          evidence: result.evidence || {},
        },
      });
      // Update document extractionStatus
      await prisma.document.update({ where: { id: doc.id }, data: { extractionStatus: 'DONE' } });
      reply.send({ extraction, needsReview: result.needsReview });
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
