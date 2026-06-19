import request from 'supertest';
import { app } from '../app';
import { prismaMock } from './setup';
import { generateAccessToken } from '../utils/jwt';
import { Role } from '@prisma/client';

const CATEGORY_ID = '550e8400-e29b-41d4-a716-446655440003';

const adminUser = { id: 'admin-uuid', role: Role.ADMIN };
const customerUser = { id: 'customer-uuid', role: Role.CUSTOMER };

const adminToken = generateAccessToken(adminUser);
const customerToken = generateAccessToken(customerUser);

const mockCategory = {
  id: CATEGORY_ID,
  name: 'Camisetas',
  slug: 'camisetas',
  imageUrl: null,
  active: true,
};

const mockProduct = {
  id: 'prod-1',
  name: 'Camiseta Essencial',
  slug: 'camiseta-essencial',
  description: 'Camiseta básica de algodão',
  price: '89.90' as unknown as import('@prisma/client').Prisma.Decimal,
  comparePrice: '129.90' as unknown as import('@prisma/client').Prisma.Decimal,
  sku: 'CAM-001',
  active: true,
  featured: false,
  categoryId: CATEGORY_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
  category: mockCategory,
  images: [],
  variants: [],
};

describe('GET /api/products', () => {
  it('should return paginated product list', async () => {
    prismaMock.product.findMany.mockResolvedValue([mockProduct] as any);
    prismaMock.product.count.mockResolvedValue(1);

    const res = await request(app).get('/api/products');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('products');
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('page');
    expect(res.body).toHaveProperty('totalPages');
    expect(Array.isArray(res.body.products)).toBe(true);
  });

  it('should filter by category slug', async () => {
    prismaMock.product.findMany.mockResolvedValue([mockProduct] as any);
    prismaMock.product.count.mockResolvedValue(1);

    const res = await request(app).get('/api/products?category=camisetas');

    expect(res.status).toBe(200);
    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: expect.objectContaining({ slug: 'camisetas' }),
        }),
      })
    );
  });

  it('should filter by price range', async () => {
    prismaMock.product.findMany.mockResolvedValue([mockProduct] as any);
    prismaMock.product.count.mockResolvedValue(1);

    const res = await request(app).get('/api/products?minPrice=50&maxPrice=150');

    expect(res.status).toBe(200);
  });

  it('should search by name', async () => {
    prismaMock.product.findMany.mockResolvedValue([mockProduct] as any);
    prismaMock.product.count.mockResolvedValue(1);

    const res = await request(app).get('/api/products?search=camiseta');

    expect(res.status).toBe(200);
  });

  it('should only return active products for public', async () => {
    prismaMock.product.findMany.mockResolvedValue([mockProduct] as any);
    prismaMock.product.count.mockResolvedValue(1);

    await request(app).get('/api/products');

    expect(prismaMock.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ active: true }),
      })
    );
  });
});

describe('GET /api/products/:id', () => {
  it('should return product by id', async () => {
    prismaMock.product.findUnique.mockResolvedValue(mockProduct as any);

    const res = await request(app).get('/api/products/prod-1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'prod-1');
  });

  it('should return 404 for non-existent product', async () => {
    prismaMock.product.findUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/products/non-existent');

    expect(res.status).toBe(404);
  });
});

describe('POST /api/products (admin)', () => {
  const newProduct = {
    name: 'Nova Camiseta',
    description: 'Descrição da camiseta',
    price: 99.90,
    sku: 'CAM-002',
    categoryId: CATEGORY_ID,
    variants: [{ size: 'M', color: 'Preto', stock: 10 }],
  };

  it('should create product when admin', async () => {
    prismaMock.category.findUnique.mockResolvedValue(mockCategory);
    prismaMock.product.findUnique.mockResolvedValue(null);
    prismaMock.product.create.mockResolvedValue(mockProduct as any);

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newProduct);

    expect(res.status).toBe(201);
  });

  it('should return 403 when customer tries to create product', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${customerToken}`)
      .send(newProduct);

    expect(res.status).toBe(403);
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app).post('/api/products').send(newProduct);
    expect(res.status).toBe(401);
  });

  it('should return 400 when required fields missing', async () => {
    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Only Name' });

    expect(res.status).toBe(400);
  });
});

describe('PUT /api/products/:id (admin)', () => {
  it('should update product when admin', async () => {
    prismaMock.product.findUnique.mockResolvedValue(mockProduct as any);
    prismaMock.product.update.mockResolvedValue({ ...mockProduct, name: 'Updated' } as any);

    const res = await request(app)
      .put('/api/products/prod-1')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated' });

    expect(res.status).toBe(200);
  });

  it('should return 403 when customer tries to update', async () => {
    const res = await request(app)
      .put('/api/products/prod-1')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ name: 'Updated' });

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/products/:id (admin)', () => {
  it('should deactivate product (soft delete) when admin', async () => {
    prismaMock.product.findUnique.mockResolvedValue(mockProduct as any);
    prismaMock.product.update.mockResolvedValue({ ...mockProduct, active: false } as any);

    const res = await request(app)
      .delete('/api/products/prod-1')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});
