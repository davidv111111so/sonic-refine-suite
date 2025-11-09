-- Create a function to check if a user has premium access based on email whitelist
CREATE OR REPLACE FUNCTION public.has_premium_access(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = _user_id
    AND email IN ('davidv111111@gmail.com', 'santiagov.t068@gmail.com')
  ) OR EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role = 'admin'::app_role
  ) OR EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id 
    AND subscription = 'premium'
  )
$$;

-- Create a function to check if user is in beta whitelist
CREATE OR REPLACE FUNCTION public.is_beta_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = _user_id
    AND email IN ('davidv111111@gmail.com', 'santiagov.t068@gmail.com')
  ) OR EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
    AND role = 'admin'::app_role
  )
$$;

COMMENT ON FUNCTION public.has_premium_access IS 'Checks if user has premium access via whitelist, admin role, or premium subscription';
COMMENT ON FUNCTION public.is_beta_user IS 'Beta restriction: Returns true for davidv111111@gmail.com, santiagov.t068@gmail.com, and admins';