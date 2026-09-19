import { Router } from 'express';
import { CredentialsSchema } from '@chashly/shared';
import type { AuthService } from '../../services/auth.service.js';

export function authRoutes(auth: AuthService): Router {
  const router = Router();

  router.post('/register', async (req, res, next) => {
    try {
      res.status(201).json(await auth.register(CredentialsSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  });

  router.post('/login', async (req, res, next) => {
    try {
      res.json(await auth.login(CredentialsSchema.parse(req.body)));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
