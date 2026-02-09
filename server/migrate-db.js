const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function migrate() {
    try {
        console.log('Migrating database...');

        // Add avatar_url if missing
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT');
        console.log('Column avatar_url added or already exists.');

        // Verify other columns
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS has_completed_tour BOOLEAN DEFAULT false');
        console.log('Column has_completed_tour verified.');

        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
