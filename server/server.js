const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const sgMail = require('@sendgrid/mail');
const compression = require('compression');
const helmet = require('helmet');
require('dotenv').config();
const logger = require('./logger');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: false, // Allow cross-origin images (avatars/attachments)
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
}));
app.use(compression()); // Compress all responses
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Optimized Static Serving with Caching
app.use('/uploads', express.static('uploads', {
    maxAge: '1d', // Cache uploads for 1 day
    immutable: true
}));

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to sit idle before being closed
    connectionTimeoutMillis: 2000, // How long to wait for a connection
});

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
    logger.warn('SENDGRID_API_KEY is not defined in environment variables. Email sending will fail.');
}

const sendResetEmail = async (email, token, fullName) => {
    try {
        const fromEmail = process.env.SENDGRID_FROM_EMAIL;
        const msg = {
            to: email,
            from: {
                email: fromEmail,
                name: 'UCC CoDE Helpdesk'
            },
            subject: 'Password Reset Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #1e40af; margin-bottom: 20px;">Password Reset Request</h2>
                        <p>Hello ${fullName || 'Student'},</p>
                        <p>You requested to reset your password. Use the verification code below:</p>
                        <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; text-align: center; margin: 25px 0;">
                            <h1 style="color: #1e40af; font-size: 32px; letter-spacing: 8px; margin: 0;">${token}</h1>
                        </div>
                        <p style="color: #64748b; font-size: 14px;">This code will expire in <strong>15 minutes</strong>.</p>
                        <p style="color: #64748b; font-size: 14px;">If you didn't request this, please ignore this email.</p>
                        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                        <p style="color: #94a3b8; font-size: 12px; text-align: center;">
                            UCC CoDE Helpdesk Platform<br>
                            University of Cape Coast
                        </p>
                    </div>
                </div>
            `
        };
        await sgMail.send(msg);
        logger.info(`Reset email sent to ${email}`);
    } catch (err) {
        logger.error('SendGrid Error (Reset): ' + err.message);
    }
};


const sendTicketConfirmationEmail = async (email, ticket) => {
    try {
        const fromEmail = process.env.SENDGRID_FROM_EMAIL;
        const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const msg = {
            to: email,
            from: {
                email: fromEmail,
                name: 'UCC CoDE Helpdesk'
            },
            subject: `Ticket Received: ${ticket.subject} [#${ticket.id.substring(0, 8)}]`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #1e40af; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Support Request Received</h1>
                    </div>
                    <div style="padding: 30px; line-height: 1.6; color: #334155;">
                        <p>Hello <strong>${ticket.full_name}</strong>,</p>
                        <p>Your support ticket has been successfully submitted and received by the UCC CoDE Helpdesk team.</p>
                        
                        <div style="background-color: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #e2e8f0;">
                            <p style="margin: 0; color: #1e40af; font-weight: bold;">Ticket Details:</p>
                            <p style="margin: 10px 0 5px 0;"><strong>Ticket ID:</strong> #${ticket.id.substring(0, 8)}</p>
                            <p style="margin: 5px 0;"><strong>Subject:</strong> ${ticket.subject}</p>
                            <p style="margin: 5px 0;"><strong>Priority:</strong> ${ticket.priority}</p>
                            <p style="margin: 5px 0;"><strong>Estimated Resolution:</strong> 24 hour response window</p>
                        </div>

                        <p>Our support team will review your request and get back to you soon. You can track your ticket status anytime using the portal.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${appUrl}/track-ticket" style="background-color: #2563eb; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Track My Ticket</a>
                        </div>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
                        &copy; ${new Date().getFullYear()} University of Cape Coast (CoDE) Helpdesk.<br>
                        This is an automated message, please do not reply.
                    </div>
                </div>
            `
        };
        await sgMail.send(msg);
        logger.info(`Confirmation email sent to ${email}`);
    } catch (err) {
        logger.error('SendGrid Error (Confirmation): ' + err.message);
    }
};

const sendTicketResolutionEmail = async (email, ticket) => {
    try {
        const fromEmail = process.env.SENDGRID_FROM_EMAIL;
        const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const msg = {
            to: email,
            from: {
                email: fromEmail,
                name: 'UCC CoDE Helpdesk'
            },
            subject: `Ticket RESOLVED: ${ticket.subject} [#${ticket.id.substring(0, 8)}]`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
                    <div style="background-color: #10b981; padding: 20px; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">Support Request Resolved</h1>
                    </div>
                    <div style="padding: 30px; line-height: 1.6; color: #334155;">
                        <p>Hello <strong>${ticket.full_name}</strong>,</p>
                        <p>Great news! Your support ticket has been marked as <strong>RESOLVED</strong> by our team.</p>
                        
                        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #bbf7d0;">
                            <p style="margin: 0; color: #15803d; font-weight: bold;">Ticket Summary:</p>
                            <p style="margin: 10px 0 5px 0;"><strong>Ticket ID:</strong> #${ticket.id.substring(0, 8)}</p>
                            <p style="margin: 5px 0;"><strong>Subject:</strong> ${ticket.subject}</p>
                            <p style="margin: 5px 0;"><strong>Status:</strong> Resolved</p>
                        </div>

                        <p>Please log in to the portal to view the solution and provide your feedback. If you feel the issue hasn't been fully resolved, you can reopen it by replying to the thread.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${appUrl}/track-ticket" style="background-color: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Resolution</a>
                        </div>
                    </div>
                    <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #64748b;">
                        &copy; ${new Date().getFullYear()} University of Cape Coast (CoDE) Helpdesk.<br>
                        Thank you for using our student support services!
                    </div>
                </div>
            `
        };
        await sgMail.send(msg);
        logger.info(`Resolution email sent to ${email}`);
    } catch (err) {
        logger.error('SendGrid Error (Resolution): ' + err.message);
    }
};




// --- Auto-Initialize Database Schema ---
const initDb = async () => {
    logger.info('Checking database schema synchronization...');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Ensure Extensions
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

        // Create Users Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users(
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'student' CHECK(role IN('student', 'agent', 'super_admin')),
        full_name TEXT,
        student_id TEXT,
        staff_id TEXT,
        phone_number TEXT,
        level TEXT,
        programme TEXT,
        avatar_url TEXT,
        department VARCHAR(50) DEFAULT 'general',
        expertise TEXT,
        is_assigned BOOLEAN DEFAULT false,
        has_completed_tour BOOLEAN DEFAULT false,
        is_banned BOOLEAN DEFAULT false,
        ban_expires_at TIMESTAMP WITH TIME ZONE,
        revoked_at TIMESTAMP WITH TIME ZONE,
        revocation_reason TEXT,
        plaintext_password TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
    `);

        // Ensure new columns for existing tables (Defensive Migration)
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS plaintext_password TEXT');

        // Defensive Migrations for Tickets table (relaxing constraints for new UI)
        try {
            await client.query('ALTER TABLE tickets ALTER COLUMN type TYPE TEXT');
            await client.query('ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_type_check');
            await client.query('ALTER TABLE tickets ALTER COLUMN status TYPE TEXT');
            await client.query('ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_status_check');
            await client.query('ALTER TABLE tickets ALTER COLUMN priority TYPE TEXT');
            await client.query('ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_priority_check');
        } catch (migErr) {
            logger.warn('Defensive ticket migration skipped/warning: ' + migErr.message);
        }

        // Create Tickets Table (with all compatibility columns)
        await client.query(`
            CREATE TABLE IF NOT EXISTS tickets(
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        email TEXT NOT NULL,
        student_id TEXT,
        student_id_ref UUID,
        phone_number TEXT,
        full_name TEXT NOT NULL,
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'Open',
        priority TEXT DEFAULT 'Medium',
        attachment_url TEXT,
        assigned_to_email TEXT,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        feedback_comment TEXT,
        sla_deadline TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP WITH TIME ZONE
    )
    `);

        // Create Messages Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS messages(
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
        sender_role VARCHAR(20) NOT NULL CHECK(sender_role IN('student', 'admin', 'agent')),
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
    `);

        // Create Settings Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS system_settings(
        key TEXT PRIMARY KEY,
        value JSONB NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
    `);

        // Create FAQs Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS faqs(
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category TEXT NOT NULL,
        helpful_count INTEGER DEFAULT 0,
        unhelpful_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
    `);

        // Create Audit Logs Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS audit_logs(
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
        action TEXT NOT NULL,
        target_type TEXT,
        target_id TEXT,
        details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
    `);

        // Create Password Reset Tokens Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS password_reset_tokens(
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        email TEXT NOT NULL,
        student_id TEXT NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
        `);

        // Optimized Indexes for performance
        await client.query('CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_tickets_assigned_email ON tickets(assigned_to_email)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON messages(ticket_id)');

        // Seed Initial Settings
        const settingsToSeed = [
            ['maintenance_mode', false],
            ['submissions_locked', false],
            ['showHeaderSubmit', true],
            ['showHeaderFAQ', true],
            ['max_open_tickets', 100],
            ['ai_sensitivity', 0.7],
            ['sla_peak_mode', false],
            ['sms_notifications_enabled', true],
            ['global_announcement', { enabled: false, message: '', type: 'info' }],
            ['resource_limits', { max_size_mb: 5, allowed_types: ['image/jpeg', 'image/png', 'application/pdf'] }],
            ['housekeeping_rules', { enabled: false, auto_close_resolved_days: 30 }],
            ['command_center_password', 'israel@40']
        ];

        for (const [key, val] of settingsToSeed) {
            await client.query(
                'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
                [key, JSON.stringify(val)]
            );
        }

        // Seed Initial FAQs
        const faqsToSeed = [
            // Portal & Registration
            { category: 'Student Portal & Registration', question: 'I cannot log in to my portal. What should I do?', answer: 'First, ensure you are using your correct Student ID and password. If you have forgotten your password, use the "Forgot Password" link on the portal login page. If the issue persists, submit a ticket here with "Portal / Login Issue" as the type.' },
            { category: 'Student Portal & Registration', question: 'How do I register my courses for the semester?', answer: 'Log in to your portal, navigate to "Course Registration," select the appropriate semester, and follow the prompts. Ensure you click "Submit" at the end to confirm your registration.' },
            { category: 'Student Portal & Registration', question: 'My courses are not showing up after registration.', answer: 'Course registration can take up to 24 hours to reflect in all systems. If you just registered, please wait. If it has been longer than 24 hours, check with your department coordinator or submit a ticket.' },

            // Fees & Payments
            { category: 'Fees & Payments', question: 'Which banks are authorized for UCC fee payments?', answer: 'Authorized banks include Prudential Bank, Zenith Bank, Consolidated Bank Ghana (CBG), and GCB Bank. Always use your Student ID as the reference on the deposit slip.' },
            { category: 'Fees & Payments', question: 'I paid my fees but it is not reflecting on my portal.', answer: 'Fee payments at authorized banks are usually updated within 24 hours. If it has been longer, please submit a ticket and include a clear photo of your bank receipt and your student ID.' },
            { category: 'Fees & Payments', question: 'Are there deadlines for fee payments?', answer: 'Yes. Students are generally required to pay at least 50% of fees to register for the semester and 100% to sit for examinations. Check the UCC Academic Calendar for specific dates.' },

            // Academic & CoDE
            { category: 'Academic & CoDE Specific', question: 'How do I handle an "IC" (Incomplete) grade?', answer: 'An "IC" grade usually means a component of your assessment (either CA or Exam) is missing. Report this immediately to your regional or study center coordinator, or submit a ticket with your index number and the course code.' },
            { category: 'Academic & CoDE Specific', question: 'Where can I access my study modules?', answer: 'Hard copies of modules are distributed at your study centers. Electronic versions (E-Modules) are available on the UCC Learning Management System (LMS) and the CoDE official app.' },
            { category: 'Academic & CoDE Specific', question: 'How can I change my study center?', answer: 'To change your study center, you must submit a formal application through your current regional office to the Director of CoDE. This process is typically handled before the start of a new semester.' },
            { category: 'Academic & CoDE Specific', question: 'How do I check my GPA/Results?', answer: 'Your semester results and cumulative GPA are available on your Student Portal under the "Academic Results" or "Statement of Result" tab.' },

            // ID Cards & Certificates
            { category: 'ID Cards & Certificates', question: 'I have not received my Student ID card. What should I do?', answer: 'ID cards are usually distributed through the regional offices. If you are a new student and yours is not ready, ensure you have uploaded a proper passport-sized photo on your portal. For replacements, a processing fee applies.' }
        ];

        for (const faq of faqsToSeed) {
            await client.query(
                'INSERT INTO faqs (category, question, answer) SELECT $1, $2, $3 WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE question = $2)',
                [faq.category, faq.question, faq.answer]
            );
        }

        // --- NEW: Administrative Bootstrapping via Env Vars ---
        // 1. Promote Admin Email
        if (process.env.ADMIN_EMAIL) {
            const adminEmail = process.env.ADMIN_EMAIL.trim();
            const promoRes = await client.query(
                "UPDATE users SET role = 'super_admin', is_assigned = true WHERE email = $1 RETURNING id",
                [adminEmail]
            );
            if (promoRes.rowCount > 0) {
                console.log(`⭐ Successfully promoted ${adminEmail} to Super Admin via bootstrap.`);
            }
        }

        // 2. Forced Settings Override (e.g., '{"showHeaderSubmit": false}')
        if (process.env.FORCED_SETTINGS) {
            try {
                const forced = JSON.parse(process.env.FORCED_SETTINGS);
                for (const [key, val] of Object.entries(forced)) {
                    await client.query(
                        'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()',
                        [key, JSON.stringify(val)]
                    );
                }
                console.log('⚙️ Applied forced settings from environment variables.');
            } catch (err) {
                console.error('❌ Failed to parse FORCED_SETTINGS JSON:', err.message);
            }
        }

        await client.query('COMMIT');
        console.log('✅ Database synchronized successfully!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Database synchronization failed:', err);
        // Don't exit process, let the app try to run, but log heavily
    } finally {
        client.release();
    }
};

// SMS Utility (Africa's Talking)
const sendSMS = async (phoneNumber, message) => {
    try {
        const username = process.env.AT_USERNAME || 'sandbox';
        let apiKey = process.env.AT_API_KEY;
        const senderId = process.env.AT_SENDER_ID; // Optional

        if (!apiKey) {
            console.warn('⚠️ Africa\'s Talking API Key missing. Skipping SMS.');
            return;
        }

        // Clean phone number (Africa's Talking requires international format with +)
        let formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
        if (formattedNumber.startsWith('0')) {
            formattedNumber = '+233' + formattedNumber.substring(1);
        } else if (!formattedNumber.startsWith('+')) {
            formattedNumber = '+' + formattedNumber;
        }

        const params = new URLSearchParams();
        params.append('username', username);
        params.append('to', formattedNumber);
        params.append('message', message);
        if (senderId) params.append('from', senderId);

        const apiHost = username === 'sandbox' ? 'api.sandbox.africastalking.com' : 'api.africastalking.com';

        const response = await fetch(`https://${apiHost}/version1/messaging`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'apiKey': apiKey
            },
            body: params
        });

        const data = await response.json();

        if (data.SMSMessageData && data.SMSMessageData.Recipients) {
            const recipient = data.SMSMessageData.Recipients[0];
            if (recipient.status === 'Success' || recipient.status === 'Sent') {
                console.log(`✅ SMS Sent successfully to ${formattedNumber} (${username} mode).`);
            } else {
                console.error(`❌ Africa's Talking Error (${formattedNumber}): Status=${recipient.status}, Raw Response:`, JSON.stringify(data, null, 2));
            }
        } else {
            console.error('❌ Africa\'s Talking unexpected response:', data);
        }

        if (username === 'sandbox') {
            console.log('ℹ️ Sandbox Mode: View your message at https://simulator.africastalking.com/');
        }

        return data;
    } catch (err) {
        console.error('❌ SMS Utility Critical Failure:', err.message);
    }
};

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const logAudit = async (adminId, action, targetType, targetId, details) => {
    try {
        await pool.query(
            'INSERT INTO audit_logs (admin_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)',
            [adminId, action, targetType, targetId, JSON.stringify(details)]
        );
    } catch (err) {
        console.error('Audit log failed:', err);
    }
};

