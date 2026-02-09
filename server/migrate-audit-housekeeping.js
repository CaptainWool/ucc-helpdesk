
const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('✅ Connected to ucc_helpdesk database');

        // 1. Audit Logs Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id SERIAL PRIMARY KEY,
                admin_id UUID REFERENCES users(id),
                action TEXT NOT NULL,
                target_type TEXT,
                target_id TEXT,
                details JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Add new settings
        const settings = [
            { key: 'ai_sensitivity', value: 0.7 }, // 0.0 to 1.0
            { key: 'housekeeping_rules', value: { auto_close_resolved_days: 30, enabled: false } }
        ];

        for (const s of settings) {
            await client.query(`
                INSERT INTO system_settings (key, value)
                VALUES ($1, $2)
                ON CONFLICT (key) DO NOTHING;
            `, [s.key, JSON.stringify(s.value)]);
        }

        console.log('✅ Audit and Housekeeping initialized!');

        await client.end();
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    }
}

migrate();
