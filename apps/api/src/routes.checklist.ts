import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Required docs for MVP
const REQUIRED_DOCS = [
  { docType: 'ID', required: true },
  { docType: 'BILL', required: true },
  { docType: 'PAYMENT', required: false }, // can be toggled by config later
];

export async function checklistRoutes(fastify: FastifyInstance) {
  // List checklist for a member
  fastify.get('/members/:id/checklist', {
    preHandler: [apiKeyAuth],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const docs = await prisma.document.findMany({ where: { memberId: id } });
      const checklist = REQUIRED_DOCS.map(cfg => {
        const received = docs.some(d => d.docType === cfg.docType);
        return {
          docType: cfg.docType,
          required: cfg.required,
          received,
        };
      });
      reply.send({ checklist });
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
