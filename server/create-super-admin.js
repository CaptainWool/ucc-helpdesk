const { Client } = require('pg');
require('dotenv').config();

// Usage: node server/create-super-admin.js <DB_CONNECTION_STRING> <USER_EMAIL>

const connectionString = process.argv[2];
const targetEmail = process.argv[3];

if (!connectionString || !targetEmail) {
    console.error('Usage: node server/create-super-admin.js <RENDER_DATABASE_URL> <YOUR_EMAIL>');
    console.error('Example: node server/create-super-admin.js postgres://user:pass@render.com/db myadmin@ucc.edu.gh');
    process.exit(1);
}

const client = new Client({
    connectionString: connectionString,
    ssl: {
        rejectUnauthorized: false
    }
});

async function run() {
    try {
        console.log(`Connecting to database...`);
        await client.connect();

        console.log(`Promoting user ${targetEmail} to Super Admin...`);

        // IMPORTANT: We must set both 'role' and 'is_assigned'
        // Simply setting role is not enough because the login check requires is_assigned=true for admins
        const result = await client.query(`
            UPDATE users 
            SET role = 'super_admin', 
                is_assigned = true,
                updated_at = NOW()
            WHERE email = $1 
            RETURNING id, full_name, role, is_assigned
        `, [targetEmail]);

        if (result.rows.length === 0) {
            console.error(`❌ User not found with email: ${targetEmail}`);
            console.error('Please make sure you have REGISTERED first on the website!');
        } else {
            const user = result.rows[0];
            console.log('✅ Success!');
            console.log(`User: ${user.full_name} (${targetEmail})`);
            console.log(`New Role: ${user.role}`);
            console.log(`Is Assigned: ${user.is_assigned}`);
            console.log('You can now log in as a Super Admin.');
        }

    } catch (err) {
        console.error('❌ Failed to update user:', err);
    } finally {
        await client.end();
    }
}

run();
