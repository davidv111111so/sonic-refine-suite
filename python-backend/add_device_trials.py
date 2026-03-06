import requests
import json
import os

TOKEN = "sbp_fa91a09ccf53778e56dc708a9836cd67db99eb56"
PROJECT_REF = "nhulnikqfphofqpnmdba"
API_URL = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/query"

query = """
-- Create the device_trials table for tracking free anonymous and free-tier users
CREATE TABLE IF NOT EXISTS public.device_trials (
    device_hash TEXT PRIMARY KEY,
    enhancements_used INT DEFAULT 0,
    stems_used INT DEFAULT 0,
    mastering_used INT DEFAULT 0,
    mixer_minutes_used INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.device_trials ENABLE ROW LEVEL SECURITY;

-- Allow anyone (even anonymous) to insert and select their own device_hash
DROP POLICY IF EXISTS "Enable read access for all users" ON public.device_trials;
CREATE POLICY "Enable read access for all users" ON public.device_trials FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON public.device_trials;
CREATE POLICY "Enable insert for all users" ON public.device_trials FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON public.device_trials;
CREATE POLICY "Enable update for all users" ON public.device_trials FOR UPDATE USING (true);


-- Create or replace RPC function to register a device
CREATE OR REPLACE FUNCTION public.register_device(device_hash text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.device_trials (device_hash)
  VALUES (device_hash)
  ON CONFLICT (device_hash) DO NOTHING;
END;
$$;


-- Create or replace RPC function to check device usage
CREATE OR REPLACE FUNCTION public.get_device_usage(p_device_hash text)
RETURNS TABLE (
    enhancements_used int,
    stems_used int,
    mastering_used int,
    mixer_minutes_used int
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.enhancements_used,
    t.stems_used,
    t.mastering_used,
    t.mixer_minutes_used
  FROM public.device_trials t
  WHERE t.device_hash = p_device_hash;
END;
$$;


-- Create or replace RPC function to increment device usage
CREATE OR REPLACE FUNCTION public.increment_device_usage(
    p_device_hash text,
    p_feature text,
    p_amount int DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_feature = 'enhancement' THEN
    UPDATE public.device_trials
    SET enhancements_used = enhancements_used + p_amount, updated_at = NOW()
    WHERE device_hash = p_device_hash;
  ELSIF p_feature LIKE 'stems%' THEN
    UPDATE public.device_trials
    SET stems_used = stems_used + p_amount, updated_at = NOW()
    WHERE device_hash = p_device_hash;
  ELSIF p_feature LIKE 'mastering%' THEN
    UPDATE public.device_trials
    SET mastering_used = mastering_used + p_amount, updated_at = NOW()
    WHERE device_hash = p_device_hash;
  ELSIF p_feature = 'mixer' THEN
    UPDATE public.device_trials
    SET mixer_minutes_used = mixer_minutes_used + p_amount, updated_at = NOW()
    WHERE device_hash = p_device_hash;
  END IF;
END;
$$;

-- Create table for Feedback
CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT,
    email TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert access for all users" ON public.user_feedback;
CREATE POLICY "Enable insert access for all users" ON public.user_feedback FOR INSERT WITH CHECK (true);
"""

def run_sql():
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "query": query
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        if response.status_code in [200, 201]:
            print("Successfully executed SQL migrations.")
            return True
        else:
            print(f"Failed to execute SQL. Status Code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    run_sql()
