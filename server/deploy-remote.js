const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = process.argv[2];

if (!connectionString) {
    console.error('Usage: node server/deploy-remote.js <YOUR_RENDER_DATABASE_URL>');
    console.error('Example: node server/deploy-remote.js postgres://user:pass@host/dbname');
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false // Required for Render/some cloud providers
    }
});

async function deploy() {
    try {
        console.log('Connecting to remote database...');
        await client.connect();
        console.log('Connected successfully!');

        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Reading schema.sql...');
        console.log('Executing schema on remote database...');

        // Split by semicolon to run statements individually if needed, 
        // but pg driver can often handle multiple statements.
        // For safety/simplicity in this specific schema, running as one block is usually fine 
        // but let's just run it.
        await client.query(schemaSql);

        console.log('✅ Database schema deployed successfully!');
        console.log('Your production database is now ready.');
    } catch (err) {
        console.error('❌ Deployment failed:', err);
    } finally {
        await client.end();
    }
}

deploy();
