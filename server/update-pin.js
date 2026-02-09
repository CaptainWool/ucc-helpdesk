
const { Client } = require('pg');
require('dotenv').config();

async function updatePIN() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });

    try {
        await client.connect();
        await client.query(
            "UPDATE system_settings SET value = $1 WHERE key = 'command_center_password'",
            [JSON.stringify('israel@40')]
        );
        console.log('✅ PIN successfully updated to israel@40');
        await client.end();
    } catch (err) {
        console.error('❌ Update failed:', err.message);
    }
}

updatePIN();
