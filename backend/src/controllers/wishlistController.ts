import { Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const productInclude = {
  category: true,
  images: { orderBy: { position: 'asc' as const }, take: 1 },
  variants: true,
};

export async function getWishlist(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.id },
      include: { product: { include: productInclude } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
}

export async function toggleWishlist(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { productId } = req.params;
    const userId = req.user!.id;

    const existing = await prisma.wishlistItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
      res.json({ wishlisted: false });
    } else {
      const product = await prisma.product.findUnique({ where: { id: productId, active: true } });
      if (!product) {
        res.status(404).json({ error: 'Produto não encontrado' });
        return;
      }
      await prisma.wishlistItem.create({ data: { userId, productId } });
      res.json({ wishlisted: true });
    }
  } catch (err) {
    next(err);
  }
}
