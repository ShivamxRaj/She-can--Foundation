const path = require('path');
const fs = require('fs');

let sqlite3;
let useMock = false;

try {
  sqlite3 = require('sqlite3').verbose();
} catch (err) {
  console.warn('sqlite3 native module not available. Falling back to in-memory database mock.');
  useMock = true;
}

let dbRun, dbAll, dbGet, db;

if (!useMock) {
  // Ensure the db directory exists
  const dbDir = __dirname;
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'contacts.sqlite');

  // Initialize the database
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err.message);
    } else {
      console.log('Connected to the SQLite database.');
      initializeTables();
    }
  });

  // Helper functions wrapped in Promises for modern async/await syntax
  dbRun = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  };

  dbAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  dbGet = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };
} else {
  // Mock Database implementations
  const mockSubmissions = [];
  let nextId = 1;

  dbRun = (sql, params = []) => {
    return new Promise((resolve) => {
      if (sql.includes('INSERT INTO submissions')) {
        const [name, email, phone, subject, message, ipAddress] = params;
        const newRecord = {
          id: nextId++,
          name,
          email,
          phone,
          subject,
          message,
          ip_address: ipAddress,
          created_at: new Date().toISOString()
        };
        mockSubmissions.push(newRecord);
        resolve({ lastID: newRecord.id, changes: 1 });
      } else if (sql.includes('DELETE FROM submissions')) {
        const id = params[0];
        const index = mockSubmissions.findIndex(r => r.id === parseInt(id));
        if (index !== -1) {
          mockSubmissions.splice(index, 1);
          resolve({ changes: 1 });
        } else {
          resolve({ changes: 0 });
        }
      } else {
        resolve({ changes: 0 });
      }
    });
  };

  dbAll = (sql, params = []) => {
    return new Promise((resolve) => {
      if (sql.includes('SELECT * FROM submissions')) {
        resolve([...mockSubmissions].reverse());
      } else {
        resolve([]);
      }
    });
  };

  dbGet = (sql, params = []) => {
    return new Promise((resolve) => {
      if (sql.includes('SELECT COUNT(*)')) {
        const ipAddress = params[0];
        const oneHourAgo = Date.now() - 3600000;
        const count = mockSubmissions.filter(
          r => r.ip_address === ipAddress && new Date(r.created_at).getTime() > oneHourAgo
        ).length;
        resolve({ count });
      } else {
        resolve(null);
      }
    });
  };
}

function initializeTables() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        subject TEXT,
        message TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating submissions table:', err.message);
      } else {
        console.log('Submissions table is ready.');
        // Run migration checks for existing tables
        runMigrations();
      }
    });
  });
}

function runMigrations() {
  db.serialize(() => {
    // Add columns dynamically if table already exists from previous runs
    db.run("ALTER TABLE submissions ADD COLUMN phone TEXT", (err) => {
      // Ignore error if column already exists
    });
    db.run("ALTER TABLE submissions ADD COLUMN subject TEXT", (err) => {
      // Ignore error if column already exists
    });
  });
}

// Export database operations
module.exports = {
  dbRun,
  dbAll,
  dbGet,
  close: () => {
    return new Promise((resolve, reject) => {
      if (db) {
        db.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        resolve();
      }
    });
  }
};
