import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export function isAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Acesso negado: apenas administradores' });
    return;
  }
  next();
}
