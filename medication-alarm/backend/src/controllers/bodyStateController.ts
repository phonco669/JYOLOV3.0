import { Request, Response } from 'express';
import { BodyStateModel, BodyState } from '../models/BodyState';

const getUserId = (req: Request): number | null => {
  const userId = req.headers['x-user-id'];
  return userId ? parseInt(userId as string, 10) : null;
};

export const createBodyState = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { date, symptom, weight, note } = req.body;

  if (!date) {
    return res.status(400).json({ error: 'Date is required' });
  }

  try {
    const state: BodyState = {
      user_id: userId,
      date,
      symptom: symptom || '',
      weight: weight ? parseFloat(weight) : undefined,
      note: note || ''
    };
    const newState = await BodyStateModel.create(state);
    res.status(201).json(newState);
  } catch (error) {
    console.error('Create Body State Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getBodyStates = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { start, end } = req.query;
  const startDate = (start as string) || '1970-01-01';
  const endDate = (end as string) || '2099-12-31';

  try {
    const states = await BodyStateModel.findByDateRange(userId, startDate, endDate);
    res.json(states);
  } catch (error) {
    console.error('Get Body States Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
