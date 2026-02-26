import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { validateTracciatoRow } from '../../../packages/core/src/validation';
import { crossValidateMember } from '../../../packages/core/src/crossValidation';
import { DOC_TYPES } from '../../../packages/core/src/docTypes';

const prisma = new PrismaClient();

export async function validationRoutes(fastify: FastifyInstance) {
  // POST /members/:id/validate
  // Runs both row-level validation AND cross-document validation
  fastify.route({
    method: 'POST',
    url: '/members/:id/validate',
    preHandler: [apiKeyAuth],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const member = await prisma.member.findUnique({ where: { id } });
      if (!member) return reply.code(404).send({ error: 'Not found' });

      // ── Step 1: Row-level validation (field formats, required, enum, etc.) ──
      const row = { ...member };
      const rowIssues = validateTracciatoRow(row);

      // ── Step 2: Cross-document validation (data consistency across documents) ──
      // Fetch all extraction results for this member's documents
      const documents = await prisma.document.findMany({
        where: { memberId: id },
        include: { extractionResults: true },
      });

      // Build extraction map: docType → extracted fields
      const extractions: Record<string, Record<string, any>> = {};
      for (const doc of documents) {
        if (doc.extractionResults.length > 0) {
          // Use the most recent extraction result for each doc type
          const latest = doc.extractionResults.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];
          extractions[doc.docType] = latest.json as Record<string, any>;
        }
      }

      const crossIssues = crossValidateMember({ member: member as any, extractions });

      // ── Combine all issues ──
      const allIssues = [...rowIssues, ...crossIssues];

      // Store issues in DB (replace previous ones)
      await prisma.validationIssue.deleteMany({ where: { memberId: id } });
      if (allIssues.length > 0) {
        await prisma.validationIssue.createMany({
          data: allIssues.map(issue => ({
            memberId: id,
            severity: issue.severity,
            code: issue.code,
            message: issue.message,
            field: issue.field,
            source: issue.source,
          })),
        });
      }

      reply.send({
        rowValidation: { issueCount: rowIssues.length, issues: rowIssues },
        crossValidation: { issueCount: crossIssues.length, issues: crossIssues },
        totalIssues: allIssues.length,
      });
    },
    schema: {
      body: { type: ['object', 'null'] },
    },
    config: {
      rawBody: true,
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
