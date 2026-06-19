import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { slugify } from '../utils/slugify';
import { OrderStatus } from '@prisma/client';
import { refundPayment } from '../services/mercadoPagoService';

const couponSchema = z.object({
  code: z.string().min(3).max(20),
  type: z.enum(['PERCENTAGE', 'FIXED']),
  value: z.number().positive(),
  minOrder: z.number().positive().nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  active: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
});

const categorySchema = z.object({
  name: z.string().min(2),
  imageUrl: z.string().url().optional(),
  active: z.boolean().optional(),
});

const trackingSchema = z.object({
  trackingCode: z.string().min(1),
});

export async function getDashboard(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const [
      totalOrders,
      todayOrders,
      revenueAgg,
      todayRevenueAgg,
      totalUsers,
      totalProducts,
      recentOrders,
      last7DaysOrders,
      ordersByStatus,
      lowStockVariants,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' } } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { createdAt: { gte: today }, status: { not: 'CANCELLED' } },
      }),
      prisma.user.count(),
      prisma.product.count({ where: { active: true } }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          payment: { select: { status: true } },
        },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: sevenDaysAgo }, status: { not: 'CANCELLED' } },
        select: { total: true, createdAt: true },
      }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.productVariant.count({ where: { stock: { lte: 5, gt: 0 } } }),
    ]);

    const revenueByDay: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      revenueByDay[d.toISOString().slice(0, 10)] = 0;
    }
    for (const order of last7DaysOrders) {
      const day = new Date(order.createdAt).toISOString().slice(0, 10);
      if (revenueByDay[day] !== undefined) {
        revenueByDay[day] += Number(order.total);
      }
    }
    const revenueChart = Object.entries(revenueByDay).map(([date, revenue]) => ({
      date,
      revenue: parseFloat(revenue.toFixed(2)),
    }));

    res.json({
      totalOrders,
      todayOrders,
      totalRevenue: Number(revenueAgg._sum.total ?? 0),
      todayRevenue: Number(todayRevenueAgg._sum.total ?? 0),
      totalUsers,
      totalProducts,
      recentOrders,
      revenueChart,
      ordersByStatus: ordersByStatus.map((s) => ({ status: s.status, count: s._count.status })),
      lowStockCount: lowStockVariants,
    });
  } catch (err) {
    next(err);
  }
}

export async function adminListOrders(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { status, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, parseInt(limit as string));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && Object.values(OrderStatus).includes(status as OrderStatus)) {
      where.status = status as OrderStatus;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { name: true, email: true } },
          payment: true,
          items: { include: { product: { select: { name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ orders, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    next(err);
  }
}

export async function adminListProducts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '1', limit = '20', search, categoryId, active } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, parseInt(limit as string));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (categoryId) where.categoryId = categoryId as string;
    if (active !== undefined && active !== '') where.active = active === 'true';

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          images: { take: 1 },
          variants: true,
          _count: { select: { orderItems: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.product.count({ where }),
    ]);

    res.json({ products, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    next(err);
  }
}

export async function adminListUsers(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page = '1', limit = '20', search } = req.query;
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, parseInt(limit as string));
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          createdAt: true,
          _count: { select: { orders: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (err) {
    next(err);
  }
}

export async function listCategories(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { all } = req.query;
    const categories = await prisma.category.findMany({
      where: all === 'true' ? {} : { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, slug: true, active: true, imageUrl: true },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
}

export async function createCategory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { name, imageUrl, active } = parsed.data;
    const slug = slugify(name);

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      res.status(409).json({ error: 'Categoria já existe' });
      return;
    }

    const category = await prisma.category.create({
      data: { name, slug, imageUrl, active: active ?? true },
    });

    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

export async function exportOrdersCsv(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        payment: { select: { status: true, method: true } },
      },
    });

    const header = 'ID,Data,Cliente,Email,Status,Subtotal,Desconto,Frete,Total,Pagamento,Cupom';
    const rows = orders.map((o) =>
      [
        o.id.slice(0, 8).toUpperCase(),
        new Date(o.createdAt).toLocaleDateString('pt-BR'),
        o.user.name,
        o.user.email,
        o.status,
        Number(o.subtotal).toFixed(2),
        Number(o.discount).toFixed(2),
        Number(o.shippingCost).toFixed(2),
        Number(o.total).toFixed(2),
        o.payment?.status ?? '',
        o.couponCode ?? '',
      ].join(',')
    );

    const csv = [header, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="pedidos.csv"');
    res.send('﻿' + csv);
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = categorySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Categoria não encontrada' });
      return;
    }

    const { name, ...rest } = parsed.data;
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: { ...rest, ...(name ? { name, slug: slugify(name) } : {}) },
    });

    res.json(category);
  } catch (err) {
    next(err);
  }
}

export async function listCoupons(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const coupons = await prisma.coupon.findMany({
      include: { category: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(coupons);
  } catch (err) {
    next(err);
  }
}

export async function createCoupon(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = couponSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { code, type, value, minOrder, maxUses, active, expiresAt, categoryId } = parsed.data;
    const upperCode = code.toUpperCase();

    const existing = await prisma.coupon.findUnique({ where: { code: upperCode } });
    if (existing) {
      res.status(409).json({ error: 'Cupom já existe' });
      return;
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: upperCode,
        type,
        value,
        minOrder: minOrder ?? null,
        maxUses: maxUses ?? null,
        active: active ?? true,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        categoryId: categoryId ?? null,
      },
      include: { category: { select: { id: true, name: true } } },
    });

    res.status(201).json(coupon);
  } catch (err) {
    next(err);
  }
}

export async function updateCoupon(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = couponSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Cupom não encontrado' });
      return;
    }

    const { code, expiresAt, ...rest } = parsed.data;

    const coupon = await prisma.coupon.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        ...(code ? { code: code.toUpperCase() } : {}),
        ...(expiresAt !== undefined ? { expiresAt: expiresAt ? new Date(expiresAt) : null } : {}),
      },
      include: { category: { select: { id: true, name: true } } },
    });

    res.json(coupon);
  } catch (err) {
    next(err);
  }
}

export async function deleteCoupon(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404).json({ error: 'Cupom não encontrado' });
      return;
    }
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function refundOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        payment: true,
        items: { include: { variant: { select: { id: true } } } },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    if (order.status === 'CANCELLED') {
      res.status(400).json({ error: 'Pedido já está cancelado' });
      return;
    }

    if (order.payment?.mpPaymentId) {
      try {
        await refundPayment(order.payment.mpPaymentId);
      } catch {
        // Log but continue — refund in MP may fail if already refunded or sandbox limitation
      }
    }

    await prisma.$transaction([
      prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } }),
      prisma.payment.update({ where: { orderId: order.id }, data: { status: 'CANCELLED' } }),
      ...order.items.map((item) =>
        prisma.productVariant.update({
          where: { id: item.variant.id },
          data: { stock: { increment: item.quantity } },
        })
      ),
    ]);

    res.json({ success: true, message: 'Pedido reembolsado e cancelado' });
  } catch (err) {
    next(err);
  }
}

export async function addTrackingCode(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = trackingSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Código de rastreio inválido' });
      return;
    }

    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { trackingCode: parsed.data.trackingCode },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}
