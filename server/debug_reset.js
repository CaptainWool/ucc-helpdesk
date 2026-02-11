const { Pool } = require('pg');
const nodemailer = require('nodemailer');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

async function testSystem() {
    console.log('--- DIAGNOSTIC START ---');

    // 1. Check Env Vars
    console.log('Checking Environment Variables...');
    if (!process.env.EMAIL_USER) console.error('❌ EMAIL_USER missing');
    else console.log('✅ EMAIL_USER found:', process.env.EMAIL_USER);

    if (!process.env.EMAIL_PASS) console.error('❌ EMAIL_PASS missing');
    else console.log('✅ EMAIL_PASS found (length):', process.env.EMAIL_PASS.length);

    // 2. Check Database Table
    console.log('\nChecking Database Table...');
    try {
        const client = await pool.connect();
        const res = await client.query("SELECT to_regclass('public.password_reset_tokens')");
        if (res.rows[0].to_regclass) {
            console.log('✅ Table password_reset_tokens exists');
        } else {
            console.error('❌ Table password_reset_tokens DOES NOT EXIST');
            console.log('Attempting to create table...');
            await client.query(`
                CREATE TABLE IF NOT EXISTS password_reset_tokens (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    email TEXT NOT NULL,
                    student_id TEXT NOT NULL,
                    token TEXT NOT NULL,
                    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
                    used BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Table created successfully');
        }
        client.release();
    } catch (err) {
        console.error('❌ Database Error:', err.message);
    }

    // 3. Check Email Connection
    console.log('\nChecking Email Connection...');
    try {
        await transporter.verify();
        console.log('✅ SMTP Connection Successful');
    } catch (err) {
        console.error('❌ SMTP Error:', err.message);
        console.error('   Hint: Check if App Password is correct and 2FA is enabled.');
    }

    console.log('--- DIAGNOSTIC END ---');
    pool.end();
}

testSystem();