// Multer Configuration for profile pictures
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/avatars/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// Ensure upload directories exist
const fs = require('fs');
if (!fs.existsSync('uploads/avatars/')) {
    fs.mkdirSync('uploads/avatars/', { recursive: true });
}
if (!fs.existsSync('uploads/attachments/')) {
    fs.mkdirSync('uploads/attachments/', { recursive: true });
}

// Multer for attachments
const attachmentStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/attachments/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'attach-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const uploadAttachment = multer({
    storage: attachmentStorage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// --- Routes ---

app.get('/', (req, res) => {
    res.json({ message: 'UCC Helpdesk API is running', version: '1.0.0' });
});

// 1. Auth Routes
app.post('/api/auth/register', upload.single('avatar'), async (req, res) => {
    const { email, password, full_name, student_id, staff_id, phone_number, level, programme, role, department, expertise } = req.body;

    // Determine the role early to apply appropriate password policy
    let finalRole = role || 'student';

    // Server-side password complexity check - Different policies for students vs staff
    if (finalRole === 'student') {
        // Student policy: 8 chars, uppercase, lowercase, special (numbers optional)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                error: 'Password requirements not met',
                message: 'Password must be at least 8 characters long and contain uppercase, lowercase, and special characters.'
            });
        }
    } else {
        // Admin/Agent policy: 8 chars, uppercase, lowercase, numbers, special (strict)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                error: 'Password requirements not met',
                message: 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers, and special characters.'
            });
        }
    }

    const avatar_url = req.file ? `/uploads/avatars/${req.file.filename}` : null;

    try {
        // Check if user already exists
        const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: 'This email is already registered. Please login or use a different email.' });
        }
        // SECURITY: Role assignment restriction - use finalRole determined above

        // If a privileged role is requested, it MUST be by an authenticated super_admin
        if (finalRole === 'agent' || finalRole === 'super_admin') {
            const authHeader = req.headers['authorization'];
            const token = authHeader && authHeader.split(' ')[1];

            if (!token) {
                return res.status(403).json({
                    error: 'Unauthorized',
                    message: 'Admin/Agent accounts must be assigned by a Super Admin only.'
                });
            }

            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded.role !== 'super_admin') {
                    return res.status(403).json({
                        error: 'Unauthorized',
                        message: 'Only Super Admins can create administrative accounts.'
                    });
                }
            } catch (err) {
                return res.status(401).json({ error: 'Invalid token' });
            }
        } else {
            // Default any other attempt to student
            finalRole = 'student';
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // Tag as assigned if created by a super_admin (which is the only way to get agent role now)
        const isAssigned = (finalRole === 'agent' || finalRole === 'super_admin');

        // Save plaintext password ONLY for staff created by Super Admin to allow recovery
        const savedPlainText = isAssigned ? password : null;

        const result = await pool.query(
            'INSERT INTO users (email, password_hash, full_name, student_id, staff_id, phone_number, level, programme, role, department, expertise, avatar_url, is_assigned, plaintext_password) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id, email, role, full_name, student_id, staff_id, phone_number, level, programme, department, expertise, avatar_url, is_assigned, has_completed_tour, plaintext_password',
            [email, hashedPassword, full_name, student_id || null, staff_id || null, phone_number, level || null, programme || null, finalRole, department || 'general', expertise || null, avatar_url, isAssigned, savedPlainText]
        );
        const user = result.rows[0];
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
        res.json({ token, user });
    } catch (err) {
        console.error('Registration error:', err);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: err.message || 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) return res.status(401).json({ error: 'User not found' });

        // Check if account is revoked
        if (user.revoked_at) {
            return res.status(403).json({
                error: 'Account Revoked',
                message: `Your account was permanently revoked on ${new Date(user.revoked_at).toLocaleDateString()}.Reason: ${user.revocation_reason || 'No reason provided.'} `
            });
        }

        // SECURITY: Restrict Agent/Admin login to only those explicitly created/assigned by Super Admin
        if ((user.role === 'agent' || user.role === 'super_admin') && !user.is_assigned) {
            return res.status(403).json({
                error: 'Access Restricted',
                message: 'This administrative account has not been formally assigned by a Super Admin and is restricted from logging in.'
            });
        }

        // Check if account is banned
        if (user.is_banned) {
            if (!user.ban_expires_at || new Date(user.ban_expires_at) > new Date()) {
                const expires = user.ban_expires_at ? `until ${new Date(user.ban_expires_at).toLocaleString()} ` : 'indefinitely';
                return res.status(403).json({
                    error: 'Account Banned',
                    message: `Your account is temporarily banned ${expires} due to misconduct.`
                });
            }
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) return res.status(401).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET);
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                full_name: user.full_name,
                student_id: user.student_id,
                staff_id: user.staff_id,
                phone_number: user.phone_number,
                level: user.level,
                programme: user.programme,
                department: user.department,
                expertise: user.expertise,
                avatar_url: user.avatar_url,
                has_completed_tour: user.has_completed_tour
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Step 1: Request Password Reset Token
app.post('/api/auth/request-reset', async (req, res) => {
    const { email, student_id } = req.body;
    try {
        // Verify user exists
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ error: 'No account found with this email address.' });
        }

        // Verify student_id matches the email
        if (user.student_id !== student_id) {
            return res.status(401).json({ error: 'The email and Student ID do not match our records. Please verify your information.' });
        }

        // Generate 6-digit token
        const token = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

        // Delete any existing tokens for this email (prevent token flooding)
        await pool.query('DELETE FROM password_reset_tokens WHERE email = $1', [email]);

        // Store token in database
        await pool.query(
            'INSERT INTO password_reset_tokens (email, student_id, token, expires_at) VALUES ($1, $2, $3, $4)',
            [email, student_id, token, expiresAt]
        );

        // Send email with token
        await sendResetEmail(email, token, user.full_name);

        res.json({
            message: 'Verification code sent to your email. Please check your inbox.',
            success: true
        });
    } catch (err) {
        console.error('Password reset request error:', err);
        res.status(500).json({ error: 'Failed to process reset request. Please try again.' });
    }
});

