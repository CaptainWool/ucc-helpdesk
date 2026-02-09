const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        console.log('Finalizing assignment status for all staff...');
        await pool.query("UPDATE users SET is_assigned = true WHERE role IN ('agent', 'super_admin') AND is_assigned = false");
        console.log('Update complete.');
    } catch (err) {
        console.error('Update failed:', err);
    } finally {
        await pool.end();
    }
}

run();
