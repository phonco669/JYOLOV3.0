import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(__dirname, '../.env');
try {
  const content = fs.readFileSync(envPath, 'utf8');
  console.log('ENV path:', envPath, 'size:', content.length);
} catch (e) {
  console.warn('ENV read failed');
}
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

if (!process.env.JWT_SECRET) {
  console.warn('JWT_SECRET missing at startup');
} else {
  console.log('JWT_SECRET loaded', process.env.JWT_SECRET?.length);
}

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

app.get('/', (req, res) => {
  res.send('Hello World!');
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

app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
startSubscriptionDispatcher();
