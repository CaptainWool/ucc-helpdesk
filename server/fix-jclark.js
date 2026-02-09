const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function run() {
    try {
        console.log('Fixing is_assigned flag for jclark319@ucc.edu.gh...');
        const res = await pool.query(
            "UPDATE users SET is_assigned = true WHERE email = 'jclark319@ucc.edu.gh' RETURNING email, role, is_assigned"
        );
        console.log('Updated:', res.rows[0]);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}
run();
