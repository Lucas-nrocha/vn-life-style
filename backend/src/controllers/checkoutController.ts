import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';
import { createPreference, getPaymentInfo } from '../services/mercadoPagoService';

function verifyMpWebhookSignature(req: Request): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // Skip validation if no secret configured

  const xSignature = req.headers['x-signature'] as string;
  const xRequestId = req.headers['x-request-id'] as string;
  if (!xSignature || !xRequestId) return false;

  const ts = xSignature.match(/ts=([^,]+)/)?.[1];
  const v1 = xSignature.match(/v1=([^,]+)/)?.[1];
  if (!ts || !v1) return false;

  const dataId = (req.body?.data?.id ?? '').toString();
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
}

const createPaymentSchema = z.object({
  orderId: z.string().uuid(),
});

export async function createPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { orderId } = parsed.data;
    const userId = req.user!.id;

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: {
        items: { include: { product: { select: { name: true } } } },
        payment: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    if (order.payment?.status === 'APPROVED') {
      res.status(400).json({ error: 'Este pedido já foi pago' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    const preference = await createPreference({
      orderId,
      items: order.items.map((item) => ({
        title: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
      })),
      payer: { name: user!.name, email: user!.email },
      totalAmount: Number(order.total),
    });

    await prisma.payment.update({
      where: { orderId },
      data: { mpPreferenceId: preference.id },
    });

    res.json({
      preferenceId: preference.id,
      initPoint: preference.init_point,
      sandboxInitPoint: preference.sandbox_init_point,
    });
  } catch (err) {
    next(err);
  }
}

export async function webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!verifyMpWebhookSignature(req)) {
      res.status(401).json({ error: 'Assinatura inválida' });
      return;
    }

    const { type, data } = req.body;

    if (type !== 'payment') {
      res.status(200).json({ received: true });
      return;
    }

    const paymentInfo = await getPaymentInfo(data.id);
    const orderId = paymentInfo.external_reference;

    if (!orderId) {
      res.status(200).json({ received: true });
      return;
    }

    const payment = await prisma.payment.findFirst({ where: { orderId } });
    if (!payment) {
      res.status(200).json({ received: true });
      return;
    }

    let paymentStatus: 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'PENDING' = 'PENDING';
    let orderStatus: 'CONFIRMED' | 'CANCELLED' | 'PENDING' = 'PENDING';

    if (paymentInfo.status === 'approved') {
      paymentStatus = 'APPROVED';
      orderStatus = 'CONFIRMED';
    } else if (paymentInfo.status === 'rejected') {
      paymentStatus = 'REJECTED';
      orderStatus = 'CANCELLED';
    } else if (paymentInfo.status === 'cancelled') {
      paymentStatus = 'CANCELLED';
      orderStatus = 'CANCELLED';
    }

    await prisma.payment.update({
      where: { orderId },
      data: {
        mpPaymentId: String(paymentInfo.id),
        status: paymentStatus,
        method: paymentInfo.payment_type_id,
        paidAt: paymentStatus === 'APPROVED' ? new Date() : undefined,
      },
    });

    await prisma.order.update({
      where: { id: orderId },
      data: { status: orderStatus },
    });

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[Webhook Error]', err);
    res.status(200).json({ received: true });
  }
}

export async function getOrderStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;

    const order = await prisma.order.findFirst({
      where: { id: req.params.orderId, userId },
      include: { payment: true },
    });

    if (!order) {
      res.status(404).json({ error: 'Pedido não encontrado' });
      return;
    }

    res.json({
      orderId: order.id,
      orderStatus: order.status,
      paymentStatus: order.payment?.status ?? 'PENDING',
    });
  } catch (err) {
    next(err);
  }
}
