const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        console.log('Adding staff_id and expertise columns...');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS staff_id TEXT');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS expertise TEXT');

        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

run();
