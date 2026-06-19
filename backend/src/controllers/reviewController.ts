import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).optional(),
});

export async function getProductReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: req.params.id },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const avg =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.json({ reviews, average: parseFloat(avg.toFixed(1)), total: reviews.length });
  } catch (err) {
    next(err);
  }
}

export async function createReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const userId = req.user!.id;
    const productId = req.params.id;

    const product = await prisma.product.findUnique({ where: { id: productId, active: true } });
    if (!product) {
      res.status(404).json({ error: 'Produto não encontrado' });
      return;
    }

    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId, status: { in: ['DELIVERED', 'SHIPPED'] } },
      },
    });
    if (!hasPurchased) {
      res.status(403).json({ error: 'Você precisa ter comprado este produto para avaliá-lo' });
      return;
    }

    const review = await prisma.review.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId, ...parsed.data },
      update: parsed.data,
      include: { user: { select: { name: true } } },
    });

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

export async function deleteReview(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const productId = req.params.id;

    const review = await prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (!review) {
      res.status(404).json({ error: 'Avaliação não encontrada' });
      return;
    }

    await prisma.review.delete({ where: { id: review.id } });
    res.json({ message: 'Avaliação removida' });
  } catch (err) {
    next(err);
  }
}
