import express from 'express';
import { listPlans, createPlan, getDailySchedule, getMonthlyStatus } from '../controllers/planController';

const router = express.Router();

router.get('/', listPlans);
router.get('/schedule', getDailySchedule);
router.get('/monthly', getMonthlyStatus);
router.post('/', createPlan);

export default router;
