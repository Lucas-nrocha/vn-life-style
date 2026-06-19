import request from 'supertest';
import { app } from '../app';
import { prismaMock } from './setup';
import { generateAccessToken } from '../utils/jwt';
import { Role, OrderStatus, PaymentStatus } from '@prisma/client';

const ADDRESS_ID = '550e8400-e29b-41d4-a716-446655440004';
const OTHER_UUID  = '550e8400-e29b-41d4-a716-446655449999';

const customerToken = generateAccessToken({ id: 'user-1', role: Role.CUSTOMER });
const adminToken = generateAccessToken({ id: 'admin-1', role: Role.ADMIN });

const mockAddress = {
  id: ADDRESS_ID,
  userId: 'user-1',
  label: 'Casa',
  street: 'Rua das Flores',
  number: '100',
  complement: null,
  neighborhood: 'Centro',
  city: 'São Paulo',
  state: 'SP',
  zipCode: '01310-100',
  isDefault: true,
};

const mockOrderItem = {
  id: 'oi-1',
  orderId: 'order-1',
  productId: 'prod-1',
  variantId: 'var-1',
  quantity: 2,
  unitPrice: '89.90' as any,
  totalPrice: '179.80' as any,
  product: { name: 'Camiseta Essencial', images: [] },
  variant: { size: 'M', color: 'Preto' },
};

const mockOrder = {
  id: 'order-1',
  userId: 'user-1',
  addressId: 'addr-1',
  status: OrderStatus.PENDING,
  subtotal: '179.80' as any,
  shippingCost: '15.00' as any,
  discount: '0' as any,
  total: '194.80' as any,
  couponCode: null,
  notes: null,
  trackingCode: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  address: mockAddress,
  items: [mockOrderItem],
  payment: null,
};

describe('POST /api/orders', () => {
  const cartItems = [
    { variantId: 'var-1', quantity: 2 },
  ];

  it('should create order from cart items', async () => {
    prismaMock.address.findFirst.mockResolvedValue(mockAddress as any);
    prismaMock.cartItem.findMany.mockResolvedValue([
      {
        id: 'ci-1',
        userId: 'user-1',
        productId: 'prod-1',
        variantId: 'var-1',
        quantity: 2,
        variant: { id: 'var-1', stock: 10, sku: 'CAM-001-M', price: null, product: { price: '89.90', active: true } },
        product: { price: '89.90', active: true },
      },
    ] as any);
    prismaMock.order.create.mockResolvedValue(mockOrder as any);
    prismaMock.cartItem.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.payment.create.mockResolvedValue({
      id: 'pay-1',
      orderId: 'order-1',
      mpPaymentId: null,
      mpPreferenceId: null,
      status: PaymentStatus.PENDING,
      method: null,
      amount: '194.80' as any,
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ addressId: ADDRESS_ID });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('order');
    expect(res.body.order).toHaveProperty('id');
  });

  it('should return 400 when cart is empty', async () => {
    prismaMock.address.findFirst.mockResolvedValue(mockAddress as any);
    prismaMock.cartItem.findMany.mockResolvedValue([]);

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ addressId: ADDRESS_ID });

    expect(res.status).toBe(400);
  });

  it('should return 404 when address not found', async () => {
    prismaMock.address.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ addressId: OTHER_UUID });

    expect(res.status).toBe(404);
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ addressId: ADDRESS_ID });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/orders', () => {
  it('should return authenticated user orders', async () => {
    prismaMock.order.findMany.mockResolvedValue([mockOrder] as any);
    prismaMock.order.count.mockResolvedValue(1);

    const res = await request(app)
      .get('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('orders');
    expect(Array.isArray(res.body.orders)).toBe(true);
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/orders/:id', () => {
  it('should return order detail for owner', async () => {
    prismaMock.order.findFirst.mockResolvedValue(mockOrder as any);

    const res = await request(app)
      .get('/api/orders/order-1')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'order-1');
  });

  it('should return 404 when order not found or not owned', async () => {
    prismaMock.order.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/orders/non-existent')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/orders/:id/status (admin)', () => {
  it('should update order status when admin', async () => {
    prismaMock.order.findUnique.mockResolvedValue(mockOrder as any);
    prismaMock.order.update.mockResolvedValue({
      ...mockOrder,
      status: OrderStatus.CONFIRMED,
    } as any);

    const res = await request(app)
      .put('/api/orders/order-1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(200);
  });

  it('should return 403 when customer tries to update status', async () => {
    const res = await request(app)
      .put('/api/orders/order-1/status')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ status: 'CONFIRMED' });

    expect(res.status).toBe(403);
  });

  it('should return 400 for invalid status', async () => {
    prismaMock.order.findUnique.mockResolvedValue(mockOrder as any);

    const res = await request(app)
      .put('/api/orders/order-1/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'INVALID_STATUS' });

    expect(res.status).toBe(400);
  });
});
