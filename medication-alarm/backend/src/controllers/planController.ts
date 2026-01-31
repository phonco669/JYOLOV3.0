import { Request, Response } from 'express';
import { PlanModel } from '../models/Plan';
import { RecordModel } from '../models/Record';
import { MedicationModel } from '../models/Medication';

const getUserId = (req: Request) => {
  const id = req.headers['x-user-id'];
  return id ? parseInt(id as string) : null;
};

export const listPlans = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const plans = await PlanModel.findAllByUserId(userId);
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const getDailySchedule = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const dateStr = req.query.date as string; // YYYY-MM-DD
  if (!dateStr) return res.status(400).json({ error: 'Date is required' });

  try {
    // 1. Get all active plans
    const plans = await PlanModel.findAllByUserId(userId);
    const activePlans = plans.filter(p => {
        // Simple string comparison works for ISO YYYY-MM-DD
        return p.start_date <= dateStr && (!p.end_date || p.end_date >= dateStr);
    });

    // 2. Get today's records
    const records = await RecordModel.findAllByUserId(userId);
    const todaysRecords = records.filter(r => r.taken_at.startsWith(dateStr));

    // 3. Get medications
    const medications = await MedicationModel.findAllByUserId(userId);
    const medMap = new Map(medications.map(m => [m.id, m]));

    // 4. Build schedule
    const usedRecordIds = new Set<number>();
    
    const schedule = activePlans.map(plan => {
        const med = medMap.get(plan.medication_id);
        
        // Find record for this plan
        // Only accept exact plan_id match
        let record = todaysRecords.find(r => r.plan_id === plan.id);
        
        if (record && record.id) {
            usedRecordIds.add(record.id);
        }

        return {
            plan_id: plan.id,
            medication_id: plan.medication_id,
            medication_name: med?.name || 'Unknown',
            medication_color: med?.color || '#ccc',
            medication_unit: med?.unit || '',
            dosage: med?.dosage || '', 
            time: plan.time,
            status: record ? 'taken' : 'pending',
            record_id: record?.id
        };
    });

    // Sort by time
    schedule.sort((a, b) => a.time.localeCompare(b.time));

    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createPlan = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { medication_id, time, frequency, start_date, end_date } = req.body;

  try {
    const newPlan = await PlanModel.create({
      user_id: userId,
      medication_id,
      time,
      frequency,
      start_date,
      end_date
    });
    res.status(201).json(newPlan);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const getMonthlyStatus = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const startStr = req.query.start as string;
  const endStr = req.query.end as string;
  if (!startStr || !endStr) return res.status(400).json({ error: 'Start and end dates required' });

  try {
    const plans = await PlanModel.findAllByUserId(userId);
    const records = await RecordModel.findAllByUserId(userId);

    const result: Record<string, string> = {};
    let curr = new Date(startStr);
    const end = new Date(endStr);

    // Prevent infinite loop if dates are messed up
    let loopCount = 0;
    while (curr <= end && loopCount < 100) {
      const dateStr = curr.toISOString().split('T')[0];
      
      // Active plans for this date
      const activePlans = plans.filter(p => 
        p.start_date <= dateStr && (!p.end_date || p.end_date >= dateStr)
      );

      if (activePlans.length === 0) {
        result[dateStr] = 'none';
      } else {
        // Records for this date
        const daysRecords = records.filter(r => r.taken_at.startsWith(dateStr));
        
        // Count taken
        let takenCount = 0;
        activePlans.forEach(plan => {
           const isTaken = daysRecords.some(r => 
             r.plan_id === plan.id
           );
           if (isTaken) takenCount++;
        });

        if (takenCount === 0) {
            // Check if date is in past; if so, 'missed', else 'pending'
            const today = new Date().toISOString().split('T')[0];
            result[dateStr] = dateStr < today ? 'missed' : 'pending';
        } else if (takenCount === activePlans.length) {
            result[dateStr] = 'completed';
        } else {
            result[dateStr] = 'partial';
        }
      }

      curr.setDate(curr.getDate() + 1);
      loopCount++;
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
