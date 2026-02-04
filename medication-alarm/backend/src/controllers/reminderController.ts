import { Request, Response } from 'express';
import { MedicationModel } from '../models/Medication';
import { PlanModel } from '../models/Plan';
import { TodoModel } from '../models/Todo';
import { RecordModel } from '../models/Record';
import { FollowUpModel } from '../models/FollowUp';

const getUserId = (req: Request): number | null => {
  const userId = req.headers['x-user-id'];
  return userId ? parseInt(userId as string, 10) : null;
};

export const getReminders = async (req: Request, res: Response) => {
  console.log("DEBUG: getReminders called - UPDATED VERSION");
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const reminders: any[] = [];
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    // 1. Low Stock Reminders
    const medications = await MedicationModel.findAllByUserId(userId);
    medications.forEach(med => {
      if (med.stock <= 10) {
        reminders.push({
          id: `stock-${med.id}`,
          type: 'stock_low',
          title: `库存不足: ${med.name}`,
          detail: `仅剩 ${med.stock} ${med.unit}`,
          priority: 'medium',
          created_at: today
        });
      }
    });

    // 2. Pending Todos
    const todos = await TodoModel.findAllByUserId(userId);
    todos.forEach(todo => {
      if (todo.status === 'pending') {
        reminders.push({
          id: `todo-${todo.id}`,
          type: 'todo',
          title: todo.title,
          detail: todo.description,
          due_time: todo.due_date,
          priority: 'high',
          created_at: todo.created_at
        });
      }
    });

    // 3. Follow-ups
    const followUps = await FollowUpModel.findAllByUserId(userId);
    followUps.forEach(fu => {
      if (fu.status === 'pending' && fu.date <= today) {
        reminders.push({
          id: `followup-${fu.id}`,
          type: 'follow_up',
          title: `复诊提醒: ${fu.doctor}`,
          detail: `${fu.date} ${fu.time} @ ${fu.location}`,
          due_time: `${fu.date} ${fu.time}`,
          priority: 'high',
          created_at: fu.created_at
        });
      }
    });

    // 4. Medication Reminders (Upcoming & Missed)
    const plans = await PlanModel.findAllByUserId(userId);
    const activePlans = plans.filter(p => p.start_date <= today && (!p.end_date || p.end_date >= today));
    const records = await RecordModel.findAllByUserId(userId);
    const todayRecords = records.filter(r => r.taken_at.startsWith(today));

    activePlans.forEach(plan => {
      // Find medication name
      const med = medications.find(m => m.id === plan.medication_id);
      if (!med) return;

      const times = plan.time.split(',').filter(t => t.trim()); // "08:00,12:00"
      
      // Get records for this plan today
      const recordsForPlan = todayRecords.filter(r => r.plan_id === plan.id);
      // We assume records are chronological matching slots for now (simple logic)
      // takenCount is how many doses have been taken today
      const takenCount = recordsForPlan.length;

      times.forEach((time, index) => {
         const isTaken = index < takenCount; // Simple slot matching: 1st time matches 1st record
         
         if (time > nowTime) {
             // Future: Upcoming
             if (!isTaken) { // Only show if not already taken early (rare but possible)
                 reminders.push({
                        id: `med-upcoming-${plan.id}-${time}`,
                        type: 'medication_upcoming',
                        title: `服药提醒: ${med.name}`,
                        detail: `${med.dosage} ${med.unit}`,
                        due_time: time,
                        priority: 'high',
                        medication_color: med.color,
                        created_at: today,
                        medication_id: med.id,
                        plan_id: plan.id,
                        dosage: `${med.dosage} ${med.unit}`
                    });
                }
            } else {
                // Past: Missed?
                if (!isTaken) {
                    reminders.push({
                        id: `med-missed-${plan.id}-${time}`,
                        type: 'medication_missed',
                        title: `漏服提醒: ${med.name}`,
                        detail: `您错过了 ${time} 的服药计划`,
                        due_time: time,
                        priority: 'urgent',
                        medication_color: med.color,
                        created_at: today,
                        medication_id: med.id,
                        plan_id: plan.id,
                        dosage: `${med.dosage} ${med.unit}`
                    });
                }
            }
      });
    });

    // Sort all by due_time / created_at
    reminders.sort((a, b) => {
        const timeA = a.due_time || '23:59'; // stock reminders don't have due_time
        const timeB = b.due_time || '23:59';
        return timeA.localeCompare(timeB);
    });

    res.json(reminders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
