-- Migration to create admin metrics and tracking tables
-- This will power the Admin Dashboard

CREATE TABLE IF NOT EXISTS public.job_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    job_type TEXT NOT NULL, -- 'mastering', 'stems', 'analysis'
    file_size_bytes BIGINT,
    duration_seconds FLOAT,
    cost_estimate FLOAT, -- Calculated on backend
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

-- Enable RLS for job_history
ALTER TABLE public.job_history ENABLE ROW LEVEL SECURITY;

-- Only admins can read all job history
CREATE POLICY "Admins can view all job history" 
ON public.job_history 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND tier = 'admin'
    )
);

-- Users can view their own job history
CREATE POLICY "Users can view their own jobs" 
ON public.job_history 
FOR SELECT 
USING (auth.uid() = user_id);

-- System metrics summary table (pre-calculated or real-time views)
CREATE VIEW public.admin_stats AS
SELECT 
    COUNT(*) as total_jobs,
    COUNT(DISTINCT user_id) as total_users,
    SUM(file_size_bytes) as total_data_bytes,
    SUM(cost_estimate) as total_estimated_cost,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_jobs
FROM public.job_history;

-- Add comment explaining why we use a view
COMMENT ON VIEW public.admin_stats IS 'Aggregated metrics for the admin dashboard';
