/**
 * Server Entry Point
 *
 * Starts the Fastify server. Import `buildApp` separately for testing.
 */
import dotenv from 'dotenv';
dotenv.config();

// env must be imported AFTER dotenv.config()
import { env } from './config/env';
import { buildApp } from './app';

async function start() {
  const app = buildApp();

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`Server listening on http://${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
