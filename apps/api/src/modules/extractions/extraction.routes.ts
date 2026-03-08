/**
 * Extraction Routes
 */
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { extractionService } from './extraction.service';

const ExtractionRunSchema = z.object({
  documentId: z.string(),
  schemaName: z.string().optional(),
});

export async function extractionRoutes(fastify: FastifyInstance) {
  // Run extraction on a document
  fastify.post('/extractions/run', async (request, reply) => {
    const result = ExtractionRunSchema.safeParse(request.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Invalid body', details: result.error.issues });
    }
    const extraction = await extractionService.runExtraction(
      result.data.documentId,
      result.data.schemaName
    );
    reply.send(extraction);
  });

  // List available extraction schemas
  fastify.get('/extractions/schemas', async (_request, reply) => {
    reply.send({ schemas: extractionService.getSchemas() });
  });
}
