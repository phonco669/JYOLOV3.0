import express from 'express';
import { getReminders } from '../controllers/reminderController';

const router = express.Router();

router.get('/', getReminders);

export default router;
