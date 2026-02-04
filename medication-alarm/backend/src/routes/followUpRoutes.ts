import express from 'express';
import { getFollowUps, createFollowUp, updateFollowUpStatus } from '../controllers/followUpController';

const router = express.Router();

router.get('/', getFollowUps);
router.post('/', createFollowUp);
router.put('/:id/status', updateFollowUpStatus);

export default router;
