import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { buildChecklist, checkChecklistComplete } from '../../../packages/core/src/checklistConfig';
import { MemberType } from '../../../packages/core/src/docTypes';

const prisma = new PrismaClient();

export async function checklistRoutes(fastify: FastifyInstance) {
  // Get the full document checklist for a member
  // Returns which documents are required, optional, and which have been received
  fastify.get('/members/:id/checklist', {
    preHandler: [apiKeyAuth],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };

      // Look up the member to determine their type (CONSUMER or PRODUCER)
      const member = await prisma.member.findUnique({ where: { id } });
      if (!member) return reply.code(404).send({ error: 'Member not found' });

      // Default to CONSUMER if memberType is not set
      const memberType: MemberType = (member as any).memberType === 'PRODUCER' ? 'PRODUCER' : 'CONSUMER';

      // Get all documents already uploaded for this member
      const docs = await prisma.document.findMany({ where: { memberId: id } });
      const uploadedDocTypes = docs.map((d) => d.docType);

      // Build the checklist against the member type
      const checklist = buildChecklist(memberType, uploadedDocTypes);

      // Check overall completeness
      const { complete, missingDocs } = checkChecklistComplete(memberType, uploadedDocTypes);

      reply.send({
        memberType,
        checklist,
        complete,
        missingRequired: missingDocs.map((d) => ({
          docType: d.code,
          displayName: d.displayName,
        })),
      });
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
