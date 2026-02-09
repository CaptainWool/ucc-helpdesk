
const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();

        // Add command_center_password with a default value 'admin123'
        await client.query(`
            INSERT INTO system_settings (key, value)
            VALUES ($1, $2)
            ON CONFLICT (key) DO NOTHING;
        `, ['command_center_password', JSON.stringify('admin123')]);

        console.log('✅ Command Center Password setting added (Default: admin123)');

        await client.end();
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    }
}

migrate();
