import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth';

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^a-zA-Z0-9]/)
    .optional(),
});

const addressSchema = z.object({
  label: z.string().default('Casa'),
  street: z.string().min(2),
  number: z.string().min(1),
  complement: z.string().optional(),
  neighborhood: z.string().min(2),
  city: z.string().min(2),
  state: z.string().length(2),
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  isDefault: z.boolean().optional(),
});

export async function getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });

    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado' });
      return;
    }

    res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { name, phone, currentPassword, newPassword } = parsed.data;
    const userId = req.user!.id;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;

    if (currentPassword || newPassword) {
      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Forneça a senha atual e a nova senha' });
        return;
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        res.status(404).json({ error: 'Usuário não encontrado' });
        return;
      }

      const passwordMatch = await bcrypt.compare(currentPassword, user.password);
      if (!passwordMatch) {
        res.status(400).json({ error: 'Senha atual incorreta' });
        return;
      }

      updateData.password = await bcrypt.hash(newPassword, 12);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function listAddresses(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.id },
      orderBy: [{ isDefault: 'desc' }, { id: 'desc' }],
    });
    res.json(addresses);
  } catch (err) {
    next(err);
  }
}

export async function createAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = addressSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const userId = req.user!.id;
    const count = await prisma.address.count({ where: { userId } });
    const isDefault = count === 0 ? true : (parsed.data.isDefault ?? false);

    if (isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const address = await prisma.address.create({
      data: { ...parsed.data, userId, isDefault },
    });

    res.status(201).json(address);
  } catch (err) {
    next(err);
  }
}

export async function updateAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Endereço não encontrado' });
      return;
    }

    const parsed = addressSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    if (parsed.data.isDefault) {
      await prisma.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }

    const updated = await prisma.address.update({
      where: { id: req.params.id },
      data: parsed.data,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function deleteAddress(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Endereço não encontrado' });
      return;
    }

    await prisma.address.delete({ where: { id: req.params.id } });
    res.json({ message: 'Endereço removido com sucesso' });
  } catch (err) {
    next(err);
  }
}
