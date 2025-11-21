-- Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id),
    UNIQUE(email)
);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can read their own entry (or everyone can read to check if they are admin)
CREATE POLICY "Allow read access to authenticated users" ON public.admin_users
    FOR SELECT TO authenticated USING (true);

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = check_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert initial admins (SAFE: ON CONFLICT DO NOTHING)
-- You can add more emails here
INSERT INTO public.admin_users (user_id, email)
SELECT id, email FROM auth.users 
WHERE email IN ('davidv111111@gmail.com', 'santiagov.t068@gmail.com')
ON CONFLICT (email) DO NOTHING;
