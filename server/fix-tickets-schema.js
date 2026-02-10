const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('Usage: node server/fix-tickets-schema.js <YOUR_RENDER_DATABASE_URL>');
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function fix() {
    try {
        console.log('Connecting to database...');
        await client.connect();

        console.log('Adding missing phone_number to tickets table...');
        await client.query(`
            ALTER TABLE tickets 
            ADD COLUMN IF NOT EXISTS phone_number TEXT;
        `);

        console.log('✅ Database fixed! phone_number column added to tickets.');
    } catch (err) {
        console.error('❌ Fix failed:', err);
    } finally {
        await client.end();
    }
}

fix();
