
const { Client } = require('pg');
require('dotenv').config();

async function migrate() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        console.log('✅ Connected to ucc_helpdesk database');

        await client.query('ALTER TABLE tickets ADD COLUMN IF NOT EXISTS phone_number TEXT;');
        console.log('✅ Column "phone_number" added to tickets table!');

        await client.end();
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    }
}

migrate();
