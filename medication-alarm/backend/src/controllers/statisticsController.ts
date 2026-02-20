import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { PlanModel } from '../models/Plan';
import { RecordModel } from '../models/Record';
import { BodyStateModel } from '../models/BodyState';
import { MedicationModel } from '../models/Medication';

// const getUserId = (req: Request): number | null => {
//   const userId = req.headers['x-user-id'];
//   return userId ? parseInt(userId as string, 10) : null;
// };

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

interface DailyStat {
  date: string;
  expected: number;
  taken: number;
  rate: number;
}

export const getAdherenceStats = async (req: Request, res: Response) => {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const today = new Date();
    let start = new Date();
    start.setDate(today.getDate() - 30);
    let end = today;

    if (req.query.startDate) {
      start = new Date(req.query.startDate as string);
    }
    if (req.query.endDate) {
      end = new Date(req.query.endDate as string);
    }

    const startDateStr = toUserDateStr(start.toISOString());
    const endDateStr = toUserDateStr(end.toISOString());

    // 优化：只查询当前用户和范围内的记录 (如果有相应 Model 方法的话)
    // 暂时保持逻辑，但通过对象映射优化查找速度
    const plans = await PlanModel.findAllByUserId(userId);
    const records = await RecordModel.findAllByUserId(userId);
    const bodyStates = await BodyStateModel.findByDateRange(userId, startDateStr, endDateStr);

    // 将 records 转换为按日期分组的 Map，避免在循环中重复 filter
    const recordsByDate: { [key: string]: any[] } = {};
    records.forEach(r => {
      const d = toUserDateStr(r.taken_at);
      if (d >= startDateStr && d <= endDateStr) {
        if (!recordsByDate[d]) recordsByDate[d] = [];
        recordsByDate[d].push(r);
      }
    });

    const dailyStats: DailyStat[] = [];
    const curr = new Date(startDateStr);
    const last = new Date(endDateStr);

    let totalExpected = 0;
    let totalTaken = 0;

    while (curr <= last) {
      const date = curr.toISOString().split('T')[0];
      let dailyExpected = 0;
      
      // Calculate expected
      plans.forEach((plan) => {
        if (plan.start_date <= date && (!plan.end_date || plan.end_date >= date)) {
          const times = plan.time.split(',').filter((t) => t.trim());
          let isDue = true;

          if (plan.frequency === 'weekly') {
            const planStartDate = new Date(plan.start_date);
            const currentDay = new Date(date).getDay();
            if (planStartDate.getDay() !== currentDay) isDue = false;
          } else if (plan.frequency === 'every_other_day') {
            const startMs = new Date(plan.start_date).getTime();
            const currentMs = new Date(date).getTime();
            const diffDays = Math.floor((currentMs - startMs) / (1000 * 3600 * 24));
            if (diffDays % 2 !== 0) isDue = false;
          }

          if (isDue) dailyExpected += times.length;
        }
      });

      // 直接从 Map 中读取，大幅提升性能
      const dailyRecords = recordsByDate[date] || [];
      const dailyTaken = dailyRecords.filter(r => r.status === 'taken').length;

      dailyStats.push({
        date,
        expected: dailyExpected,
        taken: dailyTaken,
        rate: dailyExpected > 0 ? dailyTaken / dailyExpected : 0,
      });

      totalExpected += dailyExpected;
      totalTaken += dailyTaken;

      curr.setDate(curr.getDate() + 1);
    }

    res.json({
      period: { start: startDateStr, end: endDateStr },
      overview: {
        totalExpected,
        totalTaken,
        adherenceRate: totalExpected > 0 ? totalTaken / totalExpected : 0,
      },
      daily: dailyStats,
      bodyStates: bodyStates,
    });
  } catch (error) {
    console.error('[Stats Error]:', error);
    res.status(500).json({ error: 'Server error while calculating statistics' });
  }
};

export const exportReport = async (req: Request, res: Response) => {
  const userId = req.user.id;
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
    medications.forEach((med) => {
      doc.fontSize(12).text(`- ${med.name} (${med.stock} ${med.unit})`);
    });
    doc.moveDown();

    // Body State (Recent 10)
    doc.fontSize(16).text('身体状况记录 / Recent Body Metrics');
    doc.moveDown(0.5);
    bodyStates.slice(0, 10).forEach((record) => {
      doc.fontSize(12).text(`- ${record.date}: ${record.weight}kg, ${record.symptom || 'No symptoms'}`);
    });

    doc.end();
  } catch (error) {
    console.error('PDF Export error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
