const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function setupTestUser() {
    const email = 'student@ucc.edu.gh';
    const password = 'israel_student';
    const fullName = 'Test Student';
    const studentId = 'UCC/STUD/0001';

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await pool.query(`
            INSERT INTO users (email, password_hash, full_name, student_id, role, department)
            VALUES ($1, $2, $3, $4, 'student', 'General')
            ON CONFLICT (email) DO UPDATE 
            SET password_hash = $2, full_name = $3, student_id = $4
        `, [email, hashedPassword, fullName, studentId]);

        console.log(`✅ Test user ${email} created/updated successfully.`);
    } catch (err) {
        console.error('❌ Failed to create test user:', err);
    } finally {
        await pool.end();
    }
}

setupTestUser();
