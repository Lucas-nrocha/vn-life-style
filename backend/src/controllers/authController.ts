import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail } from '../services/emailService';

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter ao menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
    .regex(/[0-9]/, 'Senha deve conter ao menos um número')
    .regex(/[^a-zA-Z0-9]/, 'Senha deve conter ao menos um caractere especial'),
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

function setRefreshCookie(res: Response, token: string): void {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Este email já está cadastrado' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setRefreshCookie(res, refreshToken);

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword, accessToken });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    setRefreshCookie(res, refreshToken);

    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ user: userWithoutPassword, accessToken });
  } catch (err) {
    next(err);
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      res.status(401).json({ error: 'Refresh token não encontrado' });
      return;
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored) {
      res.status(401).json({ error: 'Refresh token inválido' });
      return;
    }

    if (stored.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { token } });
      res.status(401).json({ error: 'Refresh token expirado' });
      return;
    }

    let payload: { id: string; role: string };
    try {
      payload = verifyRefreshToken(token);
    } catch {
      res.status(401).json({ error: 'Refresh token inválido' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado' });
      return;
    }

    const newRefreshToken = generateRefreshToken({ id: user.id, role: user.role });

    await prisma.$transaction([
      prisma.refreshToken.delete({ where: { token } }),
      prisma.refreshToken.create({
        data: {
          token: newRefreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    setRefreshCookie(res, newRefreshToken);

    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    res.status(200).json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Email inválido' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

    // Always return 200 to avoid user enumeration
    if (!user) {
      res.json({ message: 'Se esse email estiver cadastrado, você receberá as instruções em breve.' });
      return;
    }

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const resetLink = `${process.env.FRONTEND_URL}/redefinir-senha?token=${token}`;
    await sendPasswordResetEmail(user.email, user.name, resetLink);

    res.json({ message: 'Se esse email estiver cadastrado, você receberá as instruções em breve.' });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const schema = z.object({
      token: z.string().min(1),
      password: z
        .string()
        .min(8, 'Senha deve ter ao menos 8 caracteres')
        .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
        .regex(/[0-9]/, 'Senha deve conter ao menos um número')
        .regex(/[^a-zA-Z0-9]/, 'Senha deve conter ao menos um caractere especial'),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten().fieldErrors });
      return;
    }

    const { token, password } = parsed.data;

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      res.status(400).json({ error: 'Token inválido ou expirado' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await prisma.$transaction([
      prisma.user.update({ where: { id: resetToken.userId }, data: { password: hashedPassword } }),
      prisma.passwordResetToken.update({ where: { token }, data: { used: true } }),
      prisma.refreshToken.deleteMany({ where: { userId: resetToken.userId } }),
    ]);

    res.json({ message: 'Senha redefinida com sucesso.' });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      await prisma.refreshToken.deleteMany({ where: { token } });
    }

    res.clearCookie('refreshToken', { path: '/' });
    res.status(200).json({ message: 'Logout realizado com sucesso' });
  } catch (err) {
    next(err);
  }
}
