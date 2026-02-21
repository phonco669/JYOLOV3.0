import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.resolve(__dirname, '../../medication_alarm.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to the SQLite database.');

    // Create Users table
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      openid TEXT UNIQUE,
      nickname TEXT,
      avatar_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
      (err) => {
        if (err) {
          console.error('Error creating users table', err.message);
        } else {
          // Check if columns exist and add them if they don't (simple migration)
          db.all("PRAGMA table_info(users)", (err, columns: any[]) => {
            if (err) return;
            const hasNickname = columns.some(c => c.name === 'nickname');
            const hasAvatarUrl = columns.some(c => c.name === 'avatar_url');
            
            if (!hasNickname) {
              db.run("ALTER TABLE users ADD COLUMN nickname TEXT", (err) => {
                if (err) console.error('Error adding nickname column', err.message);
              });
            }
            if (!hasAvatarUrl) {
              db.run("ALTER TABLE users ADD COLUMN avatar_url TEXT", (err) => {
                if (err) console.error('Error adding avatar_url column', err.message);
              });
            }
          });
        }
      },
    );
  }
});

export default db;
