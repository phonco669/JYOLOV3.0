import db from '../config/database';

export interface User {
  id?: number;
  openid: string;
  nickname?: string;
  avatar_url?: string;
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

  static create(openid: string, nickname?: string, avatar_url?: string): Promise<User> {
    return new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO users (openid, nickname, avatar_url) VALUES (?, ?, ?)',
        [openid, nickname, avatar_url],
        function (err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, openid, nickname, avatar_url });
          }
        },
      );
    });
  }

  static update(id: number, updates: Partial<Pick<User, 'nickname' | 'avatar_url'>>): Promise<void> {
    const fields = Object.keys(updates);
    if (fields.length === 0) return Promise.resolve();

    const setClause = fields.map((f) => `${f} = ?`).join(', ');
    const values = Object.values(updates);

    return new Promise((resolve, reject) => {
      db.run(
        `UPDATE users SET ${setClause} WHERE id = ?`,
        [...values, id],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        },
      );
    });
  }
}
