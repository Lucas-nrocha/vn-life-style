import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../app';
import { prismaMock } from './setup';
import { generateAccessToken } from '../utils/jwt';
import { Role } from '@prisma/client';

const token = generateAccessToken({ id: 'user-1', role: Role.CUSTOMER });

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  password: bcrypt.hashSync('OldPassword123!', 10),
  name: 'Test User',
  phone: null,
  role: Role.CUSTOMER,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAddress = {
  id: 'addr-1',
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

describe('GET /api/user/profile', () => {
  it('should return user profile without password', async () => {
    const { password: _pw, updatedAt: _up, ...profileUser } = mockUser;
    prismaMock.user.findUnique.mockResolvedValue(profileUser as any);

    const res = await request(app)
      .get('/api/user/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', 'user-1');
    expect(res.body).not.toHaveProperty('password');
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app).get('/api/user/profile');
    expect(res.status).toBe(401);
  });
});

describe('PUT /api/user/profile', () => {
  it('should update user name and phone', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    const { password: _pw, updatedAt: _up, ...safeUser } = mockUser;
    prismaMock.user.update.mockResolvedValue({
      ...safeUser,
      name: 'Updated Name',
      phone: '11999999999',
    } as any);

    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name', phone: '11999999999' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'Updated Name');
    expect(res.body).not.toHaveProperty('password');
  });

  it('should update password with correct current password', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockUser);
    prismaMock.user.update.mockResolvedValue(mockUser);

    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'OldPassword123!',
        newPassword: 'NewPassword456!',
      });

    expect(res.status).toBe(200);
  });

  it('should return 400 when current password is wrong', async () => {
    prismaMock.user.findUnique.mockResolvedValue(mockUser);

    const res = await request(app)
      .put('/api/user/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'WrongPassword!',
        newPassword: 'NewPassword456!',
      });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/user/addresses', () => {
  it('should return user addresses', async () => {
    prismaMock.address.findMany.mockResolvedValue([mockAddress]);

    const res = await request(app)
      .get('/api/user/addresses')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('id', 'addr-1');
  });

  it('should return 401 without authentication', async () => {
    const res = await request(app).get('/api/user/addresses');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/user/addresses', () => {
  const newAddress = {
    label: 'Trabalho',
    street: 'Av. Paulista',
    number: '1000',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-100',
  };

  it('should create new address', async () => {
    prismaMock.address.count.mockResolvedValue(0);
    prismaMock.address.create.mockResolvedValue({ ...mockAddress, ...newAddress, id: 'addr-2' });

    const res = await request(app)
      .post('/api/user/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(newAddress);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/user/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send({ street: 'Av. Paulista' });

    expect(res.status).toBe(400);
  });

  it('should set first address as default automatically', async () => {
    prismaMock.address.count.mockResolvedValue(0);
    prismaMock.address.create.mockResolvedValue({ ...mockAddress, isDefault: true });

    const res = await request(app)
      .post('/api/user/addresses')
      .set('Authorization', `Bearer ${token}`)
      .send(newAddress);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('isDefault', true);
  });
});

describe('PUT /api/user/addresses/:id', () => {
  it('should update address', async () => {
    prismaMock.address.findFirst.mockResolvedValue(mockAddress);
    prismaMock.address.update.mockResolvedValue({ ...mockAddress, label: 'Casa Nova' });

    const res = await request(app)
      .put('/api/user/addresses/addr-1')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'Casa Nova' });

    expect(res.status).toBe(200);
  });

  it('should return 404 when address not found or not owned', async () => {
    prismaMock.address.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/user/addresses/non-existent')
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'Test' });

    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/user/addresses/:id', () => {
  it('should delete address', async () => {
    prismaMock.address.findFirst.mockResolvedValue(mockAddress);
    prismaMock.address.delete.mockResolvedValue(mockAddress);

    const res = await request(app)
      .delete('/api/user/addresses/addr-1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('should return 404 when address not found or not owned', async () => {
    prismaMock.address.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .delete('/api/user/addresses/non-existent')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
