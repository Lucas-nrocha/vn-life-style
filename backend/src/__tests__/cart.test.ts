import request from 'supertest';
import { app } from '../app';
import { prismaMock } from './setup';
import { generateAccessToken } from '../utils/jwt';
import { Role } from '@prisma/client';

const VARIANT_ID = '550e8400-e29b-41d4-a716-446655440001';
const OTHER_UUID  = '550e8400-e29b-41d4-a716-446655449999';

const token = generateAccessToken({ id: 'user-1', role: Role.CUSTOMER });

const mockVariant = {
  id: VARIANT_ID,
  productId: 'prod-1',
  size: 'M',
  color: 'Preto',
  stock: 10,
  sku: 'CAM-001-M-BLK',
};

const mockCartItem = {
  id: 'cart-1',
  userId: 'user-1',
  productId: 'prod-1',
  variantId: VARIANT_ID,
  quantity: 2,
  product: {
    id: 'prod-1',
    name: 'Camiseta Essencial',
    price: '89.90',
    images: [],
    active: true,
  },
  variant: mockVariant,
};

describe('GET /api/cart', () => {
  it('should return cart items for authenticated user', async () => {
    prismaMock.cartItem.findMany.mockResolvedValue([mockCartItem] as any);

    const res = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('items');
    expect(res.body).toHaveProperty('subtotal');
    expect(Array.isArray(res.body.items)).toBe(true);
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(401);
  });

  it('should return empty cart when no items', async () => {
    prismaMock.cartItem.findMany.mockResolvedValue([]);

    const res = await request(app)
      .get('/api/cart')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
    expect(res.body.subtotal).toBe(0);
  });
});

describe('POST /api/cart', () => {
  it('should add item to cart', async () => {
    prismaMock.productVariant.findUnique.mockResolvedValue(mockVariant as any);
    prismaMock.cartItem.findUnique.mockResolvedValue(null);
    prismaMock.cartItem.create.mockResolvedValue(mockCartItem as any);

    const res = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ variantId: VARIANT_ID, quantity: 2 });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('item');
  });

  it('should update quantity if item already in cart', async () => {
    prismaMock.productVariant.findUnique.mockResolvedValue(mockVariant as any);
    prismaMock.cartItem.findUnique.mockResolvedValue(mockCartItem as any);
    prismaMock.cartItem.update.mockResolvedValue({ ...mockCartItem, quantity: 3 } as any);

    const res = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ variantId: VARIANT_ID, quantity: 1 });

    expect(res.status).toBe(200);
  });

  it('should return 400 when quantity exceeds stock', async () => {
    prismaMock.productVariant.findUnique.mockResolvedValue({ ...mockVariant, stock: 1 } as any);
    prismaMock.cartItem.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ variantId: VARIANT_ID, quantity: 5 });

    expect(res.status).toBe(400);
  });

  it('should return 404 when variant not found', async () => {
    prismaMock.productVariant.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ variantId: OTHER_UUID, quantity: 1 });

    expect(res.status).toBe(404);
  });

  it('should return 400 for invalid quantity', async () => {
    const res = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ variantId: VARIANT_ID, quantity: 0 });

    expect(res.status).toBe(400);
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app)
      .post('/api/cart')
      .send({ variantId: VARIANT_ID, quantity: 1 });

    expect(res.status).toBe(401);
  });
});

describe('PUT /api/cart/:itemId', () => {
  it('should update cart item quantity', async () => {
    prismaMock.cartItem.findFirst.mockResolvedValue(mockCartItem as any);
    prismaMock.productVariant.findUnique.mockResolvedValue(mockVariant as any);
    prismaMock.cartItem.update.mockResolvedValue({ ...mockCartItem, quantity: 3 } as any);

    const res = await request(app)
      .put('/api/cart/cart-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 3 });

    expect(res.status).toBe(200);
  });

  it('should return 404 when cart item not found or not owned by user', async () => {
    prismaMock.cartItem.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/cart/non-existent')
      .set('Authorization', `Bearer ${token}`)
      .send({ quantity: 3 });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/cart/:itemId', () => {
  it('should remove item from cart', async () => {
    prismaMock.cartItem.findFirst.mockResolvedValue(mockCartItem as any);
    prismaMock.cartItem.delete.mockResolvedValue(mockCartItem as any);

    const res = await request(app)
      .delete('/api/cart/cart-1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('should return 404 when item not in cart or not owned by user', async () => {
    prismaMock.cartItem.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/cart/non-existent')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
