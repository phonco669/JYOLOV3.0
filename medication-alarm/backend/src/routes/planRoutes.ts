import express from 'express';
import { createPlan, listPlans, getDailySchedule, getMonthlyStatus, getPlansByMedication, updatePlan } from '../controllers/planController';

const router = express.Router();

router.post('/', createPlan);
router.get('/', listPlans);
router.put('/:id', updatePlan);
router.get('/daily', getDailySchedule);
router.get('/monthly', getMonthlyStatus);
router.get('/medication/:medId', getPlansByMedication);

export default router;
