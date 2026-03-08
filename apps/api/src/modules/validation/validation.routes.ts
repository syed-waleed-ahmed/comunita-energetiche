/**
 * Validation Routes
 */
import { FastifyInstance } from 'fastify';
import { validationService } from './validation.service';

export async function validationRoutes(fastify: FastifyInstance) {
  fastify.route({
    method: 'POST',
    url: '/members/:id/validate',
    handler: async (request, reply) => {
      const { id } = request.params as { id: string };
      const result = await validationService.validateMember(id);
      reply.send(result);
    },
    schema: {
      body: { type: ['object', 'null'] },
    },
    config: {
      rawBody: true,
    },
  });
}
