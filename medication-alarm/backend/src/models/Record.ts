import db from '../config/database';

export interface Record {
  id?: number;
  user_id: number;
  medication_id: number;
  plan_id?: number; // Optional: Link to a specific plan execution
  taken_at: string;
  status: 'taken' | 'skipped';
  dosage_taken: number;
}

export class RecordModel {
  static initTable() {
    db.run(`CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      medication_id INTEGER,
      plan_id INTEGER,
      taken_at DATETIME,
      status TEXT,
      dosage_taken REAL,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(medication_id) REFERENCES medications(id),
      FOREIGN KEY(plan_id) REFERENCES plans(id)
    )`, (err) => {
      if (err) console.error('Error creating records table', err.message);
      else {
        // Migration: Attempt to add plan_id column if it doesn't exist (for existing dev DBs)
        db.run(`ALTER TABLE records ADD COLUMN plan_id INTEGER`, (err) => {
          // Ignore error (likely "duplicate column name" if it already exists)
        });
      }
    });
  }

  static findAllByUserId(userId: number): Promise<Record[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM records WHERE user_id = ? ORDER BY taken_at DESC', [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Record[]);
      });
    });
  }

  static create(record: Record): Promise<Record> {
    return new Promise((resolve, reject) => {
      const { user_id, medication_id, plan_id, taken_at, status, dosage_taken } = record;
      db.run(
        'INSERT INTO records (user_id, medication_id, plan_id, taken_at, status, dosage_taken) VALUES (?, ?, ?, ?, ?, ?)',
        [user_id, medication_id, plan_id, taken_at, status, dosage_taken],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...record });
        }
      );
    });
  }

  static findById(id: number): Promise<Record | undefined> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM records WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as Record);
      });
    });
  }

  static delete(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM records WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

RecordModel.initTable();
