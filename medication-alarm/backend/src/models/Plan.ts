import db from '../config/database';

export interface Plan {
  id?: number;
  user_id: number;
  medication_id: number;
  time: string; // HH:MM
  frequency: string; // daily, weekly, etc.
  start_date: string; // YYYY-MM-DD
  end_date?: string;
  created_at?: string;
}

export class PlanModel {
  static initTable() {
    db.run(`CREATE TABLE IF NOT EXISTS plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      medication_id INTEGER,
      time TEXT,
      frequency TEXT,
      start_date TEXT,
      end_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(medication_id) REFERENCES medications(id)
    )`, (err) => {
      if (err) console.error('Error creating plans table', err.message);
    });
  }

  static findAllByUserId(userId: number): Promise<Plan[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM plans WHERE user_id = ?', [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Plan[]);
      });
    });
  }

  static create(plan: Plan): Promise<Plan> {
    return new Promise((resolve, reject) => {
      const { user_id, medication_id, time, frequency, start_date, end_date } = plan;
      db.run(
        'INSERT INTO plans (user_id, medication_id, time, frequency, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)',
        [user_id, medication_id, time, frequency, start_date, end_date],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...plan });
        }
      );
    });
  }
}

PlanModel.initTable();
