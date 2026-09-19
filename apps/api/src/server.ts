import { pino } from 'pino';
import { createApp } from './app.js';
import { loadEnv } from './config/env.js';
import { createInMemoryRepositories } from './repositories/memory/index.js';

const env = loadEnv();
const logger = pino({ level: env.NODE_ENV === 'production' ? 'info' : 'debug' });

// TODO(producción): reemplazar por repositorios PostgreSQL que implementen las mismas interfaces.
const repos = createInMemoryRepositories();
const app = createApp({ env, repos, logger });

const server = app.listen(env.PORT, () => {
  logger.info(`Chashly API escuchando en http://localhost:${env.PORT}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    logger.info({ signal }, 'Cerrando servidor');
    server.close(() => process.exit(0));
  });
}