// Step 2: Verify Reset Token
app.post('/api/auth/verify-reset-token', async (req, res) => {
    const { email, token } = req.body;
    try {
        const result = await pool.query(
            'SELECT * FROM password_reset_tokens WHERE email = $1 AND token = $2 AND used = FALSE AND expires_at > NOW()',
            [email, token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired verification code. Please request a new one.' });
        }

        res.json({ success: true, message: 'Token verified successfully.' });
    } catch (err) {
        console.error('Token verification error:', err);
        res.status(500).json({ error: 'Failed to verify token.' });
    }
});

// Step 3: Complete Password Reset
app.post('/api/auth/complete-reset', async (req, res) => {
    const { email, token, new_password } = req.body;
    try {
        // Verify token is still valid
        const tokenResult = await pool.query(
            'SELECT * FROM password_reset_tokens WHERE email = $1 AND token = $2 AND used = FALSE AND expires_at > NOW()',
            [email, token]
        );

        if (tokenResult.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired verification code.' });
        }

        // Apply student password policy (numbers optional)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
        if (!passwordRegex.test(new_password)) {
            return res.status(400).json({
                error: 'Password requirements not met',
                message: 'Password must be at least 8 characters long and contain uppercase, lowercase, and special characters.'
            });
        }

        // Get user to update password
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = userResult.rows[0];

        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Hash and update password
        const hashedPassword = await bcrypt.hash(new_password, 10);
        await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, user.id]);

        // Mark token as used
        await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE email = $1 AND token = $2', [email, token]);

        res.json({ message: 'Password reset successful. You can now login with your new password.', success: true });
    } catch (err) {
        console.error('Password reset completion error:', err);
        res.status(500).json({ error: 'Failed to reset password. Please try again.' });
    }
});

