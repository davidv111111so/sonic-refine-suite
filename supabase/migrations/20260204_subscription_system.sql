-- =====================================================
-- Sonic Refine Suite - Subscription System Migration
-- Run this AFTER setup_new_project.sql
-- =====================================================

-- ============================================
-- 1. WEBHOOK EVENTS TABLE (for idempotency)
-- ============================================
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('paddle', 'coinbase')),
    event_type TEXT NOT NULL,
    processed_at TIMESTAMPTZ DEFAULT now(),
    payload JSONB
);

-- ============================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Paddle fields
    paddle_customer_id TEXT,
    paddle_subscription_id TEXT,
    
    -- Coinbase Commerce fields
    coinbase_charge_id TEXT,
    coinbase_charge_code TEXT,
    
    -- Subscription status
    status TEXT NOT NULL DEFAULT 'free' CHECK (status IN ('free', 'active', 'trialing', 'past_due', 'canceled', 'paused')),
    plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'monthly', 'yearly')),
    
    -- Billing cycle
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    
    -- Metadata
    payment_provider TEXT CHECK (payment_provider IN ('paddle', 'coinbase', NULL)),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id)
);

-- ============================================
-- 3. USAGE TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Monthly quotas (resets on 1st of each month)
    files_enhanced_count INTEGER DEFAULT 0,
    monthly_quota_reset_date DATE DEFAULT CURRENT_DATE,
    
    -- Daily quotas (resets at midnight)
    mastering_daily_count INTEGER DEFAULT 0,
    daily_quota_reset_date DATE DEFAULT CURRENT_DATE,
    
    -- Session-based (mixer minutes per day)
    mixer_minutes_used INTEGER DEFAULT 0,
    mixer_session_date DATE DEFAULT CURRENT_DATE,
    
    updated_at TIMESTAMPTZ DEFAULT now(),
    
    UNIQUE(user_id)
);

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLICIES
-- ============================================

-- Webhook events: Only service role can access
DROP POLICY IF EXISTS "Service can manage webhook_events" ON public.webhook_events;
CREATE POLICY "Service can manage webhook_events" ON public.webhook_events
    FOR ALL USING (auth.role() = 'service_role');

-- Subscriptions: Users can read own, service role can write
DROP POLICY IF EXISTS "Users can view own subscription" ON public.subscriptions;
CREATE POLICY "Users can view own subscription" ON public.subscriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Service can manage subscriptions" ON public.subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- Usage tracking: Users can read own, service role can write
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_tracking;
CREATE POLICY "Users can view own usage" ON public.usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service can manage usage" ON public.usage_tracking;
CREATE POLICY "Service can manage usage" ON public.usage_tracking
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 6. FUNCTIONS FOR USAGE TRACKING
-- ============================================

-- Function to increment usage counters
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
    ELSIF p_field = 'mastering_daily_count' THEN
        UPDATE public.usage_tracking 
        SET mastering_daily_count = mastering_daily_count + p_amount,
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

-- Function to check and reset daily quotas
CREATE OR REPLACE FUNCTION public.check_and_reset_daily_quotas(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.usage_tracking
    SET 
        mastering_daily_count = CASE WHEN daily_quota_reset_date < CURRENT_DATE THEN 0 ELSE mastering_daily_count END,
        mixer_minutes_used = CASE WHEN mixer_session_date < CURRENT_DATE THEN 0 ELSE mixer_minutes_used END,
        daily_quota_reset_date = CURRENT_DATE,
        mixer_session_date = CURRENT_DATE,
        updated_at = now()
    WHERE user_id = p_user_id
    AND (daily_quota_reset_date < CURRENT_DATE OR mixer_session_date < CURRENT_DATE);
END;
$$;

-- Function to check and reset monthly quotas
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
        monthly_quota_reset_date = first_of_month,
        updated_at = now()
    WHERE user_id = p_user_id
    AND monthly_quota_reset_date < first_of_month;
END;
$$;

-- Function to get user's current usage with auto-reset
CREATE OR REPLACE FUNCTION public.get_user_usage(p_user_id UUID)
RETURNS TABLE (
    files_enhanced_count INTEGER,
    mastering_daily_count INTEGER,
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
    
    -- Return current usage
    RETURN QUERY
    SELECT 
        ut.files_enhanced_count,
        ut.mastering_daily_count,
        ut.mixer_minutes_used
    FROM public.usage_tracking ut
    WHERE ut.user_id = p_user_id;
END;
$$;

-- Function to check if user is premium
CREATE OR REPLACE FUNCTION public.is_premium(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    sub_status TEXT;
BEGIN
    SELECT status INTO sub_status
    FROM public.subscriptions
    WHERE user_id = p_user_id;
    
    RETURN sub_status IN ('active', 'trialing');
END;
$$;

-- ============================================
-- 7. AUTO-CREATE SUBSCRIPTION ON NEW USER
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
    -- Create free subscription for new user
    INSERT INTO public.subscriptions (user_id, status, plan_type)
    VALUES (NEW.id, 'free', 'free')
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create usage tracking record
    INSERT INTO public.usage_tracking (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (run after profile creation)
DROP TRIGGER IF EXISTS on_profile_created_subscription ON public.profiles;
CREATE TRIGGER on_profile_created_subscription
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_subscription();

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.increment_usage(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_usage(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_premium(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_reset_daily_quotas(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_reset_monthly_quotas(UUID) TO authenticated;

-- ============================================
-- 9. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON public.usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON public.webhook_events(event_id);
