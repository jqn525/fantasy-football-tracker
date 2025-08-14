const path = require('path');
const fs = require('fs');

let db;

// Check if we're in a serverless environment (like Vercel)
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
  // Production: Use Turso
  const { createClient } = require('@libsql/client');
  // Production: Use Turso
  const tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  // Create a compatibility layer for Turso
  db = {
    run: (sql, params, callback) => {
      tursoClient.execute({ sql, args: params || [] })
        .then(result => callback && callback(null, result))
        .catch(err => callback && callback(err));
    },
    get: (sql, params, callback) => {
      tursoClient.execute({ sql, args: params || [] })
        .then(result => callback && callback(null, result.rows[0]))
        .catch(err => callback && callback(err));
    },
    all: (sql, params, callback) => {
      tursoClient.execute({ sql, args: params || [] })
        .then(result => callback && callback(null, result.rows))
        .catch(err => callback && callback(err));
    },
    prepare: (sql) => {
      return {
        run: (...params) => {
          const callback = params[params.length - 1];
          const args = params.slice(0, -1);
          return db.run(sql, args, callback);
        },
        finalize: () => {}
      };
    },
    serialize: (callback) => callback(),
    
    // Promise-based methods
    runAsync: function(sql, params = []) {
      return tursoClient.execute({ sql, args: params })
        .then(result => ({ id: result.lastInsertRowid, changes: result.rowsAffected }));
    },
    getAsync: function(sql, params = []) {
      return tursoClient.execute({ sql, args: params })
        .then(result => result.rows[0]);
    },
    allAsync: function(sql, params = []) {
      return tursoClient.execute({ sql, args: params })
        .then(result => result.rows);
    }
  };

  console.log('Connected to Turso database');
} else if (isServerless) {
  // Serverless environment without Turso - create mock database
  console.warn('Running in serverless mode without database. Creating mock database interface.');
  
  db = {
    run: (sql, params, callback) => {
      console.log('Mock DB run:', sql);
      if (callback) callback(null, { lastInsertRowid: 1, rowsAffected: 1 });
    },
    get: (sql, params, callback) => {
      console.log('Mock DB get:', sql);
      if (callback) callback(null, null);
    },
    all: (sql, params, callback) => {
      console.log('Mock DB all:', sql);
      if (callback) callback(null, []);
    },
    prepare: (sql) => ({
      run: (...params) => {
        const callback = params[params.length - 1];
        if (callback) callback(null);
      },
      finalize: () => {}
    }),
    serialize: (callback) => callback(),
    
    // Promise-based methods
    runAsync: async function(sql, params = []) {
      console.log('Mock DB runAsync:', sql);
      return { id: 1, changes: 1 };
    },
    getAsync: async function(sql, params = []) {
      console.log('Mock DB getAsync:', sql);
      return null;
    },
    allAsync: async function(sql, params = []) {
      console.log('Mock DB allAsync:', sql);
      return [];
    }
  };
} else {
  // Development: Use local SQLite
  const sqlite3 = require('sqlite3').verbose();
  
  const dbDir = path.dirname(process.env.DATABASE_PATH || './db/fantasy.db');
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new sqlite3.Database(
    process.env.DATABASE_PATH || './db/fantasy.db',
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    (err) => {
      if (err) {
        console.error('Error opening database:', err.message);
      } else {
        console.log('Connected to local SQLite database');
        db.run('PRAGMA foreign_keys = ON');
        db.run('PRAGMA journal_mode = WAL');
      }
    }
  );

  // Add promise wrappers for local SQLite
  db.runAsync = function(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  };

  db.getAsync = function(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  };

  db.allAsync = function(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };
}

module.exports = db;