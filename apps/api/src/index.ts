
import Fastify from 'fastify';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { memberRoutes } from './routes.members';
import { documentRoutes } from './routes.documents';
import { checklistRoutes } from './routes.checklist';
import { extractionRoutes } from './routes.extractions';
import { validationRoutes } from './routes.validation';
import { tracciatoRoutes } from './routes.tracciato';
import { agentRoutes } from './routes.agent';

dotenv.config();

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

// Health check
fastify.get('/health', async () => ({ status: 'ok' }));

// Root route for welcome/info
fastify.get('/', async () => ({
  message: 'Welcome to the Comunità Energetiche API! See /health or /members.'
}));

// Register all routes after fastify is declared
fastify.register(memberRoutes);
fastify.register(documentRoutes);
fastify.register(checklistRoutes);
fastify.register(extractionRoutes);
fastify.register(validationRoutes);
fastify.register(tracciatoRoutes);
fastify.register(agentRoutes);

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3000;
    await fastify.listen({ port, host: '0.0.0.0' });
    const address = fastify.server.address();
    fastify.log.info(`Server listening at http://0.0.0.0:${port}`);
    if (address && typeof address === 'object') {
      fastify.log.info(`Actual address: http://${address.address}:${address.port}`);
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
