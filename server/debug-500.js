const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function debug() {
    console.log('--- Debugging 500 Error ---');
    console.log('Database URL:', process.env.DATABASE_URL);

    try {
        console.log('\nTesting connection...');
        await pool.query('SELECT NOW()');
        console.log('✅ Connection successful');

        console.log('\nChecking system_settings table...');
        const settingsRes = await pool.query('SELECT * FROM system_settings');
        console.log(`✅ Table exists. Found ${settingsRes.rowCount} rows.`);
        console.log('Sample data:', JSON.stringify(settingsRes.rows.slice(0, 2), null, 2));

        console.log('\nChecking tickets table...');
        const ticketsRes = await pool.query("SELECT COUNT(*) FROM tickets WHERE status IN ('Open', 'In Progress')");
        console.log(`✅ Table exists. Open/In-progress tickets: ${ticketsRes.rows[0].count}`);

        console.log('\nTesting /api/public/settings logic...');
        const settings = {};
        settingsRes.rows.forEach(row => {
            settings[row.key] = row.value;
        });
        settings.current_ticket_count = parseInt(ticketsRes.rows[0].count);
        console.log('✅ Logic simulation successful');
        console.log('Resulting settings keys:', Object.keys(settings));

    } catch (err) {
        console.error('❌ DEBUG FAILED:');
        console.error(err);
    } finally {
        await pool.end();
    }
}

debug();
