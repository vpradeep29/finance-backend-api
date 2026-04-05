import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import prisma from '../config/db';
import { AppError } from '../utils/errors';

enum Role {
  VIEWER = 'VIEWER',
  ANALYST = 'ANALYST',
  ADMIN = 'ADMIN'
}

enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export { Role, Status };

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: Role;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new AppError(401, 'Unauthorized: No token provided'));
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    // Verify user exists and is ACTIVE
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    
    if (!user) {
      return next(new AppError(401, 'Unauthorized: User not found'));
    }

    if (user.status === Status.INACTIVE) {
      return next(new AppError(403, 'Forbidden: Account is inactive'));
    }

    req.user = { id: user.id, role: user.role as Role };
    next();
  } catch (error) {
    return next(new AppError(401, 'Unauthorized: Invalid token'));
  }
};

export const requireRole = (roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Unauthorized: Please authenticate'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Forbidden: Insufficient permissions'));
    }

    next();
  };
};