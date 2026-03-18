import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest, ApiResponse } from '../types';

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'bookworm-super-secret-jwt-key-change-in-production-2024';

// Extract token from request
function extractToken(req: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check cookies (HTTP-only cookie auth)
  if (req.cookies && req.cookies.auth_token) {
    return req.cookies.auth_token;
  }

  return null;
}

// Auth Middleware - Protect Routes
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

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role: string;
    };

    // Attach user to request
    (req as AuthenticatedRequest).user = {
      _id: decoded.userId as any,
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Authentication failed';
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token. Please login again.',
    } as ApiResponse);
  }
};

// Optional Auth Middleware - Attach user if present
export const optionalAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        email: string;
        role: string;
      };

      (req as AuthenticatedRequest).user = {
        _id: decoded.userId as any,
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
      };
    }
    next();
  } catch {
    // Continue without user
    next();
  }
};

export default authMiddleware;
