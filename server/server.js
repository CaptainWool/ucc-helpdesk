const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

// Database Connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('render.com') ? { rejectUnauthorized: false } : false
});

// --- Auto-Initialize Database Schema ---
const initDb = async () => {
    console.log('Checking database schema synchronization...');
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Ensure Extensions
        await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

        // Create Users Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'agent', 'super_admin')),
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

        // Create Tickets Table (with all compatibility columns)
        await client.query(`
            CREATE TABLE IF NOT EXISTS tickets (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID REFERENCES users(id) ON DELETE SET NULL,
                email TEXT NOT NULL,
                student_id TEXT,
                student_id_ref UUID,
                phone_number TEXT,
                full_name TEXT NOT NULL,
                subject TEXT NOT NULL,
                description TEXT NOT NULL,
                type VARCHAR(20) NOT NULL CHECK (type IN ('portal', 'fees', 'academic', 'other')),
                status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
                priority VARCHAR(10) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
                attachment_url TEXT,
                assigned_to_email TEXT,
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                feedback_comment TEXT,
                sla_deadline TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                resolved_at TIMESTAMP WITH TIME ZONE
            )
        `);

        // Create Messages Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
                sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
                sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('student', 'admin', 'agent')),
                content TEXT NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create Settings Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS system_settings (
                key TEXT PRIMARY KEY,
                value JSONB NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create Audit Logs Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS audit_logs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
                action TEXT NOT NULL,
                target_type TEXT,
                target_id TEXT,
                details JSONB,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

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

// SMS Utility (Arkesel V2)
const sendSMS = async (phoneNumber, message) => {
    try {
        const apiKey = process.env.ARKESEL_API_KEY;
        const senderId = process.env.ARKESEL_SENDER_ID || 'UCCHelpdesk';

        if (!apiKey) {
            console.warn('⚠️ Arkesel API Key missing. Skipping SMS.');
            return;
        }

        // Clean phone number (Arkesel prefers 233 format)
        let formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
        if (formattedNumber.startsWith('0')) {
            formattedNumber = '233' + formattedNumber.substring(1);
        }

        const response = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': apiKey
            },
            body: JSON.stringify({
                sender: senderId,
                recipients: [formattedNumber],
                message: message
            })
        });

        const data = await response.json();
        console.log(`📱 SMS Status to ${formattedNumber}:`, data.status || data.message || 'Sent');
        return data;
    } catch (err) {
        console.error('❌ SMS Sending failed:', err.message);
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
    const avatar_url = req.file ? `/uploads/avatars/${req.file.filename}` : null;

    try {
        // SECURITY: Role assignment restriction
        let finalRole = role || 'student';

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
                message: `Your account was permanently revoked on ${new Date(user.revoked_at).toLocaleDateString()}. Reason: ${user.revocation_reason || 'No reason provided.'}`
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
                const expires = user.ban_expires_at ? `until ${new Date(user.ban_expires_at).toLocaleString()}` : 'indefinitely';
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

app.post('/api/auth/forgot-password', async (req, res) => {
    const { email, student_id, new_password } = req.body;
    try {
        // Verify user exists and student_id matches
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.student_id !== student_id) {
            return res.status(401).json({ error: 'Student ID does not match our records' });
        }

        // Hash and update password
        const hashedPassword = await bcrypt.hash(new_password, 10);
        await pool.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashedPassword, user.id]);

        res.json({ message: 'Password reset successful. You can now login with your new password.' });
    } catch (err) {
        console.error('Password reset error:', err);
        res.status(500).json({ error: 'Failed to reset password' });
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
        const setClause = validFields.map((f, i) => `${f} = $${i + 2}`).join(', ');

        const result = await pool.query(`UPDATE users SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`, [id, ...validValues]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Update failed' });
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
            AND resolved_at < NOW() - ($1 || ' days')::interval
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

        // Role-based ticket visibility
        if (req.user.role === 'student') {
            // Students see only their own tickets
            query = 'SELECT * FROM tickets WHERE user_id = $1 OR email = (SELECT email FROM users WHERE id = $1) ORDER BY created_at DESC';
            params = [req.user.id];
        } else if (req.user.role === 'agent') {
            // Agents (Coordinators) see only tickets assigned to them
            query = 'SELECT * FROM tickets WHERE assigned_to_email = (SELECT email FROM users WHERE id = $1) ORDER BY created_at DESC';
            params = [req.user.id];
        }
        // Super Admins see all tickets (no filter needed)

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
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
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch ticket' });
    }
});

app.post('/api/tickets', [authenticateToken, uploadAttachment.single('attachment')], async (req, res) => {
    const { full_name, email, student_id, phone_number, subject, description, type, priority } = req.body;
    const attachment_url = req.file ? `/uploads/attachments/${req.file.filename}` : null;

    try {
        const user_id = req.user?.id;

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
                    message: `Our current support queue is full (max ${settings.max_open_tickets} active requests). Please check our FAQ or try again later.`
                });
            }
        }

        // 4. Resource Filter (File size & type)
        if (req.file && settings.resource_limits) {
            const limits = settings.resource_limits;
            const sizeMB = req.file.size / (1024 * 1024);

            if (sizeMB > limits.max_size_mb) {
                return res.status(400).json({ error: 'File too large', message: `The attachment exceeds the maximum allowed size of ${limits.max_size_mb}MB.` });
            }

            if (limits.allowed_types && !limits.allowed_types.includes(req.file.mimetype)) {
                return res.status(400).json({ error: 'Unsupported file type', message: `Only the following formats are allowed: ${limits.allowed_types.join(', ')}` });
            }
        }

        // 5. AI Auto-Prioritization (Simulated)
        let finalPriority = priority || 'Medium';
        if (!priority) {
            const sensitivity = parseFloat(settings.ai_sensitivity || 0.7);
            const urgentKeywords = ['urgent', 'emergency', 'broken', 'cannot', 'blocked', 'fail', 'error'];
            const content = `${subject} ${description}`.toLowerCase();
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
            [full_name, email, student_id, phone_number, subject, description, type, finalPriority, user_id, sla_deadline, attachment_url]
        );

        // SMS Notification for new ticket
        if (settings.sms_notifications_enabled && phone_number) {
            const smsMessage = `Hi ${full_name}, your UCC Helpdesk ticket (#${result.rows[0].id.substring(0, 8)}) has been received. Subject: ${subject}. We'll resolve it soon!`;
            sendSMS(phone_number, smsMessage);
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ticket creation failed' });
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

const server = app.listen(port, async () => {
    console.log(`Server running on port ${port}`);
    // Auto-initialize DB on startup
    await initDb();
});
