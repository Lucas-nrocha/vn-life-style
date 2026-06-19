import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  if (err.code === 'P2002') {
    res.status(409).json({ error: 'Registro duplicado' });
    return;
  }

  if (err.code === 'P2025') {
    res.status(404).json({ error: 'Registro não encontrado' });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production' && statusCode === 500
      ? 'Erro interno do servidor'
      : err.message;

  res.status(statusCode).json({ error: message });
}
