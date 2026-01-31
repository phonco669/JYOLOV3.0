import express from 'express';
import { listRecords, createRecord, deleteRecord } from '../controllers/recordController';

const router = express.Router();

router.get('/', listRecords);
router.post('/', createRecord);
router.delete('/:id', deleteRecord);

export default router;
