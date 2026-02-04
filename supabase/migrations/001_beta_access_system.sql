-- =====================================================
-- Level Audio - Beta Access System
-- Run this in Supabase SQL Editor (Database > SQL Editor)
-- =====================================================

-- 1. Create beta_users table
CREATE TABLE IF NOT EXISTS public.beta_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    granted_by TEXT DEFAULT 'system',
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    is_active BOOLEAN DEFAULT true
);

-- 2. Create admins table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE public.beta_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies - Only admins can manage these tables
CREATE POLICY "Admins can view beta_users" ON public.beta_users
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM public.admins WHERE user_id IS NOT NULL)
    );

CREATE POLICY "Admins can manage beta_users" ON public.beta_users
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM public.admins WHERE user_id IS NOT NULL)
    );

CREATE POLICY "Admins can view admins" ON public.admins
    FOR SELECT USING (
        auth.uid() IN (SELECT user_id FROM public.admins WHERE user_id IS NOT NULL)
    );

-- 5. Create is_admin RPC function
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email TEXT;
    admin_emails TEXT[] := ARRAY['davidv111111@gmail.com', 'santiagov.t068@gmail.com'];
BEGIN
    -- Get the email for this user
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = check_user_id;
    
    -- Check if email is in hardcoded admin list
    IF user_email = ANY(admin_emails) THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user is in admins table
    RETURN EXISTS (
        SELECT 1 FROM public.admins
        WHERE user_id = check_user_id OR email = user_email
    );
END;
$$;

-- 6. Create is_beta_user RPC function
CREATE OR REPLACE FUNCTION public.is_beta_user(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email TEXT;
BEGIN
    -- First check if user is admin (admins always have access)
    IF public.is_admin(_user_id) THEN
        RETURN TRUE;
    END IF;
    
    -- Get the email for this user
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = _user_id;
    
    -- Check if user is in beta_users table and is active
    RETURN EXISTS (
        SELECT 1 FROM public.beta_users
        WHERE (user_id = _user_id OR email = user_email)
        AND is_active = true
    );
END;
$$;

-- 7. Insert initial admin users (your emails)
-- This will auto-link to user_id when they sign up
INSERT INTO public.admins (email) VALUES 
    ('davidv111111@gmail.com'),
    ('santiagov.t068@gmail.com')
ON CONFLICT (email) DO NOTHING;

-- 8. Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_beta_user(UUID) TO authenticated;

-- =====================================================
-- HOW TO ADD A NEW BETA USER:
-- =====================================================
-- Run this SQL in Supabase SQL Editor:
-- 
-- INSERT INTO public.beta_users (email, notes)
-- VALUES ('newuser@example.com', 'Added by David');
--
-- =====================================================
-- HOW TO REMOVE A BETA USER:
-- =====================================================
-- Option 1: Soft disable (recommended):
-- UPDATE public.beta_users SET is_active = false WHERE email = 'user@example.com';
--
-- Option 2: Hard delete:
-- DELETE FROM public.beta_users WHERE email = 'user@example.com';
--
-- =====================================================
