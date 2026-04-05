import { Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { AppError } from '../utils/errors';
import { AuthRequest } from '../middlewares/authMiddleware';
import bcrypt from 'bcryptjs';

// 🔧 Helper to fix string | string[] issue
const getId = (id: string | string[]): string => {
  return Array.isArray(id) ? id[0] : id;
};

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
});

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  role: z.enum(['VIEWER', 'ANALYST', 'ADMIN']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional()
});

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const data = createUserSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError(400, 'User already exists');
    }

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: await bcrypt.hash(data.password, 10),
        role: data.role || 'VIEWER',
        status: data.status || 'ACTIVE'
      },
      select: { id: true, email: true, role: true, status: true, createdAt: true }
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, status: true, createdAt: true }
    });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = getId(req.params.id);
    const data = updateUserSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, role: true, status: true }
    });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const id = getId(req.params.id);
    
    // Check if user exists
    await prisma.user.findUniqueOrThrow({ where: { id } });

    // Optional: Also soft-delete their records or hard delete them
    // Assuming cascading is off or manual:
    await prisma.record.updateMany({
      where: { userId: id },
      data: { isDeleted: true }
    });

    await prisma.user.delete({ where: { id } });
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};
