const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function fix() {
    try {
        await pool.query(
            "UPDATE system_settings SET value = '100' WHERE key = 'max_open_tickets'"
        );
        console.log('Successfully updated max_open_tickets to 100');
    } catch (err) {
        console.error('Error fixing settings:', err.message);
    } finally {
        await pool.end();
    }
}

fix();
