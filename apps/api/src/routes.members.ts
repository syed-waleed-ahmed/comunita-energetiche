import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MemberCreateSchema = z.object({
  name: z.string().optional(),
  surname: z.string().optional(),
  fiscalCode: z.string().optional(),
  vatNumber: z.string().optional(),
  legalType: z.string().optional(),
  subjectType: z.string().optional(),
  podCode: z.string().optional(),
});

export async function memberRoutes(fastify: FastifyInstance) {
    // Update member status
    fastify.patch('/members/:id/status', {
      preHandler: [apiKeyAuth],
      handler: async (request, reply) => {
        const { id } = request.params as { id: string };
        const { status } = request.body as { status: string };
        if (!status) return reply.code(400).send({ error: 'Missing status' });
        const member = await prisma.member.update({ where: { id }, data: { status } });
        reply.send(member);
      },
    });
  // Create member
  fastify.post('/members', {
    preHandler: [apiKeyAuth],
    handler: async (request, reply) => {
      let data;
      try {
        data = MemberCreateSchema.parse(request.body);
      } catch (e) {
        return reply.code(400).send({ error: 'Invalid body', details: (e as any).errors });
      }
      const member = await prisma.member.create({ data: { ...data, status: 'DRAFT' } });
      reply.code(201).send(member);
    },
  });

  // Search members
  fastify.get('/members', {
    preHandler: [apiKeyAuth],
    handler: async (request, reply) => {
      const { query } = request.query as { query?: string };
      const where = query
        ? {
            OR: [
              { name: { contains: query, mode: 'insensitive' } as any },
              { surname: { contains: query, mode: 'insensitive' } as any },
              { fiscalCode: { contains: query, mode: 'insensitive' } as any },
              { vatNumber: { contains: query, mode: 'insensitive' } as any },
              { podCode: { contains: query, mode: 'insensitive' } as any },
            ],
          }
        : undefined;
      const members = await prisma.member.findMany({ where, take: 50 });
      reply.send(members);
    },
  });

  // Get member detail
  fastify.get('/members/:id', {
    preHandler: [apiKeyAuth],
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const member = await prisma.member.findUnique({ where: { id }, include: { documents: true, validationIssues: true } });
      if (!member) return reply.code(404).send({ error: 'Not found' });
      reply.send(member);
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
