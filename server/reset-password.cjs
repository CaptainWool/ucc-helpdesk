const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function reset() {
    try {
        const hashedPassword = await bcrypt.hash('israel_student', 10);
        const res = await pool.query(
            'UPDATE users SET password_hash = $1 WHERE email = $2',
            [hashedPassword, 'student@ucc.edu.gh']
        );
        if (res.rowCount > 0) {
            console.log('Successfully reset password for student@ucc.edu.gh');
        } else {
            console.log('User student@ucc.edu.gh not found. Creating user...');
            await pool.query(
                "INSERT INTO users (email, password_hash, full_name, role, student_id) VALUES ($1, $2, $3, $4, $5)",
                ['student@ucc.edu.gh', hashedPassword, 'Test Student', 'student', '1000001']
            );
            console.log('Created user student@ucc.edu.gh');
        }
    } catch (err) {
        console.error('Error resetting password:', err.message);
    } finally {
        await pool.end();
    }
}

reset();
