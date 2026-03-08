/**
 * Environment Configuration
 *
 * Validates and types all environment variables at startup.
 * Fails fast with clear messages if required vars are missing.
 */
import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Auth
  API_KEY: z.string().min(1, 'API_KEY is required'),

  // OpenAI (optional — falls back to simulated extraction)
  OPENAI_API_KEY: z.string().optional(),

  // CSV
  CSV_DELIMITER: z.string().default(';'),

  // Uploads
  UPLOAD_DIR: z.string().default('uploads'),
  TRACCIATO_DIR: z.string().default('tracciato'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    console.error(`\n❌ Invalid environment variables:\n${formatted}\n`);
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();
