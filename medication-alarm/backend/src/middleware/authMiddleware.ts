import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 移除了 declare global 块，现在依赖 src/types/express.d.ts

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'dev_jwt_secret_fallback';

  if (!process.env.JWT_SECRET) {
    console.warn('JWT_SECRET missing, using fallback for development');
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
    }

    // 将解析出的 user 附加到请求对象上
    req.user = user as { id: number };
    next();
  });
};
