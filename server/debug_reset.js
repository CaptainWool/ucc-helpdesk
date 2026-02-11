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
        pass: process.env.EMAIL_PASS.replace(/\s+/g, '') // Stripping spaces
    }
});

async function testSystem() {
    console.log('--- DIAGNOSTIC START ---');
    console.log('Checking Environment Variables...');
    if (!process.env.EMAIL_USER) console.error('❌ EMAIL_USER missing');
    else console.log('✅ EMAIL_USER found:', process.env.EMAIL_USER);

    if (!process.env.EMAIL_PASS) console.error('❌ EMAIL_PASS missing');
    else console.log('✅ EMAIL_PASS found (length):', process.env.EMAIL_PASS.length);

    console.log('\nChecking Database Table...');
    try {
        const client = await pool.connect();
        const res = await client.query("SELECT to_regclass('public.password_reset_tokens')");
        if (res.rows[0].to_regclass) {
            console.log('✅ Table password_reset_tokens exists');
        } else {
            console.error('❌ Table password_reset_tokens DOES NOT EXIST');
        }
        client.release();
    } catch (err) {
        console.error('❌ Database Error:', err.message);
    }

    console.log('\nChecking Email Connection...');
    console.log('Attempting verify()...');
    try {
        await transporter.verify();
        console.log('✅ SMTP Authenticated Successfully (Your credentials are correct)');
    } catch (err) {
        console.error('❌ SMTP Auth Failed:', err.message);
        console.log('\nPossible Fixes:');
        console.log('1. Ensure 2-Step Verification is enabled on Google account.');
        console.log('2. Ensure App Password is correct (try generating a new one).');
        pool.end();
        return;
    }

    console.log('\nAttempting to send test email...');
    try {
        const info = await transporter.sendMail({
            from: `"Test Bot" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to self
            subject: 'Diagnostic Test Email',
            text: 'If you see this, email sending works!'
        });
        console.log('✅ Test Email Sent! Message ID:', info.messageId);
    } catch (err) {
        console.error('❌ Send Mail Failed:', err.message);
    }

    console.log('--- DIAGNOSTIC END ---');
    pool.end();
}

testSystem();
