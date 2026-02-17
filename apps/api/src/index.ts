
import Fastify from 'fastify';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { memberRoutes } from './routes.members';
import { documentRoutes } from './routes.documents';
import { checklistRoutes } from './routes.checklist';
import { extractionRoutes } from './routes.extractions';
import { validationRoutes } from './routes.validation';
import { tracciatoRoutes } from './routes.tracciato';

dotenv.config();

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

// Health check
fastify.get('/health', async () => ({ status: 'ok' }));

// Register all routes after fastify is declared
fastify.register(memberRoutes);
fastify.register(documentRoutes);
fastify.register(checklistRoutes);
fastify.register(extractionRoutes);
fastify.register(validationRoutes);
fastify.register(tracciatoRoutes);

const start = async () => {
  try {
    await fastify.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' });
    fastify.log.info(`Server listening on ${fastify.server.address()}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
