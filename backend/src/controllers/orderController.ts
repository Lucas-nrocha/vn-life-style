import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { sendOrderConfirmationEmail } from '../services/emailService';
import { OrderStatus } from '@prisma/client';

const createOrderSchema = z.object({
  addressId: z.string().uuid(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  trackingCode: z.string().optional(),
});

const orderInclude = {
  address: true,
  items: {
    include: {
      product: { select: { name: true, images: { take: 1 } } },
      variant: { select: { size: true, color: true } },
    },
  },
  payment: true,
};

export async function createOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createOrderSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { addressId, couponCode, notes } = parsed.data;
    const userId = req.user!.id;

    const address = await prisma.address.findFirst({ where: { id: addressId, userId } });
    if (!address) {
      res.status(404).json({ error: 'Endereço não encontrado' });
      return;
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        variant: { select: { id: true, stock: true, product: { select: { price: true, active: true } } } },
        product: { select: { price: true, active: true, categoryId: true } },
      },
    });

    if (cartItems.length === 0) {
      res.status(400).json({ error: 'Carrinho vazio' });
      return;
    }

    const inactiveItems = cartItems.filter((item) => !item.product.active);
    if (inactiveItems.length > 0) {
      res.status(400).json({ error: 'Alguns produtos não estão mais disponíveis' });
      return;
    }

    const outOfStock = cartItems.filter((item) => item.variant.stock < item.quantity);
    if (outOfStock.length > 0) {
      res.status(400).json({ error: 'Alguns itens estão sem estoque suficiente' });
      return;
    }

    let discount = 0;
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          active: true,
          OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
        },
      });
      if (coupon && (coupon.maxUses === null || coupon.usedCount < coupon.maxUses)) {
        const eligibleItems = coupon.categoryId
          ? cartItems.filter((item) => item.product.categoryId === coupon.categoryId)
          : cartItems;
        const subtotalForCoupon = eligibleItems.reduce(
          (sum, item) => sum + Number(item.product.price) * item.quantity,
          0
        );
        if (!coupon.minOrder || subtotalForCoupon >= Number(coupon.minOrder)) {
          discount =
            coupon.type === 'PERCENTAGE'
              ? subtotalForCoupon * (Number(coupon.value) / 100)
              : Number(coupon.value);
          await prisma.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }
    }

    const subtotal = cartItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );
    const shippingCost = subtotal >= 299 ? 0 : 15;
    const total = subtotal + shippingCost - discount;

    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          userId,
          addressId,
          subtotal,
          shippingCost,
          discount,
          total,
          couponCode: couponCode?.toUpperCase(),
          notes,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              unitPrice: Number(item.product.price),
              totalPrice: Number(item.product.price) * item.quantity,
            })),
          },
          payment: {
            create: { amount: total, status: 'PENDING' },
          },
        },
        include: orderInclude,
      }),
      ...cartItems.map((item) =>
        prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        })
      ),
      prisma.cartItem.deleteMany({ where: { userId } }),
    ]);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      sendOrderConfirmationEmail({
        userName: user.name,
        userEmail: user.email,
        orderId: order.id,
        total: Number(order.total),
        items: order.items.map((item) => ({
          name: item.product.name,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
        })),
      }).catch(console.error);
    }

    res.status(201).json({ order });
  } catch (err) {
    next(err);
  }
}

export async function listOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        include: orderInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    res.json({ orders, total, page, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId },
      include: orderInclude,
    });

    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function validateCoupon(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const code = (req.query.code as string)?.toUpperCase();
    if (!code) {
      res.status(400).json({ error: 'Código do cupom é obrigatório' });
      return;
    }

    const userId = req.user!.id;

    const coupon = await prisma.coupon.findFirst({
      where: {
        code,
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      include: { category: { select: { id: true, name: true } } },
    });

    if (!coupon || (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)) {
      res.status(404).json({ error: 'Cupom inválido ou expirado' });
      return;
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: { select: { price: true, categoryId: true } } },
    });

    const eligibleItems = coupon.categoryId
      ? cartItems.filter((item) => item.product.categoryId === coupon.categoryId)
      : cartItems;

    if (eligibleItems.length === 0) {
      const msg = coupon.categoryId
        ? `Este cupom é válido apenas para produtos da categoria "${coupon.category?.name}"`
        : 'Nenhum item elegível no carrinho';
      res.status(400).json({ error: msg });
      return;
    }

    const effectiveSubtotal = eligibleItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    );

    if (coupon.minOrder && effectiveSubtotal < Number(coupon.minOrder)) {
      res.status(400).json({
        error: `Pedido mínimo de R$ ${Number(coupon.minOrder).toFixed(2).replace('.', ',')} para este cupom`,
      });
      return;
    }

    const discount =
      coupon.type === 'PERCENTAGE'
        ? effectiveSubtotal * (Number(coupon.value) / 100)
        : Number(coupon.value);

    res.json({
      valid: true,
      discount,
      type: coupon.type,
      value: Number(coupon.value),
      categoryName: coupon.category?.name ?? null,
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId },
      include: { items: true },
    });

    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    const cancellableStatuses = ['PENDING', 'CONFIRMED'];
    if (!cancellableStatuses.includes(order.status)) {
      res.status(400).json({ error: 'Este pedido não pode mais ser cancelado' });
      return;
    }

    await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      }),
      ...order.items.map((item) =>
        prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        })
      ),
    ]);

    res.json({ message: 'Pedido cancelado com sucesso' });
  } catch (err) {
    next(err);
  }
}

export async function updateOrderStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateStatusSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Status inválido', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { status, trackingCode } = parsed.data;

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { status, ...(trackingCode ? { trackingCode } : {}) },
      include: orderInclude,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}
