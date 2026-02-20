import { Request, Response } from 'express';
import { FollowUpModel, FollowUp } from '../models/FollowUp';

export const getFollowUps = async (req: Request, res: Response) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const followUps = await FollowUpModel.findAllByUserId(userId);
    res.json(followUps);
  } catch (error) {
    console.error('[Get FollowUps Error]:', error);
    res.status(500).json({ error: 'Failed to load follow-up reminders' });
  }
};

export const createFollowUp = async (req: Request, res: Response) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { doctor, location, date, time, note } = req.body;
  if (!doctor || !date || !time) {
    return res.status(400).json({ error: 'Doctor, date and time are required' });
  }

  try {
    const followUp: FollowUp = {
      user_id: userId,
      doctor,
      location: location || '',
      date,
      time,
      note: note || '',
      status: 'pending',
    };
    const newFollowUp = await FollowUpModel.create(followUp);
    res.status(201).json(newFollowUp);
  } catch (error) {
    console.error('[Create FollowUp Error]:', error);
    res.status(500).json({ error: 'Failed to save follow-up reminder', details: (error as Error).message });
  }
};

export const updateFollowUp = async (req: Request, res: Response) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.params;
  const { doctor, location, date, time, note } = req.body;

  try {
    await FollowUpModel.update(Number(id), {
      doctor,
      location,
      date,
      time,
      note,
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateFollowUpStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    await FollowUpModel.updateStatus(Number(id), status);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
