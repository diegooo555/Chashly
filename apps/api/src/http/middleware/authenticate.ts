import type { RequestHandler } from 'express';
import { AppError } from '../../domain/errors.js';
import type { AuthService } from '../../services/auth.service.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export function authenticate(auth: AuthService): RequestHandler {
  return (req, _res, next) => {
    const [scheme, token] = (req.headers.authorization ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) return next(AppError.unauthorized());
    try {
      req.userId = auth.verify(token).sub;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/** Obtiene el userId garantizado por `authenticate`. */
export function requireUserId(userId: string | undefined): string {
  if (!userId) throw AppError.unauthorized();
  return userId;
}
