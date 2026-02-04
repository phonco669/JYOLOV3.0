import db from '../config/database';

export interface FollowUp {
  id?: number;
  user_id: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  location: string;
  doctor: string;
  note: string;
  status: 'pending' | 'completed';
  created_at?: string;
}

export class FollowUpModel {
  static initTable() {
    db.run(`CREATE TABLE IF NOT EXISTS follow_ups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      date TEXT,
      time TEXT,
      location TEXT,
      doctor TEXT,
      note TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`, (err) => {
      if (err) console.error('Error creating follow_ups table', err.message);
    });
  }

  static findAllByUserId(userId: number): Promise<FollowUp[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM follow_ups WHERE user_id = ? ORDER BY date ASC, time ASC', [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as FollowUp[]);
      });
    });
  }

  static create(followUp: FollowUp): Promise<FollowUp> {
    return new Promise((resolve, reject) => {
      const { user_id, date, time, location, doctor, note, status } = followUp;
      db.run(
        'INSERT INTO follow_ups (user_id, date, time, location, doctor, note, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user_id, date, time, location, doctor, note, status],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...followUp });
        }
      );
    });
  }

  static updateStatus(id: number, status: 'pending' | 'completed'): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('UPDATE follow_ups SET status = ? WHERE id = ?', [status, id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

FollowUpModel.initTable();
