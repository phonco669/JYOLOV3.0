import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

import authRoutes from './routes/authRoutes';
import medicationRoutes from './routes/medicationRoutes';
import planRoutes from './routes/planRoutes';
import recordRoutes from './routes/recordRoutes';
import todoRoutes from './routes/todoRoutes';
import reminderRoutes from './routes/reminderRoutes';
import bodyStateRoutes from './routes/bodyStateRoutes';
import followUpRoutes from './routes/followUpRoutes';
import statisticsRoutes from './routes/statisticsRoutes';

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/auth', authRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/body-states', bodyStateRoutes);
app.use('/api/followups', followUpRoutes);
app.use('/api/statistics', statisticsRoutes);



app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${port}`);
});
