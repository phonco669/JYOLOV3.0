import { Request, Response } from 'express';
import { SubscriptionModel } from '../models/Subscription';

export const createSubscription = async (req: Request, res: Response) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { template_id, data, page, send_time } = req.body;
  if (!template_id || !data || !send_time) {
    return res.status(400).json({ error: 'template_id, data, send_time are required' });
  }

  try {
    const sub = await SubscriptionModel.create({
      user_id: userId,
      template_id,
      data: JSON.stringify(data),
      page,
      send_time,
      status: 'pending',
    } as any);
    res.status(201).json(sub);
  } catch (e) {
    res.status(500).json({ error: 'Database error' });
  }
};
