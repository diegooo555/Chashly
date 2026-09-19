import { Router } from 'express';
import { PullQuerySchema, PushRequestSchema, type PushResponse } from '@chashly/shared';
import type { SyncService } from '../../services/sync.service.js';
import { requireUserId } from '../middleware/authenticate.js';

export function syncRoutes(sync: SyncService): Router {
  const router = Router();

  router.post('/push', async (req, res, next) => {
    try {
      const { changes } = PushRequestSchema.parse(req.body);
      const body: PushResponse = { results: await sync.push(requireUserId(req.userId), changes) };
      res.json(body);
    } catch (error) {
      next(error);
    }
  });

  router.get('/pull', async (req, res, next) => {
    try {
      const { since, limit } = PullQuerySchema.parse(req.query);
      res.json(await sync.pull(requireUserId(req.userId), since, limit));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
