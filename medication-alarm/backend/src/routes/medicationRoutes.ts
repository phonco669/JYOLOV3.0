import express from 'express';
import { listMedications, addMedication } from '../controllers/medicationController';

const router = express.Router();

router.get('/', listMedications);
router.post('/', addMedication);

export default router;
