const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function run() {
    try {
        console.log('Fixing messages table sender_role constraint...');

        // Remove old constraint if it exists (might have a different name, let's just alter the column)
        // In Postgres, to change a check constraint we usually drop and re-add.
        // We can get the constraint name but usually it is "messages_sender_role_check"

        await pool.query('ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_role_check');
        await pool.query("ALTER TABLE messages ADD CONSTRAINT messages_sender_role_check CHECK (sender_role IN ('student', 'admin', 'agent', 'super_admin'))");

        console.log('Migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

run();
