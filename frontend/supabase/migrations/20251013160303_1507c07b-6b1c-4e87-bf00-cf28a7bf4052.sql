-- Add subscription field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN subscription text DEFAULT 'free' CHECK (subscription IN ('free', 'premium'));

-- Create index for faster subscription lookups
CREATE INDEX idx_profiles_subscription ON public.profiles(subscription);

-- Add comment to the column
COMMENT ON COLUMN public.profiles.subscription IS 'User subscription tier: free or premium';