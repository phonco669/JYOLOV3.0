import db from '../config/database';

export interface Subscription {
  id?: number;
  user_id: number;
  template_id: string;
  data: string; // JSON string
  page?: string;
  send_time: string; // ISO 'YYYY-MM-DD HH:MM'
  status: 'pending' | 'sent' | 'failed';
  result?: string; // error or response message
  created_at?: string;
}

export class SubscriptionModel {
  static initTable() {
    db.run(
      `CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        template_id TEXT,
        data TEXT,
        page TEXT,
        send_time TEXT,
        status TEXT DEFAULT 'pending',
        result TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )`,
      (err) => {
        if (err) console.error('Error creating subscriptions table', err.message);
      },
    );
  }

  static create(sub: Subscription): Promise<Subscription> {
    return new Promise((resolve, reject) => {
      const { user_id, template_id, data, page, send_time, status } = sub;
      db.run(
        `INSERT INTO subscriptions (user_id, template_id, data, page, send_time, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, template_id, data, page || '', send_time, status || 'pending'],
        function (err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...sub });
        },
      );
    });
  }

  static findDue(nowStr: string): Promise<Subscription[]> {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT * FROM subscriptions WHERE status = 'pending' AND send_time <= ? ORDER BY send_time ASC`,
        [nowStr],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as Subscription[]);
        },
      );
    });
  }

  static markSent(id: number, result: string): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE subscriptions SET status = 'sent', result = ? WHERE id = ?`, [result, id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  static markFailed(id: number, error: string): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE subscriptions SET status = 'failed', result = ? WHERE id = ?`, [error, id], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

SubscriptionModel.initTable();
