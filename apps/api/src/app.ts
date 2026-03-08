/**
 * Fastify Application Factory
 *
 * Creates and configures the Fastify instance with all plugins,
 * middleware, and route modules. Separated from server startup
 * for testability.
 */
import Fastify, { FastifyInstance } from 'fastify';
import { env } from './config/env';
import { apiKeyAuth } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';

// Route modules
import { memberRoutes } from './modules/members/member.routes';
import { documentRoutes } from './modules/documents/document.routes';
import { checklistRoutes } from './modules/checklist/checklist.routes';
import { extractionRoutes } from './modules/extractions/extraction.routes';
import { validationRoutes } from './modules/validation/validation.routes';
import { tracciatoRoutes } from './modules/tracciato/tracciato.routes';
import { agentRoutes } from './modules/agent/agent.routes';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      ...(env.NODE_ENV === 'development' && {
        transport: { target: 'pino-pretty' },
      }),
    },
  });

  // Global error handler
  app.setErrorHandler(errorHandler);

  // Global auth hook
  app.addHook('onRequest', apiKeyAuth);

  // Health check (public — bypassed by auth middleware)
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0',
  }));

  // Root info (public)
  app.get('/', async () => ({
    name: 'Comunità Energetiche API',
    version: process.env.npm_package_version || '0.1.0',
    docs: '/health',
  }));

  // Register route modules
  app.register(memberRoutes);
  app.register(documentRoutes);
  app.register(checklistRoutes);
  app.register(extractionRoutes);
  app.register(validationRoutes);
  app.register(tracciatoRoutes);
  app.register(agentRoutes);

  return app;
}
