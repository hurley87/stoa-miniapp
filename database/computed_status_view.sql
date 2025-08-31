-- Create a view that computes question status dynamically
CREATE OR REPLACE VIEW questions_with_computed_status AS
SELECT 
  *,
  CASE 
    WHEN status = 'evaluated' THEN 'evaluated'
    WHEN status = 'emergency' THEN 'emergency'
    WHEN end_time < NOW() THEN 'ended'
    ELSE 'active'
  END AS computed_status
FROM questions;

-- Update your application to query this view instead of the questions table directly
-- This ensures status is always accurate based on current time