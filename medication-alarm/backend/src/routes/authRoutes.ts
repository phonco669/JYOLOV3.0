import express from 'express';
import { login, updateUserInfo } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/login', login);
router.put('/update', authenticateToken, updateUserInfo);

export default router;
