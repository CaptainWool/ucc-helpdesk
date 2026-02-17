const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function check() {
    try {
        const res = await pool.query("SELECT key, value FROM system_settings WHERE key = 'max_open_tickets'");
        console.log('System Settings:');
        console.table(res.rows);
    } catch (err) {
        console.error('Error checking DB:', err.message);
    } finally {
        await pool.end();
    }
}

check();
