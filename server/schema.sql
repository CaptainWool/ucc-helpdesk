-- Database Schema for UCC Helpdesk (PostgreSQL)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (Replaces Supabase Auth + Profiles)
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Optional link to registered user
    email TEXT NOT NULL, -- For anonymous or registered users
    student_id TEXT,
    phone_number TEXT,
    full_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('portal', 'fees', 'academic', 'other')),
    status VARCHAR(20) DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    priority VARCHAR(10) DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    attachment_url TEXT,
    assigned_to_email TEXT, -- Email of the agent assigned
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_comment TEXT,
    sla_deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('student', 'admin', 'agent')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Settings
INSERT INTO system_settings (key, value) VALUES 
('maintenance_mode', 'false'),
('submissions_locked', 'false'),
('showHeaderSubmit', 'true'),
('showHeaderFAQ', 'true'),
('max_open_tickets', '50'),
('ai_sensitivity', '0.7'),
('sla_peak_mode', 'false')
ON CONFLICT (key) DO NOTHING;
