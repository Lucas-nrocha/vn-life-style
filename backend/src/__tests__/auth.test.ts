import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../app';
import { prismaMock } from './setup';
import { generateRefreshToken } from '../utils/jwt';
import { Role } from '@prisma/client';

const mockUser = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  password: bcrypt.hashSync('Password123!', 10),
  name: 'Test User',
  phone: null,
  role: Role.CUSTOMER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('POST /api/auth/register', () => {
  it('should register a new user and return tokens', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(mockUser);
    prismaMock.refreshToken.create.mockResolvedValue({
      id: 'rt-1',
      token: 'refresh-token',
      userId: mockUser.id,
      expiresAt: new Date(),
      createdAt: new Date(),
    });

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.body).toHaveProperty('accessToken');
  });

  it('should return 409 if email already exists', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 400 for invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'not-an-email',
      password: 'Password123!',
    });

    expect(res.status).toBe(400);
  });

  it('should return 400 for weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test User',
      email: 'test@example.com',
      password: '123',
    });

    expect(res.status).toBe(400);
  });

  it('should return 400 when name is missing', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'test@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.refreshToken.create.mockResolvedValue({
      id: 'rt-1',
      token: 'refresh-token',
      userId: mockUser.id,
      expiresAt: new Date(),
      createdAt: new Date(),
    });

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should return 401 for wrong password', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
  });

  it('should return 401 for non-existent email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    const res = await request(app).post('/api/auth/login').send({
      email: 'notfound@example.com',
      password: 'Password123!',
    });

    expect(res.status).toBe(401);
  });

  it('should return 400 for missing fields', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'test@example.com',
    });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/refresh-token', () => {
  it('should issue new access token with valid refresh token', async () => {
    const validToken = generateRefreshToken({ id: mockUser.id, role: mockUser.role });
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      token: validToken,
      userId: mockUser.id,
      expiresAt: futureDate,
      createdAt: new Date(),
    });
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', `refreshToken=${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('should return 401 when no refresh token cookie', async () => {
    const res = await request(app).post('/api/auth/refresh-token');
    expect(res.status).toBe(401);
  });

  it('should return 401 for expired refresh token', async () => {
    const pastDate = new Date(Date.now() - 1000);
    prismaMock.refreshToken.findUnique.mockResolvedValue({
      id: 'rt-1',
      token: 'expired-token',
      userId: mockUser.id,
      expiresAt: pastDate,
      createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/auth/refresh-token')
      .set('Cookie', 'refreshToken=expired-token');

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('should clear refresh token cookie on logout', async () => {
    prismaMock.refreshToken.deleteMany.mockResolvedValue({ count: 1 });

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', 'refreshToken=some-token');

    expect(res.status).toBe(200);
    const cookies = (res.headers['set-cookie'] ?? []) as unknown as string[];
    expect(cookies.some((c: string) => c.includes('refreshToken=;'))).toBe(true);
  });
});
