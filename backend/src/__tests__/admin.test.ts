import request from 'supertest';
import { app } from '../app';
import { prismaMock } from './setup';
import { generateAccessToken } from '../utils/jwt';
import { Role, OrderStatus, PaymentStatus } from '@prisma/client';

const adminToken = generateAccessToken({ id: 'admin-1', role: Role.ADMIN });
const customerToken = generateAccessToken({ id: 'user-1', role: Role.CUSTOMER });

const mockProduct = {
  id: 'prod-1',
  name: 'Camiseta Essencial',
  slug: 'camiseta-essencial',
  description: 'Descrição',
  price: '89.90' as any,
  comparePrice: null,
  sku: 'CAM-001',
  active: true,
  featured: false,
  categoryId: 'cat-1',
  createdAt: new Date(),
  updatedAt: new Date(),
  category: { id: 'cat-1', name: 'Camisetas', slug: 'camisetas', imageUrl: null, active: true },
  images: [],
  variants: [],
};

describe('GET /api/admin/dashboard', () => {
  it('should return dashboard stats for admin', async () => {
    prismaMock.order.count.mockResolvedValue(15);
    prismaMock.order.aggregate.mockResolvedValue({ _sum: { total: '1500.00' as any } } as any);
    prismaMock.user.count.mockResolvedValue(50);
    prismaMock.product.count.mockResolvedValue(25);

    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('totalOrders');
    expect(res.body).toHaveProperty('totalRevenue');
    expect(res.body).toHaveProperty('totalUsers');
    expect(res.body).toHaveProperty('totalProducts');
  });

  it('should return 403 for non-admin user', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app).get('/api/admin/dashboard');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/admin/orders', () => {
  it('should return all orders for admin', async () => {
    prismaMock.order.findMany.mockResolvedValue([]);
    prismaMock.order.count.mockResolvedValue(0);

    const res = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('orders');
  });

  it('should filter orders by status', async () => {
    prismaMock.order.findMany.mockResolvedValue([]);
    prismaMock.order.count.mockResolvedValue(0);

    const res = await request(app)
      .get('/api/admin/orders?status=PENDING')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(prismaMock.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: OrderStatus.PENDING }),
      })
    );
  });

  it('should return 403 for non-admin', async () => {
    const res = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/admin/products', () => {
  it('should return all products including inactive for admin', async () => {
    prismaMock.product.findMany.mockResolvedValue([mockProduct] as any);
    prismaMock.product.count.mockResolvedValue(1);

    const res = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('products');
  });

  it('should return 403 for non-admin', async () => {
    const res = await request(app)
      .get('/api/admin/products')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
  });
});

describe('GET /api/admin/users', () => {
  it('should return users list for admin', async () => {
    prismaMock.user.findMany.mockResolvedValue([]);
    prismaMock.user.count.mockResolvedValue(0);

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
  });

  it('should not expose user passwords', async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { id: 'u1', email: 'test@test.com', name: 'Test', role: Role.CUSTOMER, phone: null, createdAt: new Date() },
    ] as any);
    prismaMock.user.count.mockResolvedValue(1);

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    res.body.users.forEach((user: any) => {
      expect(user).not.toHaveProperty('password');
    });
  });
});

describe('POST /api/admin/categories', () => {
  it('should create category when admin', async () => {
    prismaMock.category.findUnique.mockResolvedValue(null);
    prismaMock.category.create.mockResolvedValue({
      id: 'cat-2',
      name: 'Calças',
      slug: 'calcas',
      imageUrl: null,
      active: true,
    });

    const res = await request(app)
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Calças' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('slug', 'calcas');
  });

  it('should return 409 when category name already exists', async () => {
    prismaMock.category.findUnique.mockResolvedValue({
      id: 'cat-1',
      name: 'Camisetas',
      slug: 'camisetas',
      imageUrl: null,
      active: true,
    });

    const res = await request(app)
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Camisetas' });

    expect(res.status).toBe(409);
  });
});

describe('PUT /api/admin/orders/:id/tracking', () => {
  it('should add tracking code to shipped order', async () => {
    prismaMock.order.findUnique.mockResolvedValue({
      id: 'order-1',
      status: OrderStatus.SHIPPED,
    } as any);
    prismaMock.order.update.mockResolvedValue({} as any);

    const res = await request(app)
      .put('/api/admin/orders/order-1/tracking')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ trackingCode: 'BR123456789BR' });

    expect(res.status).toBe(200);
  });

  it('should return 403 for non-admin', async () => {
    const res = await request(app)
      .put('/api/admin/orders/order-1/tracking')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ trackingCode: 'BR123456789BR' });

    expect(res.status).toBe(403);
  });
});
