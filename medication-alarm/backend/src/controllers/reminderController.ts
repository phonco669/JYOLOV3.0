import { Request, Response } from 'express';
import { MedicationModel } from '../models/Medication';
import { PlanModel } from '../models/Plan';
import { TodoModel } from '../models/Todo';
import { RecordModel } from '../models/Record';

const getUserId = (req: Request): number | null => {
  const userId = req.headers['x-user-id'];
  return userId ? parseInt(userId as string, 10) : null;
};

export const getReminders = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const reminders: any[] = [];
    const today = new Date().toISOString().split('T')[0];

    // 1. Low Stock Reminders
    const medications = await MedicationModel.findAllByUserId(userId);
    medications.forEach(med => {
      // Simple threshold for now
      if (med.stock <= 10) {
        reminders.push({
          id: `stock-${med.id}`,
          type: 'stock_low',
          title: `Low Stock: ${med.name}`,
          detail: `Only ${med.stock} ${med.unit} left.`,
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
          priority: 'high', // Assume user todos are high priority
          created_at: todo.created_at
        });
      }
    });

    // 3. Upcoming Plans (Today) - Check if not taken
    // This overlaps with "Daily Schedule", but reminders view might show "Missed" or "Due Soon" specifically.
    // For simplicity, let's skip duplicating daily schedule here unless it's "Overdue".
    // Or we can just include "Today's Medication Plan" as a summary.
    
    // Let's list missed medications from yesterday?
    // Or just leave medication reminders to the main dashboard and use this for "alerts".
    
    // Let's add "Overdue" medications from today (if current time > scheduled time).
    const plans = await PlanModel.findAllByUserId(userId);
    const activePlans = plans.filter(p => p.start_date <= today && (!p.end_date || p.end_date >= today));
    
    // We need to check if they are taken.
    const records = await RecordModel.findAllByUserId(userId);
    const todayRecords = records.filter(r => r.taken_at.startsWith(today));
    
    const nowTime = new Date().toTimeString().split(' ')[0].substring(0, 5); // HH:MM

    activePlans.forEach(plan => {
        const times = plan.time.split(','); // "08:00,12:00"
        times.forEach((time: string) => {
            // Check if there is a record for this plan/medication at this time (roughly)
            // Ideally record should link to specific time slot. 
            // Current Record model doesn't store "scheduled_time", just "taken_at".
            // We can approximate or just check count.
            
            // Simplified: If plan has 2 times, and 1 record, we don't know which one is taken.
            // But we can check if current time > time and count of records < index of time?
            // Too complex for now.
            
            // Let's just alert if NO records for today and time > nowTime (actually if time < nowTime and NOT taken)
            if (time < nowTime) {
                // It's past due. Check if taken.
                // We don't have exact matching. 
                // Let's skip granular "Overdue" logic for now to avoid false positives.
            }
        });
    });

    res.json(reminders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};
