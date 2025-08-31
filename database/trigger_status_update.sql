-- Function to automatically update question status when accessed
CREATE OR REPLACE FUNCTION auto_update_question_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if question should be marked as ended
  IF NEW.status = 'active' AND NEW.end_time < NOW() THEN
    NEW.status = 'ended';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger that runs before any SELECT that might need status update
-- This approach updates status whenever a question is accessed
CREATE OR REPLACE FUNCTION update_question_status_on_read()
RETURNS void AS $$
BEGIN
  UPDATE questions 
  SET status = 'ended'
  WHERE status = 'active' 
    AND end_time < NOW();
END;
$$ LANGUAGE plpgsql;

-- Alternative: Create a trigger on UPDATE to auto-update status
DROP TRIGGER IF EXISTS auto_update_status_trigger ON questions;
CREATE TRIGGER auto_update_status_trigger
  BEFORE UPDATE ON questions
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_question_status();