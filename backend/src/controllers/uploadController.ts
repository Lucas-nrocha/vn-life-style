import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';

export function uploadProductImage(req: AuthRequest, res: Response): void {
  if (!req.file) {
    res.status(400).json({ error: 'Nenhum arquivo enviado' });
    return;
  }

  const baseUrl = process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`;
  const url = `${baseUrl}/uploads/produtos/${req.file.filename}`;

  res.json({ url });
}
