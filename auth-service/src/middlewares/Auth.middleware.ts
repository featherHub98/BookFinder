import type { Request, Response, NextFunction } from 'express';
import AuthService from '../services/Auth.service';
import type { AuthenticatedRequest, ApiResponse, UserWithoutPassword } from '../types';

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  if (req.cookies && req.cookies.auth_token) {
    return req.cookies.auth_token;
  }

  return null;
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.',
      } as ApiResponse);
      return;
    }

    const user = await AuthService.verifyToken(token);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.',
      } as ApiResponse);
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Account has been deactivated.',
      } as ApiResponse);
      return;
    }

    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    res.status(401).json({
      success: false,
      message,
    } as ApiResponse);
  }
};

export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      const user = await AuthService.verifyToken(token);
      if (user && user.isActive) {
        (req as AuthenticatedRequest).user = user;
      }
    }
    next();
  } catch {
    next();
  }
};

export function requireRole(...allowedRoles: string[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required.',
      } as ApiResponse);
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions.',
      } as ApiResponse);
      return;
    }

    next();
  };
}

export const adminOnlyMiddleware = requireRole('admin');

export function isAuthenticated(req: Request): req is AuthenticatedRequest & { user: UserWithoutPassword } {
  return !!(req as AuthenticatedRequest).user;
}

export default authMiddleware;
