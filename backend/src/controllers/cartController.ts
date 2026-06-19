import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const addItemSchema = z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1, 'Quantidade deve ser ao menos 1'),
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(1, 'Quantidade deve ser ao menos 1'),
});

const cartInclude = {
  product: {
    select: {
      id: true,
      name: true,
      price: true,
      active: true,
      images: { where: { position: 0 }, take: 1 },
    },
  },
  variant: {
    select: { id: true, size: true, color: true, stock: true, sku: true },
  },
};

export async function getCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user!.id },
      include: cartInclude,
    });

    const subtotal = items.reduce((sum, item) => {
      return sum + Number(item.product.price) * item.quantity;
    }, 0);

    res.json({ items, subtotal });
  } catch (err) {
    next(err);
  }
}

export async function addToCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = addItemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { variantId, quantity } = parsed.data;
    const userId = req.user!.id;

    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      res.status(404).json({ error: 'Variante não encontrada' });
      return;
    }

    if (variant.stock < quantity) {
      res.status(400).json({ error: `Estoque insuficiente. Disponível: ${variant.stock}` });
      return;
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { userId_variantId: { userId, variantId } },
    });

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (variant.stock < newQuantity) {
        res.status(400).json({ error: `Estoque insuficiente. Disponível: ${variant.stock}` });
        return;
      }

      const item = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: cartInclude,
      });
      res.json({ item });
      return;
    }

    const item = await prisma.cartItem.create({
      data: { userId, productId: variant.productId, variantId, quantity },
      include: cartInclude,
    });

    res.status(201).json({ item });
  } catch (err) {
    next(err);
  }
}

export async function updateCartItem(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateItemSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { quantity } = parsed.data;
    const userId = req.user!.id;

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: req.params.itemId, userId },
      include: { variant: true },
    });

    if (!cartItem) {
      res.status(404).json({ error: 'Item não encontrado no carrinho' });
      return;
    }

    if (cartItem.variant.stock < quantity) {
      res.status(400).json({ error: `Estoque insuficiente. Disponível: ${cartItem.variant.stock}` });
      return;
    }

    const updated = await prisma.cartItem.update({
      where: { id: req.params.itemId },
      data: { quantity },
      include: cartInclude,
    });

    res.json({ item: updated });
  } catch (err) {
    next(err);
  }
}

export async function removeFromCart(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;

    const cartItem = await prisma.cartItem.findFirst({
      where: { id: req.params.itemId, userId },
    });

    if (!cartItem) {
      res.status(404).json({ error: 'Item não encontrado no carrinho' });
      return;
    }

    await prisma.cartItem.delete({ where: { id: req.params.itemId } });
    res.json({ message: 'Item removido do carrinho' });
  } catch (err) {
    next(err);
  }
}
