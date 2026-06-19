import request from 'supertest';
import { app } from '../app';
import { prismaMock } from './setup';
import { generateAccessToken } from '../utils/jwt';
import { Role, OrderStatus, PaymentStatus } from '@prisma/client';

jest.mock('../services/mercadoPagoService');
import { createPreference } from '../services/mercadoPagoService';

const ORDER_ID   = '550e8400-e29b-41d4-a716-446655440005';
const OTHER_UUID  = '550e8400-e29b-41d4-a716-446655449999';

const token = generateAccessToken({ id: 'user-1', role: Role.CUSTOMER });

const mockOrder = {
  id: ORDER_ID,
  userId: 'user-1',
  status: OrderStatus.PENDING,
  total: '194.80' as any,
  items: [
    {
      quantity: 2,
      unitPrice: '89.90' as any,
      product: { name: 'Camiseta Essencial' },
      variant: { size: 'M', color: 'Preto' },
    },
  ],
  payment: {
    id: 'pay-1',
    status: PaymentStatus.PENDING,
    mpPreferenceId: null,
    amount: '194.80' as any,
  },
};

describe('POST /api/checkout/create-payment', () => {
  it('should create Mercado Pago preference for pending order', async () => {
    prismaMock.order.findFirst.mockResolvedValue(mockOrder as any);
    prismaMock.user.findUnique.mockResolvedValue({ id: 'user-1', name: 'Test User', email: 'test@example.com' } as any);
    (createPreference as jest.Mock).mockResolvedValue({
      id: 'mp-preference-id',
      init_point: 'https://www.mercadopago.com.br/checkout/v1/redirect?pref_id=mp-preference-id',
      sandbox_init_point: 'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=mp-preference-id',
    });
    prismaMock.payment.update.mockResolvedValue({
      id: 'pay-1',
      orderId: 'order-1',
      mpPaymentId: null,
      mpPreferenceId: 'mp-preference-id',
      status: PaymentStatus.PENDING,
      method: null,
      amount: '194.80' as any,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post('/api/checkout/create-payment')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: ORDER_ID });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('preferenceId');
    expect(res.body).toHaveProperty('initPoint');
    expect(res.body).toHaveProperty('sandboxInitPoint');
  });

  it('should return 404 when order not found', async () => {
    prismaMock.order.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/checkout/create-payment')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: OTHER_UUID });

    expect(res.status).toBe(404);
  });

  it('should return 400 when order is already paid', async () => {
    prismaMock.order.findFirst.mockResolvedValue({
      ...mockOrder,
      status: OrderStatus.CONFIRMED,
      payment: { ...mockOrder.payment, status: PaymentStatus.APPROVED },
    } as any);

    const res = await request(app)
      .post('/api/checkout/create-payment')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: ORDER_ID });

    expect(res.status).toBe(400);
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app)
      .post('/api/checkout/create-payment')
      .send({ orderId: ORDER_ID });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/checkout/webhook', () => {
  it('should handle approved payment webhook', async () => {
    prismaMock.payment.findFirst.mockResolvedValue({
      id: 'pay-1',
      orderId: 'order-1',
      mpPaymentId: null,
      mpPreferenceId: 'mp-pref-id',
      status: PaymentStatus.PENDING,
      method: null,
      amount: '194.80' as any,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    prismaMock.payment.update.mockResolvedValue({} as any);
    prismaMock.order.update.mockResolvedValue({} as any);

    const res = await request(app)
      .post('/api/checkout/webhook')
      .send({
        type: 'payment',
        data: { id: 'mp-payment-123' },
      });

    expect(res.status).toBe(200);
  });

  it('should return 200 for non-payment webhook types (ignore gracefully)', async () => {
    const res = await request(app)
      .post('/api/checkout/webhook')
      .send({
        type: 'merchant_order',
        data: { id: '123' },
      });

    expect(res.status).toBe(200);
  });
});

describe('GET /api/checkout/order-status/:orderId', () => {
  it('should return order payment status', async () => {
    prismaMock.order.findFirst.mockResolvedValue(mockOrder as any);

    const res = await request(app)
      .get('/api/checkout/order-status/order-1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('orderId');
    expect(res.body).toHaveProperty('orderStatus');
    expect(res.body).toHaveProperty('paymentStatus');
  });

  it('should return 404 for non-existent order', async () => {
    prismaMock.order.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/checkout/order-status/non-existent')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
