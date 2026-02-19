import db from '../config/database';

export interface User {
  id?: number;
  openid: string;
  created_at?: string;
}

export class UserModel {
  static findById(id: number): Promise<User | undefined> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as User);
        }
      });
    });
  }

  static findByOpenId(openid: string): Promise<User | undefined> {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE openid = ?', [openid], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row as User);
        }
      });
    });
  }

  static create(openid: string): Promise<User> {
    return new Promise((resolve, reject) => {
      db.run('INSERT INTO users (openid) VALUES (?)', [openid], function (err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, openid });
        }
      });
    });
  }
}