// Diagnostic Endpoint (TEMPORARY)
app.get('/api/system/diagnose-email', async (req, res) => {
    const report = {
        env: {
            sendgrid_key_configured: !!process.env.SENDGRID_API_KEY,
            sendgrid_from_configured: !!process.env.SENDGRID_FROM_EMAIL,
            from_email: process.env.SENDGRID_FROM_EMAIL
        },
        database: {},
        sendgrid: {}
    };

    try {
        // Check DB Table
        const tableCheck = await pool.query("SELECT to_regclass('public.password_reset_tokens')");
        report.database.table_exists = !!tableCheck.rows[0].to_regclass;

        if (!report.database.table_exists) {
            // Attempt to create table
            await pool.query(`
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
            report.database.table_created = true;
        }

        // Check SendGrid key format
        if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_API_KEY.startsWith('SG.')) {
            report.sendgrid.status = 'configured_correctly';
        } else {
            report.sendgrid.status = 'invalid_key_format';
        }

        // --- NEW: Check SMS Configuration ---
        report.sms = {
            provider: 'Africa\'s Talking',
            username_configured: !!process.env.AT_USERNAME,
            api_key_configured: !!process.env.AT_API_KEY,
            sender_id_configured: !!process.env.AT_SENDER_ID,
            current_username: process.env.AT_USERNAME || 'sandbox (Default)',
            current_sender_id: process.env.AT_SENDER_ID || 'None'
        };

        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message, report });
    }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, role, full_name, student_id, staff_id, phone_number, level, programme, department, expertise, avatar_url, has_completed_tour FROM users WHERE id = $1', [req.user.id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// 1b. User Routes
app.get('/api/users', authenticateToken, async (req, res) => {
    const { role, email } = req.query;
    try {
        let query = 'SELECT id, email, role, full_name, student_id, staff_id, department, expertise, is_banned, ban_expires_at, revoked_at, revocation_reason, plaintext_password FROM users';
        let params = [];
        let conditions = [];

        if (req.user.role === 'student' && !email) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        if (role) {
            const roles = role.split(',');
            conditions.push('role = ANY($' + (params.length + 1) + ')');
            params.push(roles);
        }

        if (email) {
            conditions.push('email = $' + (params.length + 1));
            params.push(email);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const updates = req.body; // e.g. department, role

    if (req.user.role !== 'super_admin' && req.user.id !== id) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    // SECURITY: Role updates only by super_admin
    if (updates.role && req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only Super Admins can change account roles.' });
    }

    try {
        const fields = Object.keys(updates);
        const allowedColumns = ['full_name', 'student_id', 'staff_id', 'phone_number', 'level', 'programme', 'department', 'expertise', 'avatar_url', 'has_completed_tour', 'role', 'is_banned', 'ban_expires_at', 'revoked_at', 'revocation_reason'];

        // Filter out any keys that are not allowed columns
        const validFields = fields.filter(f => allowedColumns.includes(f));

        if (validFields.length === 0) {
            return res.status(400).json({ error: 'No valid fields provided for update' });
        }

        const validValues = validFields.map(f => updates[f]);
        const setClause = validFields.map((f, i) => `${f} = $${i + 2} `).join(', ');

        const result = await pool.query(`UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING * `, [id, ...validValues]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Update failed' });
    }
});

app.post('/api/users/:id/avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    const { id } = req.params;
    if (req.user.id !== id && req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Forbidden' });
    }
    if (!req.file) {
        return res.status(400).json({ error: 'No avatar image provided' });
    }
    const avatar_url = `/uploads/avatars/${req.file.filename}`;
    try {
        await pool.query('UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2', [avatar_url, id]);
        res.json({ success: true, avatar_url });
    } catch (err) {
        console.error('Avatar update failed:', err);
        res.status(500).json({ error: 'Failed to update avatar' });
    }
});

// 1c. Command Center Routes (Admin Only)
app.get('/api/settings', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM system_settings');
        const settings = {};
        result.rows.forEach(row => {
            settings[row.key] = row.value;
        });
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

app.post('/api/settings', authenticateToken, async (req, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Unauthorized' });
    const { key, value } = req.body;
    try {
        await pool.query('INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()', [key, JSON.stringify(value)]);

        await logAudit(req.user.id, 'update_setting', 'system_settings', key, { new_value: value });

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update settings' });
    }
});

app.post('/api/users/:id/moderate', authenticateToken, async (req, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { is_banned, ban_expires_at, revoked_at, revocation_reason } = req.body;

    try {
        const result = await pool.query(
            'UPDATE users SET is_banned = $1, ban_expires_at = $2, revoked_at = $3, revocation_reason = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
            [is_banned, ban_expires_at || null, revoked_at || null, revocation_reason || null, id]
        );

        const action = revoked_at ? 'revoke_user' : (is_banned ? 'ban_user' : 'unban_user');
        await logAudit(req.user.id, action, 'users', id, { ban_expires_at, revocation_reason });

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Moderation failed' });
    }
});

app.get('/api/audit-logs', authenticateToken, async (req, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Unauthorized' });
    try {
        const result = await pool.query(`
            SELECT a.*, u.full_name as admin_name, u.email as admin_email 
            FROM audit_logs a 
            LEFT JOIN users u ON a.admin_id = u.id 
            ORDER BY a.created_at DESC 
            LIMIT 100
    `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

app.post('/api/system/cleanup', authenticateToken, async (req, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Unauthorized' });
    try {
        const settingsRes = await pool.query("SELECT value FROM system_settings WHERE key = 'housekeeping_rules'");
        const rules = settingsRes.rows[0]?.value || { auto_close_resolved_days: 30 };

        const result = await pool.query(`
            UPDATE tickets 
            SET status = 'Closed', updated_at = NOW() 
            WHERE status = 'Resolved' 
            AND resolved_at < NOW() - ($1 || ' days'):: interval
            RETURNING id
        `, [rules.auto_close_resolved_days]);

        await logAudit(req.user.id, 'manual_cleanup', 'system', null, { tickets_closed: result.rowCount, days_threshold: rules.auto_close_resolved_days });

        res.json({ message: `Successfully closed ${result.rowCount} tickets.`, count: result.rowCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Cleanup failed' });
    }
});

// 2. Tickets Routes
app.get('/api/tickets', authenticateToken, async (req, res) => {
    try {
        let query = 'SELECT * FROM tickets ORDER BY created_at DESC';
        let params = [];

        console.log(`[DIAGNOSTIC] Fetching tickets for user: ${req.user.id}, Role: ${req.user.role}`);

        // Role-based ticket visibility
        if (req.user.role === 'student') {
            // Students see only their own tickets
            // Use explicit casting and case-insensitive email matching for reliability
            query = 'SELECT * FROM tickets WHERE user_id::text = $1 OR LOWER(email) = (SELECT LOWER(email) FROM users WHERE id::text = $1) ORDER BY created_at DESC';
            params = [req.user.id];
        } else if (req.user.role === 'agent') {
            // Agents (Coordinators) see tickets assigned to them OR completely unassigned tickets
            // We use subquery to get the agent's email for comparison
            query = 'SELECT * FROM tickets WHERE LOWER(assigned_to_email) = (SELECT LOWER(email) FROM users WHERE id::text = $1) OR assigned_to_email IS NULL OR assigned_to_email = \'\' ORDER BY created_at DESC';
            params = [req.user.id];
        }
        // Super Admins see all tickets (no filter needed)

        const result = await pool.query(query, params);
        console.log(`[DIAGNOSTIC] Found ${result.rowCount} tickets for ${req.user.role} ${req.user.id}`);
        res.json(result.rows);
    } catch (err) {
        console.error('Ticket fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch tickets' });
    }
});

app.get('/api/tickets/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const ticket = result.rows[0];

        // Strict Authorization Check:
        // 1. Allow if user is an Admin or Agent
        // 2. Allow if user is the original submitter (matches email or user_id)
        const isOwner = ticket.user_id === req.user.id || ticket.email === req.user.email;
        const isAdminOrAgent = req.user.role === 'super_admin' || req.user.role === 'agent';

        if (!isOwner && !isAdminOrAgent) {
            return res.status(403).json({ error: 'Forbidden: You do not have permission to view this ticket.' });
        }

        res.json(ticket);
    } catch (err) {
        console.error('Ticket fetch (detail) error:', err);
        res.status(500).json({ error: 'Failed to fetch ticket details' });
    }
});

app.post('/api/tickets', [authenticateToken, uploadAttachment.array('attachments', 10)], async (req, res) => {
    const { full_name, email, student_id, phone_number, subject, description, type, priority } = req.body;

    let attachment_url = null;
    if (req.files && req.files.length > 0) {
        // Store as JSON array string to handle multiple files
        const paths = req.files.map(f => `/uploads/attachments/${f.filename}`);
        attachment_url = JSON.stringify(paths);
    }

    try {
        const user_id = req.user?.id;

        // --- NEW: Enforce Student Info Integrity ---
        // If logged in, prioritize official profile data over request body
        let finalFullName = full_name;
        let finalEmail = email;
        let finalStudentId = student_id;
        let finalPhoneNumber = phone_number;

        if (user_id) {
            const userRes = await pool.query('SELECT full_name, email, student_id, phone_number FROM users WHERE id::text = $1', [user_id]);
            const officialProfile = userRes.rows[0];
            if (officialProfile) {
                finalFullName = officialProfile.full_name || finalFullName || '';
                finalEmail = officialProfile.email || finalEmail || '';
                finalStudentId = officialProfile.student_id || finalStudentId || '';
                // Phone is more flexible, but we keep it if already set in profile
                finalPhoneNumber = officialProfile.phone_number || finalPhoneNumber || '';
            }
        }

        // --- NEW: Sanity Check ---
        if (!finalEmail || !finalFullName) {
            return res.status(400).json({ error: 'Incomplete user profile. Please ensure name and email are set before submitting.' });
        }

        // 1. Check Global Locks
        const settingsRes = await pool.query('SELECT * FROM system_settings');
        const settings = {};
        settingsRes.rows.forEach(r => settings[r.key] = r.value);

        if (settings.maintenance_mode === true || settings.maintenance_mode === 'true') {
            return res.status(503).json({ error: 'Maintenance Mode', message: 'The helpdesk is currently undergoing maintenance. Please try again later.' });
        }

        if (settings.submissions_locked === true || settings.submissions_locked === 'true') {
            return res.status(403).json({ error: 'Submissions Locked', message: 'New ticket submissions are currently disabled by the administrator.' });
        }

        // 2. Check User Status if logged in
        if (user_id) {
            const userRes = await pool.query('SELECT is_banned, ban_expires_at, revoked_at FROM users WHERE id = $1', [user_id]);
            const user = userRes.rows[0];

            if (user?.revoked_at) {
                return res.status(403).json({ error: 'Account Revoked', message: 'Your account has been revoked. You can no longer submit tickets.' });
            }

            if (user?.is_banned) {
                if (!user.ban_expires_at || new Date(user.ban_expires_at) > new Date()) {
                    return res.status(403).json({ error: 'Account Banned', message: 'Misconduct detected. Your submission rights have been suspended.' });
                }
            }
        }

        // 3. Check Capacity (Queue Control)
        if (settings.max_open_tickets) {
            const countRes = await pool.query("SELECT COUNT(*) FROM tickets WHERE status IN ('Open', 'In Progress')");
            const currentCount = parseInt(countRes.rows[0].count);
            if (currentCount >= parseInt(settings.max_open_tickets)) {
                return res.status(429).json({
                    error: 'System at Capacity',
                    message: `Our current support queue is full(max ${settings.max_open_tickets} active requests).Please check our FAQ or try again later.`
                });
            }
        }

        // 4. Resource Filter (File size & type)
        if (req.files && req.files.length > 0 && settings.resource_limits) {
            const limits = settings.resource_limits;

            for (const file of req.files) {
                const sizeMB = file.size / (1024 * 1024);
                if (sizeMB > limits.max_size_mb) {
                    return res.status(400).json({ error: 'File too large', message: `One of your attachments exceeds the maximum allowed size of ${limits.max_size_mb} MB.` });
                }

                if (limits.allowed_types && !limits.allowed_types.includes(file.mimetype)) {
                    return res.status(400).json({ error: 'Unsupported file type', message: `Only the following formats are allowed: ${limits.allowed_types.join(', ')}` });
                }
            }
        }

        // 5. AI Auto-Prioritization (Simulated)
        let finalPriority = priority || 'Medium';
        if (!priority) {
            const sensitivity = parseFloat(settings.ai_sensitivity || 0.7);
            const urgentKeywords = ['urgent', 'emergency', 'broken', 'cannot', 'blocked', 'fail', 'error'];
            const content = `${subject} ${description} `.toLowerCase();
            const keywordScore = urgentKeywords.filter(k => content.includes(k)).length;

            // Higher sensitivity or more keywords increases chance of Urgent/High
            if (keywordScore * sensitivity >= 1.5) {
                finalPriority = 'Urgent';
            } else if (keywordScore * sensitivity >= 0.8) {
                finalPriority = 'High';
            }
        }

        const getSLADeadline = (prio) => {
            let hours = prio === 'Urgent' ? 4 : prio === 'High' ? 24 : prio === 'Low' ? 72 : 48;

            // Peak Mode: Double SLA hours
            if (settings.sla_peak_mode === true || settings.sla_peak_mode === 'true') {
                hours *= 2;
            }

            const deadline = new Date();
            deadline.setHours(deadline.getHours() + hours);
            return deadline;
        };

        const sla_deadline = getSLADeadline(finalPriority);

        const result = await pool.query(
            'INSERT INTO tickets (full_name, email, student_id, phone_number, subject, description, type, priority, user_id, sla_deadline, attachment_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
            [finalFullName, finalEmail, finalStudentId, finalPhoneNumber, subject, description, type, finalPriority, user_id, sla_deadline, attachment_url]
        );

        // SMS Notification for new ticket
        if (settings.sms_notifications_enabled && finalPhoneNumber) {
            const smsMessage = `Hi ${finalFullName}, your UCC Helpdesk ticket (#${result.rows[0].id.substring(0, 8)}) has been received. Subject: ${subject}. We'll resolve it soon!`;
            sendSMS(finalPhoneNumber, smsMessage);
        }

        // Email Notification for new ticket
        sendTicketConfirmationEmail(finalEmail, result.rows[0]);

        res.json(result.rows[0]);
    } catch (err) {
        console.error('Ticket creation error:', err);
        res.status(500).json({
            error: 'Ticket creation failed',
            message: err.message,
            detail: err.detail
        });
    }
});

app.put('/api/tickets/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const updates = { ...req.body };

    try {
        // Fetch settings if needed for SLA Peak Mode
        const settingsRes = await pool.query('SELECT * FROM system_settings');
        const settings = {};
        settingsRes.rows.forEach(r => settings[r.key] = r.value);

        // Recalculate SLA if priority changes
        if (updates.priority) {
            const getSLADeadline = (prio) => {
                let hours = prio === 'Urgent' ? 4 : prio === 'High' ? 24 : prio === 'Low' ? 72 : 48;

                if (settings.sla_peak_mode === true || settings.sla_peak_mode === 'true') {
                    hours *= 2;
                }

                const deadline = new Date();
                deadline.setHours(deadline.getHours() + hours);
                return deadline;
            };
            updates.sla_deadline = getSLADeadline(updates.priority);
        }

        // Set resolved_at if status becomes 'Resolved'
        if (updates.status) {
            if (updates.status === 'Resolved') {
                updates.resolved_at = new Date();
            } else {
                updates.resolved_at = null;
            }
        }

        // Construct dynamic update query
        // Whitelist allowed columns to prevent SQL injection via keys
        const fields = Object.keys(updates);
        const allowedColumns = ['subject', 'description', 'type', 'priority', 'status', 'assigned_to_email', 'rating', 'feedback_comment', 'sla_deadline', 'resolved_at', 'attachment_url'];

        const validFields = fields.filter(f => allowedColumns.includes(f));

        if (validFields.length === 0) {
            return res.json({ message: 'No valid updates provided' });
        }

        const validValues = validFields.map(f => updates[f]);
        const setClause = validFields.map((f, i) => `${f} = $${i + 2}`).join(', ');

        // Check permissions (Admin/Agent only for status/assignment usually)
        if (req.user.role === 'student' && (updates.status || updates.assigned_to_email || updates.priority)) {
            return res.status(403).json({ error: 'Students cannot update protected fields' });
        }

        const result = await pool.query(`UPDATE tickets SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`, [id, ...validValues]);
        const updatedTicket = result.rows[0];

        // SMS Notification for resolution
        if (settings.sms_notifications_enabled && updates.status === 'Resolved' && updatedTicket.phone_number) {
            const smsMessage = `Great news ${updatedTicket.full_name}! Your ticket "${updatedTicket.subject}" has been RESOLVED. Please log in to check the solution.`;
            sendSMS(updatedTicket.phone_number, smsMessage);
        }

        // Email Notification for resolution
        if (updates.status === 'Resolved') {
            sendTicketResolutionEmail(updatedTicket.email, updatedTicket);
        }

        res.json(updatedTicket);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Update failed' });
    }
});

app.delete('/api/tickets/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        // Only allow admins or agents to delete tickets
        if (req.user.role !== 'super_admin' && req.user.role !== 'agent') {
            return res.status(403).json({ error: 'Permission denied' });
        }

        // Optional: delete related messages first (though DB has ON DELETE CASCADE, this is safer)
        await pool.query('DELETE FROM messages WHERE ticket_id = $1::uuid', [id]);

        const result = await pool.query('DELETE FROM tickets WHERE id = $1::uuid RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        // Log the action for security audit
        await logAudit(req.user.id, 'delete_ticket', 'tickets', id, { ticket_subject: result.rows[0].subject });

        res.json({ message: 'Ticket deleted successfully', ticket: result.rows[0] });
    } catch (err) {
        console.error('Delete error:', err);
        res.status(500).json({ error: 'Delete failed', details: err.message });
    }
});

