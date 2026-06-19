import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

router.post('/subscribe', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Email inválido' });
      return;
    }

    await prisma.newsletterSubscription.upsert({
      where: { email: parsed.data.email },
      create: { email: parsed.data.email },
      update: { active: true },
    });

    res.json({ message: 'Inscrição realizada com sucesso!' });
  } catch (err) {
    next(err);
  }
});

export default router;
