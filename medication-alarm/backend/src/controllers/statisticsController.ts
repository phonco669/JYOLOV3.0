import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { PlanModel } from '../models/Plan';
import { RecordModel } from '../models/Record';
import { BodyStateModel } from '../models/BodyState';
import { MedicationModel } from '../models/Medication';

const getUserId = (req: Request): number | null => {
  const userId = req.headers['x-user-id'];
  return userId ? parseInt(userId as string, 10) : null;
};

// Helper to convert UTC ISO string to User's Local Date String (Assuming UTC+8 for now)
const toUserDateStr = (isoString: string): string => {
    try {
        const date = new Date(isoString);
        // Add 8 hours for CST
        const localTime = date.getTime() + (8 * 60 * 60 * 1000);
        return new Date(localTime).toISOString().split('T')[0];
    } catch (e) {
        return isoString.split(' ')[0]; // Fallback for non-ISO strings
    }
};

export const getAdherenceStats = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const today = new Date();
    // Default: Last 30 days
    let start = new Date();
    start.setDate(today.getDate() - 30);
    let end = today;

    // Parse query params if present
    if (req.query.startDate) {
        start = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
        end = new Date(req.query.endDate as string);
    }

    // Use toUserDateStr to get local date strings for range
    const startDateStr = toUserDateStr(start.toISOString());
    const endDateStr = toUserDateStr(end.toISOString());

    const plans = await PlanModel.findAllByUserId(userId);
    const records = await RecordModel.findAllByUserId(userId);
    const bodyStates = await BodyStateModel.findByDateRange(userId, startDateStr, endDateStr);
    
    // Filter records in range (using User Date)
    const rangeRecords = records.filter(r => {
        const date = toUserDateStr(r.taken_at);
        return date >= startDateStr && date <= endDateStr;
    });

    const dailyStats: any[] = [];
    const dates = [];
    let curr = new Date(startDateStr);
    const last = new Date(endDateStr);
    
    while (curr <= last) {
        dates.push(curr.toISOString().split('T')[0]);
        curr.setDate(curr.getDate() + 1);
    }

    let totalExpected = 0;
    let totalTaken = 0;

    dates.forEach(date => {
        let dailyExpected = 0;
        let dailyTaken = 0;

        // Calculate expected
        plans.forEach(plan => {
            if (plan.start_date <= date && (!plan.end_date || plan.end_date >= date)) {
                const times = plan.time.split(',').filter(t => t.trim());
                let isDue = true;

                // Frequency check
                if (plan.frequency === 'weekly') {
                    const startDay = new Date(plan.start_date).getDay();
                    const currentDay = new Date(date).getDay();
                    if (startDay !== currentDay) isDue = false;
                } else if (plan.frequency === 'every_other_day') {
                    const start = new Date(plan.start_date).getTime();
                    const current = new Date(date).getTime();
                    const diffDays = Math.floor((current - start) / (1000 * 3600 * 24));
                    if (diffDays % 2 !== 0) isDue = false;
                }
                // 'daily' matches everything (default)

                if (isDue) {
                    dailyExpected += times.length;
                }
            }
        });

        // Calculate taken
        dailyTaken = rangeRecords.filter(r => toUserDateStr(r.taken_at) === date && r.status === 'taken').length;

        dailyStats.push({
            date,
            expected: dailyExpected,
            taken: dailyTaken,
            rate: dailyExpected > 0 ? (dailyTaken / dailyExpected) : 0
        });

        totalExpected += dailyExpected;
        totalTaken += dailyTaken;
    });

    res.json({
        period: { start: startDateStr, end: endDateStr },
        overview: {
            totalExpected,
            totalTaken,
            adherenceRate: totalExpected > 0 ? (totalTaken / totalExpected) : 0
        },
        daily: dailyStats,
        bodyStates: bodyStates // Include body states for trend analysis
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const exportReport = async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const medications = await MedicationModel.findAllByUserId(userId);
    const bodyStates = await BodyStateModel.findByDateRange(userId, '2000-01-01', '2099-12-31'); // All records
    
    const doc = new PDFDocument();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=health-report.pdf');

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('健康报告 / Health Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`生成日期: ${new Date().toLocaleDateString()}`, { align: 'right' });
    doc.moveDown();

    // Medications
    doc.fontSize(16).text('当前用药 / Current Medications');
    doc.moveDown(0.5);
    medications.forEach(med => {
        doc.fontSize(12).text(`- ${med.name} (${med.stock} ${med.unit})`);
    });
    doc.moveDown();

    // Body State (Recent 10)
    doc.fontSize(16).text('身体状况记录 / Recent Body Metrics');
    doc.moveDown(0.5);
    bodyStates.slice(0, 10).forEach(record => {
        doc.fontSize(12).text(`- ${record.date}: ${record.weight}kg, ${record.symptom || 'No symptoms'}`);
    });

    doc.end();

  } catch (error) {
    console.error('PDF Export error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
