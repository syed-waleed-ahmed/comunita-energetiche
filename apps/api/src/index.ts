/**
 * @deprecated Use server.ts as the entry point.
 * This file is kept for backward compatibility only.
 */
export { buildApp } from './app';

// If run directly, start the server
import dotenv from 'dotenv';
dotenv.config();

import { env } from './config/env';
import { buildApp } from './app';

const app = buildApp();
app.listen({ port: env.PORT, host: env.HOST }).then(() => {
  app.log.info(`Server listening on http://${env.HOST}:${env.PORT}`);
}).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
