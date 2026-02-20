import { Request, Response } from 'express';
import { MedicationModel } from '../models/Medication';

export const listMedications = async (req: Request, res: Response) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const meds = await MedicationModel.findAllByUserId(userId);
    res.json(meds);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const getMedication = async (req: Request, res: Response) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const medId = parseInt(req.params.id as string);

  try {
    const med = await MedicationModel.findById(medId);
    if (!med) return res.status(404).json({ error: 'Not found' });
    if (med.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

    res.json(med);
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const deleteMedication = async (req: Request, res: Response) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const medId = parseInt(req.params.id as string);

  try {
    const med = await MedicationModel.findById(medId);
    if (!med) return res.status(404).json({ error: 'Not found' });
    if (med.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

    await MedicationModel.delete(medId);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const updateMedication = async (req: Request, res: Response) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const medId = parseInt(req.params.id as string);
  const { name, dosage, unit, color, stock } = req.body;

  try {
    const med = await MedicationModel.findById(medId);
    if (!med) return res.status(404).json({ error: 'Not found' });
    if (med.user_id !== userId) return res.status(403).json({ error: 'Forbidden' });

    await MedicationModel.update(medId, { name, dosage, unit, color, stock });
    res.json({ message: 'Updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
};

export const addMedication = async (req: Request, res: Response) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { name, dosage, unit, color, stock } = req.body;

  try {
    const newMed = await MedicationModel.create({
      user_id: userId,
      name,
      dosage,
      unit,
      color,
      stock,
    });
    res.status(201).json(newMed);
  } catch (error) {
    console.error('[Add Medication Error]:', error);
    res.status(500).json({ error: 'Database error', details: (error as any).message });
  }
};
