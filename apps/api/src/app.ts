import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import type { Logger } from 'pino';
import type { Env } from './config/env.js';
import { authenticate } from './http/middleware/authenticate.js';
import { errorHandler } from './http/middleware/error-handler.js';
import { authRoutes } from './http/routes/auth.routes.js';
import { syncRoutes } from './http/routes/sync.routes.js';
import type { Repositories } from './repositories/types.js';
import { AuthService } from './services/auth.service.js';
import { SyncService } from './services/sync.service.js';

export interface AppDeps {
  env: Env;
  repos: Repositories;
  logger: Logger;
}

/** Composición de la aplicación (inyección de dependencias manual). */
export function createApp({ env, repos, logger }: AppDeps) {
  const auth = new AuthService(repos.users, {
    jwtSecret: env.JWT_SECRET,
    jwtExpiresIn: env.JWT_EXPIRES_IN,
  });
  const sync = new SyncService(repos);

  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(',') }));
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.use('/api/auth', authRoutes(auth));
  app.use('/api/sync', authenticate(auth), syncRoutes(sync));

  app.use(errorHandler);
  return app;
}
