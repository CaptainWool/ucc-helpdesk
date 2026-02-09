
const { Client } = require('pg');

async function migrate() {
    const config = {
        user: 'postgres',
        host: 'localhost',
        database: 'ucc_helpdesk',
        password: 'israel@40', // Corrected password from setup-db.js
        port: 5432,
    };

    const client = new Client(config);

    try {
        await client.connect();
        console.log('✅ Connected to ucc_helpdesk database');

        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS level TEXT;');
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS programme TEXT;');
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;');
        console.log('✅ Columns "level", "programme", and "phone_number" added!');

        await client.end();
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    }
}

migrate();
