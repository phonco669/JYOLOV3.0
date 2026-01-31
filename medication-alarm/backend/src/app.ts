import express from 'express';
import authRoutes from './routes/authRoutes';
import medicationRoutes from './routes/medicationRoutes';
import planRoutes from './routes/planRoutes';
import recordRoutes from './routes/recordRoutes';
import todoRoutes from './routes/todoRoutes';
import reminderRoutes from './routes/reminderRoutes';

const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use('/api/auth', authRoutes);
app.use('/api/medications', medicationRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/reminders', reminderRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
