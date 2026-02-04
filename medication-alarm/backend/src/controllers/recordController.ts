import { Request, Response } from 'express';
import { RecordModel } from '../models/Record';
import { MedicationModel } from '../models/Medication';

const getUserId = (req: Request) => {
  const id = req.headers['x-user-id'];
  return id ? parseInt(id as string) : null;
};

export const listRecords = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const records = await RecordModel.findAllByUserId(userId);
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const deleteRecord = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const recordId = parseInt(req.params.id as string);

  try {
    const record = await RecordModel.findById(recordId);
    if (!record) return res.status(404).json({ error: 'Record not found' });
    if (record.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

    // Restore stock if it was taken
    if (record.status === 'taken' && record.dosage_taken > 0) {
        // Pass negative value to subtract -> double negative = add
        await MedicationModel.updateStock(record.medication_id, -record.dosage_taken);
    }

    await RecordModel.delete(recordId);
    res.status(200).json({ message: 'Record deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const createRecord = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { medication_id, plan_id, taken_at, status, dosage_taken } = req.body;

  try {
    // Fetch medication details for snapshot
    const medication = await MedicationModel.findById(medication_id);
    
    const newRecord = await RecordModel.create({
      user_id: userId,
      medication_id,
      plan_id,
      taken_at: taken_at || new Date().toISOString(),
      status,
      dosage_taken,
      medication_name: medication?.name || 'Unknown',
      medication_unit: medication?.unit || '',
      medication_color: medication?.color || '#ccc'
    });

    // Auto-deduct stock if taken
    if (status === 'taken' && dosage_taken > 0) {
        await MedicationModel.updateStock(medication_id, dosage_taken);
    }

    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};
