import db from '../config/database';

export interface Record {
  id?: number;
  user_id: number;
  medication_id: number;
  plan_id?: number; // Optional: Link to a specific plan execution
  taken_at: string;
  status: 'taken' | 'skipped';
  dosage_taken: number;
  medication_name?: string;
  medication_unit?: string;
  medication_color?: string;
}

export class RecordModel {
  static initTable() {
    db.run(
      `CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      medication_id INTEGER,
      plan_id INTEGER,
      taken_at DATETIME,
      status TEXT,
      dosage_taken REAL,
      medication_name TEXT,
      medication_unit TEXT,
      medication_color TEXT,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(medication_id) REFERENCES medications(id),
      FOREIGN KEY(plan_id) REFERENCES plans(id)
    )`,
      (err) => {
        if (err) console.error('Error creating records table', err.message);
        else {
          // Migration: Attempt to add plan_id column if it doesn't exist (for existing dev DBs)
          db.run(`ALTER TABLE records ADD COLUMN plan_id INTEGER`, (_err) => {
            /* ignore error */
          });
          // Add new snapshot columns
          const columns = ['medication_name', 'medication_unit', 'medication_color'];
          columns.forEach((col) => {
            db.run(`ALTER TABLE records ADD COLUMN ${col} TEXT`, (_err) => {
              /* ignore error */
            });
          });
        }
      },
    );
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
      const {
        user_id,
        medication_id,
        plan_id,
        taken_at,
        status,
        dosage_taken,
        medication_name,
        medication_unit,
        medication_color,
      } = record;
      db.run(
        'INSERT INTO records (user_id, medication_id, plan_id, taken_at, status, dosage_taken, medication_name, medication_unit, medication_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          user_id,
          medication_id,
          plan_id,
          taken_at,
          status,
          dosage_taken,
          medication_name,
          medication_unit,
          medication_color,
        ],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...record });
        },
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
