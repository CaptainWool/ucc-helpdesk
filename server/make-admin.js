const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function makeAdmin(email) {
    try {
        const result = await pool.query(
            "UPDATE users SET role = 'super_admin' WHERE email = $1 RETURNING id, email, role",
            [email]
        );

        if (result.rows.length === 0) {
            console.log(`User ${email} not found.`);
        } else {
            console.log(`Success: User ${email} is now an ${result.rows[0].role}.`);
        }
    } catch (err) {
        console.error('Error updating user:', err);
    } finally {
        await pool.end();
    }
}

makeAdmin('carefreechelsea5@ucc.edu.gh');
