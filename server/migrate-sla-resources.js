
const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('✅ Connected to ucc_helpdesk database');

        const settings = [
            { key: 'sla_peak_mode', value: false },
            { key: 'resource_limits', value: { max_size_mb: 5, allowed_types: ['image/jpeg', 'image/png', 'application/pdf'] } }
        ];

        for (const s of settings) {
            await client.query(`
                INSERT INTO system_settings (key, value)
                VALUES ($1, $2)
                ON CONFLICT (key) DO NOTHING;
            `, [s.key, JSON.stringify(s.value)]);
        }

        console.log('✅ SLA and Resource settings initialized!');

        await client.end();
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    }
}

migrate();
