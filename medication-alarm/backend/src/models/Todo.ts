import db from '../config/database';
import { RunResult } from 'sqlite3';

export interface Todo {
  id?: number;
  user_id: number;
  title: string;
  description?: string;
  due_date: string; // ISO String
  type: 'custom' | 'revisit' | 'other';
  status: 'pending' | 'completed';
  created_at?: string;
}

export class TodoModel {
  static initTable() {
    db.run(`CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT,
      description TEXT,
      due_date DATETIME,
      type TEXT,
      status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`, (err: Error | null) => {
      if (err) console.error('Error creating todos table', err.message);
    });
  }

  static create(todo: Todo): Promise<Todo> {
    return new Promise((resolve, reject) => {
      const { user_id, title, description, due_date, type, status } = todo;
      db.run(
        `INSERT INTO todos (user_id, title, description, due_date, type, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id, title, description, due_date, type, status],
        function (this: RunResult, err: Error | null) {
          if (err) reject(err);
          else resolve({ id: this.lastID, ...todo });
        }
      );
    });
  }

  static findAllByUserId(userId: number): Promise<Todo[]> {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM todos WHERE user_id = ? ORDER BY due_date ASC`, [userId], (err: Error | null, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows as Todo[]);
      });
    });
  }

  static updateStatus(id: number, status: 'pending' | 'completed'): Promise<void> {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE todos SET status = ? WHERE id = ?`, [status, id], (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  static update(id: number, todo: Partial<Todo>): Promise<void> {
    return new Promise((resolve, reject) => {
      const fields = [];
      const values = [];
      
      if (todo.title) { fields.push('title = ?'); values.push(todo.title); }
      if (todo.description !== undefined) { fields.push('description = ?'); values.push(todo.description); }
      if (todo.due_date) { fields.push('due_date = ?'); values.push(todo.due_date); }
      if (todo.type) { fields.push('type = ?'); values.push(todo.type); }
      
      if (fields.length === 0) return resolve();
      
      values.push(id);
      
      db.run(`UPDATE todos SET ${fields.join(', ')} WHERE id = ?`, values, (err: Error | null) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  static delete(id: number): Promise<void> {
      return new Promise((resolve, reject) => {
          db.run(`DELETE FROM todos WHERE id = ?`, [id], (err: Error | null) => {
              if (err) reject(err);
              else resolve();
          });
      });
  }
}

TodoModel.initTable();
