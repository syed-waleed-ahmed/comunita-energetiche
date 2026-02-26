import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { DocumentExtractor } from '../../../packages/core/src/extractor';
import { getExtractionSchema, getExtractableDocTypes } from '../../../packages/core/src/extractionSchemas';
import { DocType } from '../../../packages/core/src/docTypes';

const prisma = new PrismaClient();
const extractor = new DocumentExtractor();

const ExtractionRunSchema = z.object({
  documentId: z.string(),
  schemaName: z.string().optional(), // if not provided, auto-detect from document's docType
});

export async function extractionRoutes(fastify: FastifyInstance) {
  // POST /extractions/run — extract structured data from a document
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

      // Use provided schemaName or auto-detect from document's docType
      const docType = (data.schemaName || doc.docType) as DocType;

      // Run extraction
      const result = await extractor.extract(doc.storagePath, docType);

      // Store extraction result
      const extraction = await prisma.extractionResult.create({
        data: {
          documentId: doc.id,
          schemaName: docType,
          json: result.fields,
          confidence: result.confidence,
          evidence: result.evidence || {},
        },
      });

      // Update document extractionStatus
      const status = result.extractable ? 'DONE' : 'NOT_EXTRACTABLE';
      await prisma.document.update({
        where: { id: doc.id },
        data: { extractionStatus: status },
      });

      reply.send({
        extraction,
        needsReview: result.needsReview,
        extractable: result.extractable,
      });
    },
  });

  // GET /extractions/schemas — list available extraction schemas
  fastify.get('/extractions/schemas', {
    preHandler: [apiKeyAuth],
    handler: async (_request, reply) => {
      const extractable = getExtractableDocTypes();
      const schemas = extractable.map((docType) => {
        const schema = getExtractionSchema(docType);
        return {
          docType,
          fields: schema ? Object.keys(schema.shape) : [],
        };
      });
      reply.send({ schemas });
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
