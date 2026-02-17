import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { validateTracciatoRow } from '../../../packages/core/src/validation';

const prisma = new PrismaClient();

export async function validationRoutes(fastify: FastifyInstance) {
  // POST /members/:id/validate
  fastify.route({
    method: 'POST',
    url: '/members/:id/validate',
    preHandler: [apiKeyAuth],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const member = await prisma.member.findUnique({ where: { id } });
      if (!member) return reply.code(404).send({ error: 'Not found' });
      // Build row for validation from member fields
      const row = { ...member };
      const issues = validateTracciatoRow(row);
      // Store issues in DB
      await prisma.validationIssue.deleteMany({ where: { memberId: id } });
      await prisma.validationIssue.createMany({
        data: issues.map(issue => ({
          memberId: id,
          severity: issue.severity,
          code: issue.code,
          message: issue.message,
          field: issue.field,
          source: issue.source,
        })),
      });
      reply.send({ issues });
    },
    schema: {
      body: { type: ['object', 'null'] }, // Accept empty or object body
    },
    config: {
      rawBody: true, // Accept raw body
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
