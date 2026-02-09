
const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('✅ Connected to ucc_helpdesk database');

        // Settings table for global flags
        await client.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                key TEXT PRIMARY KEY,
                value JSONB,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Initialize settings if they don't exist
        await client.query(`
            INSERT INTO system_settings (key, value)
            VALUES ('submissions_locked', 'false'), ('maintenance_mode', 'false')
            ON CONFLICT (key) DO NOTHING;
        `);

        // User management columns
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;');
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_expires_at TIMESTAMP WITH TIME ZONE;');
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE;');
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS revocation_reason TEXT;');

        console.log('✅ Command Center columns and settings table added!');

        await client.end();
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    }
}

migrate();
