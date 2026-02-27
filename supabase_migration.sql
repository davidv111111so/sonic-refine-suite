-- 1. Add "vip" to the user_tier enum (if not exists)
ALTER TYPE user_tier ADD VALUE IF NOT EXISTS 'vip';

-- 2. Add new columns to track monthly usage, if not exists
ALTER TABLE user_usage 
  ADD COLUMN IF NOT EXISTS stems_monthly_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mastering_monthly_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS enhance_monthly_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_reset_at DATE DEFAULT CURRENT_DATE;

-- 3. Replace/Update the get_user_usage function
CREATE OR REPLACE FUNCTION get_user_usage(p_user_id UUID)
RETURNS TABLE (
  files_enhanced_count INT,
  mastering_daily_count INT,
  stems_daily_count INT,
  mixer_minutes_used INT
) AS $$
DECLARE
  v_usage RECORD;
  v_is_new_day BOOLEAN;
  v_is_new_month BOOLEAN;
BEGIN
  -- Get existing or insert
  SELECT * INTO v_usage FROM user_usage WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO user_usage (user_id) VALUES (p_user_id) RETURNING * INTO v_usage;
  END IF;

  -- Check if it's a new day (for mixer lab)
  v_is_new_day := v_usage.last_reset_at < CURRENT_DATE;
  
  -- Check if it's a new month (for the monthly limits)
  v_is_new_month := date_trunc('month', v_usage.monthly_reset_at) < date_trunc('month', CURRENT_DATE);

  -- Handle resets if needed
  IF v_is_new_day OR v_is_new_month THEN
    UPDATE user_usage 
    SET 
      mixer_minutes_used = CASE WHEN v_is_new_day THEN 0 ELSE mixer_minutes_used END,
      last_reset_at = CASE WHEN v_is_new_day THEN CURRENT_DATE ELSE last_reset_at END,
      
      -- Map daily usage to monthly as a proxy for stems and mastering to avoid breaking frontend field maps
      stems_daily_count = CASE WHEN v_is_new_month THEN 0 ELSE stems_daily_count END,
      mastering_daily_count = CASE WHEN v_is_new_month THEN 0 ELSE mastering_daily_count END,
      files_enhanced_count = CASE WHEN v_is_new_month THEN 0 ELSE files_enhanced_count END,
      monthly_reset_at = CASE WHEN v_is_new_month THEN CURRENT_DATE ELSE monthly_reset_at END
    WHERE user_id = p_user_id
    RETURNING * INTO v_usage;
  END IF;

  RETURN QUERY SELECT 
    v_usage.files_enhanced_count,
    v_usage.mastering_daily_count,
    v_usage.stems_daily_count,
    v_usage.mixer_minutes_used;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Replace/Update the increment_usage function
CREATE OR REPLACE FUNCTION increment_usage(p_user_id UUID, p_field TEXT, p_amount INT)
RETURNS VOID AS $$
BEGIN
  IF p_field = 'files_enhanced_count' THEN
    UPDATE user_usage SET files_enhanced_count = files_enhanced_count + p_amount WHERE user_id = p_user_id;
  ELSIF p_field = 'mastering_daily_count' THEN
    UPDATE user_usage SET mastering_daily_count = mastering_daily_count + p_amount WHERE user_id = p_user_id;
  ELSIF p_field = 'stems_daily_count' THEN
    UPDATE user_usage SET stems_daily_count = stems_daily_count + p_amount WHERE user_id = p_user_id;
  ELSIF p_field = 'mixer_minutes_used' THEN
    UPDATE user_usage SET mixer_minutes_used = mixer_minutes_used + p_amount WHERE user_id = p_user_id;
  ELSE
    RAISE EXCEPTION 'Invalid field to increment';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
