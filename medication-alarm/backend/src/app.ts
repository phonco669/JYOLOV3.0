import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import helmet from 'helmet';
import cors from 'cors';

const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath, override: true });

import authRoutes from './routes/authRoutes';
import medicationRoutes from './routes/medicationRoutes';
import planRoutes from './routes/planRoutes';
import recordRoutes from './routes/recordRoutes';
import todoRoutes from './routes/todoRoutes';
import reminderRoutes from './routes/reminderRoutes';
import bodyStateRoutes from './routes/bodyStateRoutes';
import followUpRoutes from './routes/followUpRoutes';
import statisticsRoutes from './routes/statisticsRoutes';
import { authenticateToken } from './middleware/authMiddleware'; // 导入认证中间件
import subscriptionRoutes from './routes/subscriptionRoutes';
import { startSubscriptionDispatcher } from './services/subscriptionDispatcher';

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`);
  }
  next();
});

app.get('/', (req, res) => {
  res.send('Medication Alarm API is running');
});

app.use('/api/auth', authRoutes); // 认证路由不需要 Token

// 所有其他 API 路由都需要 Token 认证
app.use('/api/medications', authenticateToken, medicationRoutes);
app.use('/api/plans', authenticateToken, planRoutes);
app.use('/api/records', authenticateToken, recordRoutes);
app.use('/api/todos', authenticateToken, todoRoutes);
app.use('/api/reminders', authenticateToken, reminderRoutes);
app.use('/api/body-states', authenticateToken, bodyStateRoutes);
app.use('/api/followups', authenticateToken, followUpRoutes);
app.use('/api/statistics', authenticateToken, statisticsRoutes);
app.use('/api/subscriptions', authenticateToken, subscriptionRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
    }
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port} in ${process.env.NODE_ENV || 'development'} mode`);
});
startSubscriptionDispatcher();
