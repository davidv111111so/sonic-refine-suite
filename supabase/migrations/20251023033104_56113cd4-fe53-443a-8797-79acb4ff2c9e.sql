-- Create table to track daily upload limits
CREATE TABLE IF NOT EXISTS public.daily_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  upload_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, upload_date)
);

-- Enable RLS
ALTER TABLE public.daily_uploads ENABLE ROW LEVEL SECURITY;

-- Users can view their own upload counts
CREATE POLICY "Users can view their own upload counts"
ON public.daily_uploads
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own upload counts
CREATE POLICY "Users can insert their own upload counts"
ON public.daily_uploads
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own upload counts
CREATE POLICY "Users can update their own upload counts"
ON public.daily_uploads
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all upload counts
CREATE POLICY "Admins can view all upload counts"
ON public.daily_uploads
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_daily_uploads_updated_at
  BEFORE UPDATE ON public.daily_uploads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_daily_uploads_user_date ON public.daily_uploads(user_id, upload_date);