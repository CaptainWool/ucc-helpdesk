
const { Client } = require('pg');
require('dotenv').config();

async function check() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    try {
        await client.connect();

        console.log('--- Users Table ---');
        let res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users'");
        res.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));

        console.log('\n--- Tickets Table ---');
        res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'tickets'");
        res.rows.forEach(row => console.log(`- ${row.column_name} (${row.data_type})`));

        await client.end();
    } catch (err) {
        console.error('Check failed:', err.message);
    }
}
check();
