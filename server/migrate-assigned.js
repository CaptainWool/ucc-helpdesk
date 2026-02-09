const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        console.log('Adding is_assigned column...');
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_assigned BOOLEAN DEFAULT false');

        console.log('Updating super_admins to be assigned...');
        await pool.query("UPDATE users SET is_assigned = true WHERE role = 'super_admin'");

        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

run();
