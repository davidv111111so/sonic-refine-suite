-- =====================================================
-- Sonic Refine Suite - Full Subscription & Usage Track DB Setup
-- This script creates the required tables if they are missing
-- and updates the functions for the new 4-tier system.
-- =====================================================

-- 1. Ensure tier "vip" exists in a "user_tier" enum if you are using one. 
-- If profiles.tier is just a text column, this does nothing but is safe to run.
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_tier') THEN
        ALTER TYPE user_tier ADD VALUE IF NOT EXISTS 'vip';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- 2. CREATE SUBSCRIPTIONS TABLE (if missing)
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    paddle_customer_id TEXT,
    paddle_subscription_id TEXT,
    coinbase_charge_id TEXT,
    coinbase_charge_code TEXT,
    status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'active', 'trialing', 'past_due', 'canceled', 'paused')),
    plan_type TEXT NOT NULL DEFAULT 'free',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    payment_provider TEXT CHECK (payment_provider IN ('paddle', 'coinbase', NULL)),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);


-- 3. CREATE OR UPDATE USAGE_TRACKING TABLE
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    files_enhanced_count INTEGER DEFAULT 0,
    monthly_quota_reset_date DATE DEFAULT CURRENT_DATE,
    mastering_daily_count INTEGER DEFAULT 0,
    stems_daily_count INTEGER DEFAULT 0,
    stems_monthly_count INTEGER DEFAULT 0,
    mastering_monthly_count INTEGER DEFAULT 0,
    daily_quota_reset_date DATE DEFAULT CURRENT_DATE,
    mixer_minutes_used INTEGER DEFAULT 0,
    mixer_session_date DATE DEFAULT CURRENT_DATE,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id)
);

-- Force add columns if the table already existed but was missing them
ALTER TABLE public.usage_tracking 
  ADD COLUMN IF NOT EXISTS stems_monthly_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stems_daily_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mastering_monthly_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_quota_reset_date DATE DEFAULT CURRENT_DATE;

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_tracking;
CREATE POLICY "Users can view own usage" ON public.usage_tracking
    FOR SELECT USING (auth.uid() = user_id);


-- 4. CREATE QUOTA RESET FUNCTIONS
CREATE OR REPLACE FUNCTION public.check_and_reset_daily_quotas(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.usage_tracking
    SET 
        mixer_minutes_used = CASE WHEN mixer_session_date < CURRENT_DATE THEN 0 ELSE mixer_minutes_used END,
        mastering_daily_count = 0,
        stems_daily_count = 0,
        daily_quota_reset_date = CURRENT_DATE,
        mixer_session_date = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = p_user_id
    AND (daily_quota_reset_date < CURRENT_DATE OR mixer_session_date < CURRENT_DATE);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_and_reset_monthly_quotas(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    first_of_month DATE := date_trunc('month', CURRENT_DATE)::DATE;
BEGIN
    UPDATE public.usage_tracking
    SET 
        files_enhanced_count = 0,
        mastering_monthly_count = 0,
        stems_monthly_count = 0,
        monthly_quota_reset_date = first_of_month,
        updated_at = now()
    WHERE user_id = p_user_id
    AND monthly_quota_reset_date < first_of_month;
END;
$$;


-- 5. CREATE RPC READ FUNCTION
CREATE OR REPLACE FUNCTION public.get_user_usage(p_user_id UUID)
RETURNS TABLE (
    files_enhanced_count INTEGER,
    mastering_daily_count INTEGER,
    mastering_monthly_count INTEGER,
    stems_daily_count INTEGER,
    stems_monthly_count INTEGER,
    mixer_minutes_used INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ensure tracking record exists
    INSERT INTO public.usage_tracking (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Reset quotas if needed
    PERFORM public.check_and_reset_daily_quotas(p_user_id);
    PERFORM public.check_and_reset_monthly_quotas(p_user_id);
    
    RETURN QUERY
    SELECT 
        ut.files_enhanced_count,
        ut.mastering_daily_count,
        ut.mastering_monthly_count,
        ut.stems_daily_count,
        ut.stems_monthly_count,
        ut.mixer_minutes_used
    FROM public.usage_tracking ut
    WHERE ut.user_id = p_user_id;
END;
$$;


-- 6. CREATE RPC WRITE/INCREMENT FUNCTION
CREATE OR REPLACE FUNCTION public.increment_usage(
    p_user_id UUID,
    p_field TEXT,
    p_amount INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Ensure user has a tracking record
    INSERT INTO public.usage_tracking (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Update the specific field
    IF p_field = 'files_enhanced_count' THEN
        UPDATE public.usage_tracking 
        SET files_enhanced_count = files_enhanced_count + p_amount,
            updated_at = now()
        WHERE user_id = p_user_id;
    ELSIF p_field = 'mastering_increment' THEN
        UPDATE public.usage_tracking 
        SET mastering_daily_count = mastering_daily_count + p_amount,
            mastering_monthly_count = mastering_monthly_count + p_amount,
            updated_at = now()
        WHERE user_id = p_user_id;
    ELSIF p_field = 'stems_increment' THEN
        UPDATE public.usage_tracking 
        SET stems_daily_count = stems_daily_count + p_amount,
            stems_monthly_count = stems_monthly_count + p_amount,
            updated_at = now()
        WHERE user_id = p_user_id;
    ELSIF p_field = 'mixer_minutes_used' THEN
        UPDATE public.usage_tracking 
        SET mixer_minutes_used = mixer_minutes_used + p_amount,
            updated_at = now()
        WHERE user_id = p_user_id;
    END IF;
END;
$$;

-- Ensure authenticated users can execute the new functions
GRANT EXECUTE ON FUNCTION public.increment_usage(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_usage(UUID) TO authenticated;
