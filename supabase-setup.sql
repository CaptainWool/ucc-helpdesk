-- ============================================
-- UCC Helpdesk - Supabase Database Setup (FIXED v2)
-- ============================================
-- This script sets up all necessary tables, RLS policies, and triggers
-- FIXES: Infinite recursion + messages table schema mismatch

-- ============================================
-- 1. CREATE TABLES
-- ============================================

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'agent', 'super_admin')),
    full_name TEXT,
    student_id TEXT,
    department TEXT DEFAULT 'general' CHECK (department IN ('general', 'portal', 'fees', 'academic')),
    has_completed_tour BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    student_id TEXT,
    full_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('portal', 'fees', 'academic', 'other')),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    attachment_url TEXT,
    voice_note_url TEXT,
    assigned_to UUID REFERENCES public.profiles(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- Messages table (matching TicketChat.jsx schema)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    sender_role TEXT NOT NULL CHECK (sender_role IN ('student', 'admin')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. DROP EXISTING POLICIES
-- ============================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

DROP POLICY IF EXISTS "Anyone can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can view tickets" ON public.tickets;
DROP POLICY IF EXISTS "Authenticated users can update tickets" ON public.tickets;
DROP POLICY IF EXISTS "Authenticated users can delete tickets" ON public.tickets;

DROP POLICY IF EXISTS "Anyone can view messages" ON public.messages;
DROP POLICY IF EXISTS "Authenticated can create messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;

-- ============================================
-- 4. CREATE RLS POLICIES FOR PROFILES
-- ============================================

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ============================================
-- 5. CREATE RLS POLICIES FOR TICKETS
-- ============================================

CREATE POLICY "Anyone can create tickets"
ON public.tickets
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view tickets"
ON public.tickets
FOR SELECT
USING (true);  -- Allow all to view (filtering in app)

CREATE POLICY "Authenticated users can update tickets"
ON public.tickets
FOR UPDATE
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete tickets"
ON public.tickets
FOR DELETE
USING (auth.uid() IS NOT NULL);

-- ============================================
-- 6. CREATE RLS POLICIES FOR MESSAGES
-- ============================================

CREATE POLICY "Anyone can view messages"
ON public.messages
FOR SELECT
USING (true);

CREATE POLICY "Users can insert messages"
ON public.messages
FOR INSERT
WITH CHECK (true);  -- Allow anyone to send messages

-- ============================================
-- 7. CREATE FUNCTION TO AUTO-CREATE PROFILE
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role, full_name, student_id, has_completed_tour)
    VALUES (
        NEW.id,
        NEW.email,
        'student',
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'student_id',
        false
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. CREATE TRIGGER FOR AUTO-PROFILE CREATION
-- ============================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 9. CREATE UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_tickets_updated_at ON public.tickets;
CREATE TRIGGER update_tickets_updated_at
    BEFORE UPDATE ON public.tickets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 10. GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT ALL ON public.profiles TO authenticated;
GRANT SELECT, INSERT ON public.profiles TO anon;

GRANT ALL ON public.tickets TO authenticated;
GRANT SELECT, INSERT ON public.tickets TO anon;

GRANT ALL ON public.messages TO authenticated;
GRANT SELECT, INSERT ON public.messages TO anon;

-- ============================================
-- SETUP COMPLETE!
-- ============================================
