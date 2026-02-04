import db from '../config/database';

export interface Medication {
  id?: number;
  user_id: number;
  name: string;
  dosage: string; // Changed from number to string to support "1.5,1.75"
  unit: string;
  color: string;
  stock: number;
  created_at?: string;
}

export class MedicationModel {
  static initTable() {
    db.run(`CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT,
      dosage TEXT, -- Changed from REAL to TEXT
      unit TEXT,
      color TEXT,
      stock REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`, (err) => {
      if (err) console.error('Error creating medications table', err.message);
    });
  }

  static findAllByUserId(userId: number): Promise<Medication[]> {
    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM medications WHERE user_id = ?', [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows as Medication[]);
      });
    });
  }

  static create(medication: Medication): Promise<Medication> {
    return new Promise((resolve, reject) => {
      const { user_id, name, dosage, unit, color, stock } = medication;
      db.run(
        'INSERT INTO medications (user_id, name, dosage, unit, color, stock) VALUES (?, ?, ?, ?, ?, ?)',
        [user_id, name, dosage, unit, color, stock],
        function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...medication });
        }
      );
    });
  }

  static findById(id: number): Promise<Medication | undefined> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM medications WHERE id = ?', [id], (err, row) => {
        if (err) reject(err);
        else resolve(row as Medication);
      });
    });
  }

  static update(id: number, updates: Partial<Medication>): Promise<void> {
    return new Promise((resolve, reject) => {
      const { name, dosage, unit, color, stock } = updates;
      db.run(
        'UPDATE medications SET name = ?, dosage = ?, unit = ?, color = ?, stock = ? WHERE id = ?',
        [name, dosage, unit, color, stock, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  // Add update/delete later if needed
  static updateStock(id: number, quantity: number): Promise<void> {
    return new Promise((resolve, reject) => {
        // Decrease stock by quantity
        db.run('UPDATE medications SET stock = stock - ? WHERE id = ?', [quantity, id], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
  }

  static delete(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM medications WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

MedicationModel.initTable();
