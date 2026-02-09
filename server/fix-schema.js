const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.argv[2] || process.env.DATABASE_URL;

if (!connectionString) {
    console.error('Usage: node server/fix-schema.js <YOUR_RENDER_DATABASE_URL>');
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

        console.log('Adding missing columns...');
        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS staff_id TEXT;
        `);

        console.log('✅ Database fixed! staff_id column added.');
    } catch (err) {
        console.error('❌ Fix failed:', err);
    } finally {
        await client.end();
    }
}

fix();
