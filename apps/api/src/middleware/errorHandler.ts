/**
 * Global Error Handler
 *
 * Catches unhandled errors and returns consistent JSON responses.
 * Logs full error in development, sanitized in production.
 */
import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { env } from '../config/env';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const statusCode = error.statusCode ?? 500;

  request.log.error({
    err: error,
    url: request.url,
    method: request.method,
  });

  reply.code(statusCode).send({
    error: statusCode >= 500 ? 'Internal Server Error' : error.message,
    ...(env.NODE_ENV === 'development' && {
      details: error.message,
      stack: error.stack,
    }),
  });
}
