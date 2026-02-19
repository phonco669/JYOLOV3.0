import express from 'express';
import { getFollowUps, createFollowUp, updateFollowUp, updateFollowUpStatus } from '../controllers/followUpController';

const router = express.Router();

router.get('/', getFollowUps);
router.post('/', createFollowUp);
router.put('/:id', updateFollowUp);
router.put('/:id/status', updateFollowUpStatus);

export default router;
