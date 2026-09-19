import { z } from 'zod';

const DEV_SECRET = 'dev-only-secret-do-not-use-in-production-000';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  JWT_SECRET: z.string().min(32).default(DEV_SECRET),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

export type Env = z.infer<typeof EnvSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const env = EnvSchema.parse(source);
  if (env.NODE_ENV === 'production' && env.JWT_SECRET === DEV_SECRET) {
    throw new Error('JWT_SECRET debe configurarse en producción');
  }
  return env;
}