// 3. Messages Routes
app.get('/api/tickets/:id/messages', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM messages WHERE ticket_id = $1 ORDER BY created_at ASC', [id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

app.post('/api/tickets/:id/messages', async (req, res) => {
    const { id } = req.params;
    const { content, sender_role } = req.body;
    // sender_id optional if anonymous
    let sender_id = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        const decoded = jwt.decode(authHeader.split(' ')[1]);
        if (decoded) sender_id = decoded.id;
    }

    try {
        const result = await pool.query(
            'INSERT INTO messages (ticket_id, content, sender_role, sender_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [id, content, sender_role, sender_id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Message failed' });
    }
});


// 4. FAQ Routes
app.get('/api/faq', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM faqs ORDER BY category ASC, created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error('FAQ fetch error:', err);
        res.status(500).json({ error: 'Failed to fetch FAQs' });
    }
});

app.post('/api/faq', authenticateToken, async (req, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Unauthorized' });
    const { question, answer, category } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO faqs (question, answer, category) VALUES ($1, $2, $3) RETURNING *',
            [question, answer, category]
        );
        await logAudit(req.user.id, 'create_faq', 'faqs', result.rows[0].id, { question });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create FAQ' });
    }
});

app.put('/api/faq/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Unauthorized' });
    const { id } = req.params;
    const { question, answer, category } = req.body;
    try {
        const result = await pool.query(
            'UPDATE faqs SET question = $1, answer = $2, category = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
            [question, answer, category, id]
        );
        await logAudit(req.user.id, 'update_faq', 'faqs', id, { question });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update FAQ' });
    }
});

