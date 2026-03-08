/**
 * Checklist Routes
 */
import { FastifyInstance } from 'fastify';
import { prisma } from '@ce/db';
import { buildChecklist, checkChecklistComplete, MemberType } from '@ce/packages-core';

export async function checklistRoutes(fastify: FastifyInstance) {
  fastify.get('/members/:id/checklist', async (request, reply) => {
    const { id } = request.params as { id: string };
    const member = await prisma.member.findUnique({ where: { id } });
    if (!member) return reply.code(404).send({ error: 'Member not found' });

    const memberType: MemberType =
      (member as any).memberType === 'PRODUCER' ? 'PRODUCER' : 'CONSUMER';

    const docs = await prisma.document.findMany({ where: { memberId: id } });
    const uploadedDocTypes = docs.map((d) => d.docType);

    const checklist = buildChecklist(memberType, uploadedDocTypes);
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
  });
}
