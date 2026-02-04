import express from 'express';
import { createBodyState, getBodyStates } from '../controllers/bodyStateController';

const router = express.Router();

router.post('/', createBodyState);
router.get('/', getBodyStates);

export default router;
