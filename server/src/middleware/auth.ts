import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

export interface AuthPayload {
  userId: string;
  workspaceId: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Admin access required' });
    return;
  }
  next();
}

export function signToken(userId: Types.ObjectId, workspaceId: Types.ObjectId, role: string): string {
  return jwt.sign(
    { userId: userId.toString(), workspaceId: workspaceId.toString(), role },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
}
