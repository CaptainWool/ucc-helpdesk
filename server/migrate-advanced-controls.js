
const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('✅ Connected to ucc_helpdesk database');

        // Add default values for new settings
        const settings = [
            { key: 'global_announcement', value: { enabled: false, message: 'Welcome to the UCC Helpdesk!', type: 'info' } },
            { key: 'max_open_tickets', value: 100 }
        ];

        for (const s of settings) {
            await client.query(`
                INSERT INTO system_settings (key, value)
                VALUES ($1, $2)
                ON CONFLICT (key) DO NOTHING;
            `, [s.key, JSON.stringify(s.value)]);
        }

        console.log('✅ Announcement and Capacity settings initialized!');

        await client.end();
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    }
}

migrate();
