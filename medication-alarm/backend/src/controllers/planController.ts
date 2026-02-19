import { Request, Response } from 'express';
import { PlanModel } from '../models/Plan';
import { RecordModel } from '../models/Record';
import { MedicationModel } from '../models/Medication';

// const getUserId = (req: Request) => {
//   const id = req.headers['x-user-id'];
//   return id ? parseInt(id as string) : null;
// };

// Helper to convert UTC ISO string to User's Local Date String (Assuming UTC+8 for now)
const toUserDateStr = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    // Add 8 hours for CST
    const localTime = date.getTime() + 8 * 60 * 60 * 1000;
    return new Date(localTime).toISOString().split('T')[0];
  } catch (e) {
    return isoString.split(' ')[0]; // Fallback for non-ISO strings
  }
};

interface ScheduleItem {
  plan_id?: number;
  medication_id: number;
  medication_name: string;
  medication_color: string;
  medication_unit: string;
  dosage: string;
  time: string;
  status: 'taken' | 'pending';
  record_id?: number;
  is_orphan?: boolean;
}

export const listPlans = async (req: Request, res: Response) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const plans = await PlanModel.findAllByUserId(userId);
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const getDailySchedule = async (req: Request, res: Response) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const dateStr = req.query.date as string; // YYYY-MM-DD
  if (!dateStr) return res.status(400).json({ error: 'Date is required' });

  try {
    // 1. Get all active plans
    const plans = await PlanModel.findAllByUserId(userId);
    const activePlans = plans.filter((p) => {
      // Normalize dates to ensure string comparison works
      const pStart = p.start_date.trim();
      const pEnd = p.end_date ? p.end_date.trim() : null;
      const target = dateStr.trim();

      return pStart <= target && (!pEnd || pEnd >= target);
    });

    console.log(`DEBUG: getDailySchedule date=${dateStr} found ${activePlans.length} plans`);

    // 2. Get today's records
    const records = await RecordModel.findAllByUserId(userId);
    // Filter using timezone conversion
    const todaysRecords = records.filter((r) => toUserDateStr(r.taken_at) === dateStr);
    const matchedRecordIds = new Set<number>();

    // 3. Get medications
    const medications = await MedicationModel.findAllByUserId(userId);
    const medMap = new Map(medications.map((m) => [m.id, m]));

    // 4. Build schedule
    const schedule: ScheduleItem[] = [];

    activePlans.forEach((plan) => {
      const med = medMap.get(plan.medication_id);

      // Even if med is missing (deleted), we might have records?
      // But for *future* or *pending* items, we need the med details.
      // If med is deleted, we skip *planning* it, but we should check if there's a record.

      const planTimes = plan.time.split(',').filter((t) => t.trim());

      // Get records for this plan, sorted by taken_at
      const planRecords = todaysRecords
        .filter((r) => r.plan_id === plan.id)
        .sort((a, b) => a.taken_at.localeCompare(b.taken_at));

      // Create a schedule item for each time slot
      planTimes.forEach((timeStr, index) => {
        const record = planRecords[index];
        if (record) matchedRecordIds.add(record.id!);

        // Use snapshot name if available in record, otherwise current med name
        const medName = record?.medication_name || med?.name || 'Unknown Medication';
        const medUnit = record?.medication_unit || med?.unit || '';
        const medColor = record?.medication_color || med?.color || '#ccc';

        let dosage = med?.dosage || '';

        // Ensure dosage is a string before checking includes
        if (typeof dosage !== 'string') {
          dosage = String(dosage);
        }

        // Handle alternating dosage if no record exists yet (for planning)
        if (!record && dosage.includes(',')) {
          try {
            const dosages = dosage.split(',').map((d) => d.trim());
            const startDate = new Date(plan.start_date);
            const targetDate = new Date(dateStr);
            const diffTime = targetDate.getTime() - startDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays >= 0) {
              const index = diffDays % dosages.length;
              dosage = dosages[index];
            }
          } catch (e) {
            console.error('Error calculating alternating dosage', e);
          }
        } else if (record) {
          // If record exists, use the actual taken dosage
          // Note: record.dosage_taken is usually a number, so we might convert to string
          dosage = record.dosage_taken ? String(record.dosage_taken) : dosage;
        }

        // If both record and med are missing, we can't show much.
        if (!record && !med) return;

        schedule.push({
          plan_id: plan.id,
          medication_id: plan.medication_id,
          medication_name: medName,
          medication_color: medColor,
          medication_unit: medUnit,
          dosage: dosage,
          time: timeStr,
          status: record ? 'taken' : 'pending',
          record_id: record?.id,
        });
      });
    });

    // 5. Add Orphan Records (Taken but not matched to current plan)
    todaysRecords.forEach((record) => {
      if (!matchedRecordIds.has(record.id!)) {
        // Try to find med info if snapshot missing
        const med = medMap.get(record.medication_id);
        const medName = record.medication_name || med?.name || 'Unknown Medication';
        const medColor = record.medication_color || med?.color || '#ccc';
        const medUnit = record.medication_unit || med?.unit || '';

        schedule.push({
          plan_id: record.plan_id,
          medication_id: record.medication_id,
          medication_name: medName,
          medication_color: medColor,
          medication_unit: medUnit,
          dosage: String(record.dosage_taken), // Use actual taken dosage
          time: record.taken_at.split(' ')[1] || '00:00', // Extract time from taken_at (approx)
          status: 'taken',
          record_id: record.id,
          is_orphan: true, // Flag for UI if needed
        });
      }
    });

    // Sort by time
    schedule.sort((a, b) => a.time.localeCompare(b.time));

    res.json(schedule);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getMonthlyStatus = async (req: Request, res: Response) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { start, end } = req.query;
  if (!start || !end) return res.status(400).json({ error: 'Start and end dates required' });

  try {
    const plans = await PlanModel.findAllByUserId(userId);
    const records = await RecordModel.findAllByUserId(userId);

    const startDateStr = start as string;
    const endDateStr = end as string;

    // Filter records in range (using User Date)
    const rangeRecords = records.filter((r) => {
      const date = toUserDateStr(r.taken_at);
      return date >= startDateStr && date <= endDateStr;
    });

    const statusMap: Record<string, string> = {};
    const curr = new Date(startDateStr);
    const last = new Date(endDateStr);
    const refDateStr = toUserDateStr(new Date().toISOString()); // Current User Date

    while (curr <= last) {
      const dateStr = curr.toISOString().split('T')[0];

      let dailyExpected = 0;

      // Calculate expected
      plans.forEach((plan) => {
        if (plan.start_date <= dateStr && (!plan.end_date || plan.end_date >= dateStr)) {
          const times = plan.time.split(',').filter((t) => t.trim() !== '');
          let isDue = true;

          if (plan.frequency === 'weekly') {
            const startDay = new Date(plan.start_date).getDay();
            const currentDay = new Date(dateStr).getDay();
            if (startDay !== currentDay) isDue = false;
          } else if (plan.frequency === 'every_other_day') {
            const start = new Date(plan.start_date).getTime();
            const current = new Date(dateStr).getTime();
            const diffDays = Math.floor((current - start) / (1000 * 3600 * 24));
            if (diffDays % 2 !== 0) isDue = false;
          }

          if (isDue) {
            dailyExpected += times.length;
          }
        }
      });

      const dailyTaken = rangeRecords.filter(
        (r) => toUserDateStr(r.taken_at) === dateStr && r.status === 'taken',
      ).length;

      if (dailyExpected === 0) {
        if (dailyTaken > 0) {
          statusMap[dateStr] = 'all_taken'; // Extra credit!
        } else {
          statusMap[dateStr] = 'none';
        }
      } else {
        if (dailyTaken >= dailyExpected) {
          statusMap[dateStr] = 'all_taken';
        } else if (dailyTaken === 0) {
          // Check if date is in past relative to refDate
          if (dateStr < refDateStr) {
            statusMap[dateStr] = 'missed';
          } else {
            // Future or Today
            statusMap[dateStr] = 'pending';
          }
        } else {
          statusMap[dateStr] = 'partial';
        }
      }

      curr.setDate(curr.getDate() + 1);
    }

    res.json(statusMap);
  } catch (error) {
    console.error('Monthly status error', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const createPlan = async (req: Request, res: Response) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { medication_id, time, frequency, start_date, end_date } = req.body;

  try {
    const newPlan = await PlanModel.create({
      user_id: userId,
      medication_id,
      time,
      frequency,
      start_date,
      end_date,
    });
    res.status(201).json(newPlan);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const updatePlan = async (req: Request, res: Response) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const planId = parseInt(req.params.id as string);
  const { time, frequency, start_date, end_date } = req.body;

  try {
    const plan = await PlanModel.findById(planId);
    if (!plan) return res.status(404).json({ error: 'Not found' });
    if (plan.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

    await PlanModel.update(planId, { time, frequency, start_date, end_date });
    res.json({ message: 'Updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const getPlansByMedication = async (req: Request, res: Response) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const medId = parseInt(req.params.medId as string);

  try {
    const plans = await PlanModel.findByMedicationId(medId);
    // Security check: Ensure plans belong to user (PlanModel doesn't filter by user in findByMedicationId, so we check first one or all)
    // Actually, PlanModel table has user_id. We should check it.
    const userPlans = plans.filter((p) => p.user_id === userId);

    res.json(userPlans);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};
