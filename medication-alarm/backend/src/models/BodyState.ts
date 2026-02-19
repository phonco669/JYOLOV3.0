import db from '../config/database';

export interface BodyState {
  id?: number;
  user_id: number;
  date: string;
  symptom: string;
  weight?: number;
  note?: string;
  created_at?: string;
}

export class BodyStateModel {
  static initTable() {
    db.run(
      `CREATE TABLE IF NOT EXISTS body_states (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      date TEXT,
      symptom TEXT,
      weight REAL,
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
      (err) => {
        if (err) console.error('Error creating body_states table', err.message);
      },
    );
  }

  static create(state: BodyState): Promise<BodyState> {
    return new Promise((resolve, reject) => {
      const { user_id, date, symptom, weight, note } = state;
      db.run(
        'INSERT INTO body_states (user_id, date, symptom, weight, note) VALUES (?, ?, ?, ?, ?)',
        [user_id, date, symptom, weight, note],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...state });
        },
      );
    });
  }

  static findByDateRange(userId: number, startDate: string, endDate: string): Promise<BodyState[]> {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM body_states WHERE user_id = ? AND date BETWEEN ? AND ? ORDER BY date DESC',
        [userId, startDate, endDate],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as BodyState[]);
        },
      );
    });
  }
}

BodyStateModel.initTable();
