-- Enable pg_cron extension for scheduled jobs
-- Note: This needs to be enabled in Supabase Dashboard under Database > Extensions
-- SELECT cron.schedule('update-question-status', '* * * * *', 'SELECT update_expired_questions();');

-- Function to update question statuses
CREATE OR REPLACE FUNCTION update_expired_questions()
RETURNS void AS $$
BEGIN
  -- Update questions from 'active' to 'ended' when end_time has passed
  UPDATE questions 
  SET status = 'ended'
  WHERE status = 'active' 
    AND end_time < NOW();
    
  -- Log the update
  RAISE NOTICE 'Updated % questions to ended status', (
    SELECT COUNT(*) 
    FROM questions 
    WHERE status = 'ended' 
      AND end_time < NOW() 
      AND status != 'evaluated'
  );
END;
$$ LANGUAGE plpgsql;

-- Schedule the function to run every minute
-- Run this in Supabase SQL editor after enabling pg_cron:
-- SELECT cron.schedule('update-question-status', '* * * * *', 'SELECT update_expired_questions();');

-- To see scheduled jobs:
-- SELECT * FROM cron.job;

-- To remove a job if needed:
-- SELECT cron.unschedule('update-question-status');