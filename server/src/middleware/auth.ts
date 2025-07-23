import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-jwt-secret-key';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
      };
    }
  }
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({
      status: 'error',
      message: 'Access token required',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'space-shooter-game',
      audience: 'space-shooter-users',
    }) as any;

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        status: 'error',
        message: 'Token expired',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        status: 'error',
        message: 'Invalid token',
      });
      return;
    }

    res.status(500).json({
      status: 'error',
      message: 'Token verification failed',
    });
  }
};

export const optionalAuthentication = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'space-shooter-game',
      audience: 'space-shooter-users',
    }) as any;

    req.user = {
      userId: decoded.userId,
      username: decoded.username,
    };

    next();
  } catch (error) {
    next();
  }
};

export const authorizeUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { userId } = req.params;

  if (!req.user) {
    res.status(401).json({
      status: 'error',
      message: 'Authentication required',
    });
    return;
  }

  if (req.user.userId !== userId) {
    res.status(403).json({
      status: 'error',
      message: 'Access denied: You can only access your own resources',
    });
    return;
  }

  next();
};
