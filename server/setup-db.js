
const { Client } = require('pg');
const fs = require('fs');

async function setupDatabase() {
    console.log('📦 Starting database setup...');

    const config = {
        user: 'postgres',
        host: 'localhost',
        database: 'postgres', // Connect to default DB first to create new one
        password: 'israel@40', // User provided password
        port: 5432,
    };

    const client = new Client(config);

    try {
        await client.connect();
        console.log('✅ Connected to Postgres server');

        // Check if DB exists
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'ucc_helpdesk'");
        if (res.rows.length === 0) {
            console.log('Creating database ucc_helpdesk...');
            await client.query('CREATE DATABASE ucc_helpdesk');
            console.log('✅ Database created!');
        } else {
            console.log('ℹ️ Database ucc_helpdesk already exists.');
        }

        await client.end();

        // Now connect to the new DB and run schema
        const dbClient = new Client({
            ...config,
            database: 'ucc_helpdesk'
        });

        await dbClient.connect();
        console.log('✅ Connected to ucc_helpdesk database');

        const schema = fs.readFileSync('schema.sql', 'utf8');
        await dbClient.query(schema);
        console.log('✅ Schema tables created successfully!');

        await dbClient.end();
        console.log('🎉 Setup complete!');

    } catch (err) {
        console.error('❌ Error during setup:', err.message);
        if (err.message.includes('password authentication failed')) {
            console.log('\n⚠️ Authentication failed. Please update the password in the script or provide your Postgres password.');
        }
    }
}

setupDatabase();
