/**
 * API Key Authentication Hook
 *
 * Fastify onRequest hook that validates the x-api-key header.
 * Applied globally to all routes except health checks.
 */
import { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { env } from '../config/env';

const PUBLIC_PATHS = new Set(['/', '/health']);

export function apiKeyAuth(
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
): void {
  if (PUBLIC_PATHS.has(request.url)) {
    return done();
  }

  const apiKey = request.headers['x-api-key'];
  if (!apiKey || apiKey !== env.API_KEY) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }

  done();
}
