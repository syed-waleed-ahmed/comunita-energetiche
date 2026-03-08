/**
 * Member Routes
 */
import { FastifyInstance } from 'fastify';
import { memberService, MemberCreateSchema } from './member.service';

export async function memberRoutes(fastify: FastifyInstance) {
  // Create member
  fastify.post('/members', async (request, reply) => {
    const result = MemberCreateSchema.safeParse(request.body);
    if (!result.success) {
      return reply.code(400).send({ error: 'Invalid body', details: result.error.issues });
    }
    const member = await memberService.create(result.data);
    reply.code(201).send(member);
  });

  // Search members
  fastify.get('/members', async (request, reply) => {
    const { query } = request.query as { query?: string };
    const members = await memberService.search(query);
    reply.send(members);
  });

  // Get member detail
  fastify.get('/members/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const member = await memberService.getById(id);
    if (!member) return reply.code(404).send({ error: 'Not found' });
    reply.send(member);
  });

  // Update member status
  fastify.patch('/members/:id/status', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { status } = request.body as { status: string };
    if (!status) return reply.code(400).send({ error: 'Missing status' });
    const member = await memberService.updateStatus(id, status);
    reply.send(member);
  });

  // Update a single member field
  fastify.patch('/members/:id/field', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { field, value } = request.body as { field: string; value: any };
    if (!field) return reply.code(400).send({ error: 'Missing field' });
    const member = await memberService.updateField(id, field, value);
    reply.send(member);
  });
}
