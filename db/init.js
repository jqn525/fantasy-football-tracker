const db = require('./database');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');

async function initializeDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  
  const statements = schema
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Initializing database with ${statements.length} statements...`);

  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    // Turso initialization
    const turso = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    for (const statement of statements) {
      try {
        await turso.execute(statement + ';');
      } catch (err) {
        console.error('Error executing statement:', err.message);
      }
    }

    // Insert default schedules
    await insertDefaultScheduleTurso(turso);
    console.log('✅ Turso database initialized successfully');
  } else {
    // Local SQLite initialization (existing code)
    return new Promise((resolve, reject) => {
      let completed = 0;
      const total = statements.length;
      
      db.serialize(() => {
        statements.forEach((statement, index) => {
          db.run(statement + ';', (err) => {
            if (err) {
              console.error(`Error executing statement ${index + 1}:`, err.message);
              reject(err);
            } else {
              completed++;
              if (completed === total) {
                console.log('✅ Local database initialized successfully');
                insertDefaultSchedule();
                resolve();
              }
            }
          });
        });
      });
    });
  }
}

async function insertDefaultScheduleTurso(turso) {
  const schedules = [
    { type: 'daily_brief', time: '08:00', day: 'daily', active: 1 },
    { type: 'thursday_pregame', time: '18:00', day: 'thursday', active: 1 },
    { type: 'sunday_morning', time: '11:00', day: 'sunday', active: 1 },
    { type: 'sunday_redzone', time: '13:00', day: 'sunday', active: 1 },
    { type: 'monday_wrapup', time: '23:00', day: 'monday', active: 1 },
    { type: 'waiver_research', time: '10:00', day: 'tuesday', active: 1 }
  ];

  for (const schedule of schedules) {
    await turso.execute({
      sql: 'INSERT OR IGNORE INTO research_schedule (research_type, scheduled_time, day_of_week, is_active) VALUES (?, ?, ?, ?)',
      args: [schedule.type, schedule.time, schedule.day, schedule.active]
    });
  }
  console.log('📅 Default research schedule created');
}

function insertDefaultSchedule() {
  const schedules = [
    { type: 'daily_brief', time: '08:00', day: 'daily', active: 1 },
    { type: 'thursday_pregame', time: '18:00', day: 'thursday', active: 1 },
    { type: 'sunday_morning', time: '11:00', day: 'sunday', active: 1 },
    { type: 'sunday_redzone', time: '13:00', day: 'sunday', active: 1 },
    { type: 'monday_wrapup', time: '23:00', day: 'monday', active: 1 },
    { type: 'waiver_research', time: '10:00', day: 'tuesday', active: 1 }
  ];
  
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO research_schedule (research_type, scheduled_time, day_of_week, is_active)
    VALUES (?, ?, ?, ?)
  `);
  
  schedules.forEach(schedule => {
    stmt.run(schedule.type, schedule.time, schedule.day, schedule.active);
  });
  
  stmt.finalize();
  console.log('📅 Default research schedule created');
}

// Run initialization if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('Database initialization complete');
      process.exit(0);
    })
    .catch(err => {
      console.error('Database initialization failed:', err);
      process.exit(1);
    });
}

module.exports = { initializeDatabase };