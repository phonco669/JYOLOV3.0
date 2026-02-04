import express from 'express';
import { getAdherenceStats, exportReport } from '../controllers/statisticsController';

const router = express.Router();

router.get('/adherence', getAdherenceStats);
router.get('/export', exportReport);

export default router;