app.delete('/api/faq/:id', authenticateToken, async (req, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Unauthorized' });
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM faqs WHERE id = $1', [id]);
        await logAudit(req.user.id, 'delete_faq', 'faqs', id, {});
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete FAQ' });
    }
});

app.post('/api/faq/:id/helpful', async (req, res) => {
    const { id } = req.params;
    const { helpful } = req.body;
    try {
        const column = helpful ? 'helpful_count' : 'unhelpful_count';
        await pool.query(`UPDATE faqs SET ${column} = ${column} + 1 WHERE id = $1`, [id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to track helpfulness' });
    }
});

// 3. Public Routes
app.get('/api/public/settings', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM system_settings');
        const settings = {};
        result.rows.forEach(row => {
            settings[row.key] = row.value;
        });

        // Add real-time load info
        const countRes = await pool.query("SELECT COUNT(*) FROM tickets WHERE status IN ('Open', 'In Progress')");
        settings.current_ticket_count = parseInt(countRes.rows[0].count);

        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

app.get('/api/system/health', async (req, res) => {
    try {
        const ticketCount = await pool.query('SELECT COUNT(*) FROM tickets');
        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        res.json({
            status: 'ok',
            database: 'connected',
            counts: {
                tickets: parseInt(ticketCount.rows[0].count),
                users: parseInt(userCount.rows[0].count)
            },
            time: new Date().toISOString()
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

const server = app.listen(port, async () => {
    console.log(`Server running on port ${port}`);
    // Auto-initialize DB on startup
    await initDb();
});
