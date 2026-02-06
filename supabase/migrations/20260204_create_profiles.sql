-- =====================================================
-- Sonic Refine Suite - Multi-Tier User System
-- =====================================================

-- 1. Create a Custom Type for User Tiers
DO $$ BEGIN
    CREATE TYPE public.user_tier AS ENUM ('basic', 'premium', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    tier public.user_tier DEFAULT 'basic',
    subscription_id TEXT, -- For Paddle/PayPal reference
    customer_id TEXT, -- Gateway customer ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- 5. Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_admin_user BOOLEAN;
BEGIN
    -- Check if user is in our existing admins list or matches admin emails
    SELECT public.is_admin(NEW.id) INTO is_admin_user;

    INSERT INTO public.profiles (id, email, tier)
    VALUES (
        NEW.id, 
        NEW.email, 
        CASE 
            WHEN is_admin_user THEN 'admin'::public.user_tier
            ELSE 'basic'::public.user_tier
        END
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. RPC function to check tier securely
CREATE OR REPLACE FUNCTION public.get_user_tier(query_user_id UUID)
RETURNS public.user_tier
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT tier FROM public.profiles WHERE id = query_user_id;
$$;
