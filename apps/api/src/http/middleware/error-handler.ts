import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../domain/errors.js';

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Datos inválidos', issues: error.issues });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.status).json({ code: error.code, message: error.message });
    return;
  }
  req.log?.error({ err: error }, 'Error no controlado');
  res.status(500).json({ code: 'INTERNAL_ERROR', message: 'Error interno del servidor' });
};
