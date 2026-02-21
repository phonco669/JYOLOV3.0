const sqlite3 = require('sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../medication_alarm.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('Running migration...');
  
  // Force check columns
  db.all("PRAGMA table_info(users)", (err, columns) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    
    const names = columns.map(c => c.name);
    if (!names.includes('nickname')) {
      console.log('Adding nickname column...');
      db.run("ALTER TABLE users ADD COLUMN nickname TEXT");
    }
    if (!names.includes('avatar_url')) {
      console.log('Adding avatar_url column...');
      db.run("ALTER TABLE users ADD COLUMN avatar_url TEXT");
    }
    console.log('Migration completed.');
    db.close();
  });
});
