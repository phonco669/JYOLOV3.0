import express from 'express';
import {
  listMedications,
  addMedication,
  getMedication,
  updateMedication,
  deleteMedication,
} from '../controllers/medicationController';

const router = express.Router();

router.get('/', listMedications);
router.post('/', addMedication);
router.get('/:id', getMedication);
router.put('/:id', updateMedication);
router.delete('/:id', deleteMedication);

export default router;
