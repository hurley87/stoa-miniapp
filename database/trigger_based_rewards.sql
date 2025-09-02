-- Alternative: Real-time trigger-based approach
-- This updates total_rewards_earned immediately when answers are evaluated
-- More efficient than cron jobs for real-time accuracy

-- Function to recalculate a single creator's total rewards
CREATE OR REPLACE FUNCTION recalculate_creator_rewards(p_creator_id INTEGER)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  new_total BIGINT;
BEGIN
  -- Calculate the new total for this creator
  SELECT COALESCE(
    SUM(CAST(creator_reward_amount * 1000000 AS BIGINT)), 
    0
  )
  INTO new_total
  FROM answers 
  WHERE creator_id = p_creator_id 
    AND creator_reward_amount IS NOT NULL 
    AND creator_reward_amount > 0;

  -- Update the creator's total
  UPDATE creators 
  SET 
    total_rewards_earned = new_total,
    last_activity = NOW()
  WHERE creator_id = p_creator_id;
END;
$$;

-- Trigger function that runs when answers are updated
CREATE OR REPLACE FUNCTION update_creator_rewards_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $trigger$
BEGIN
  -- Handle INSERT or UPDATE of creator_reward_amount
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Only recalculate if creator_reward_amount was actually changed or is relevant
    IF (TG_OP = 'INSERT' AND NEW.creator_reward_amount IS NOT NULL) OR
       (TG_OP = 'UPDATE' AND (OLD.creator_reward_amount IS DISTINCT FROM NEW.creator_reward_amount)) THEN
      
      -- Recalculate for the affected creator
      IF NEW.creator_id IS NOT NULL THEN
        PERFORM recalculate_creator_rewards(NEW.creator_id);
      END IF;
      
      -- If this was an UPDATE and the creator_id changed, also update the old creator
      IF TG_OP = 'UPDATE' AND OLD.creator_id IS NOT NULL AND OLD.creator_id != NEW.creator_id THEN
        PERFORM recalculate_creator_rewards(OLD.creator_id);
      END IF;
    END IF;
    
    RETURN NEW;
  END IF;

  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    -- Only recalculate if the deleted answer had a reward
    IF OLD.creator_reward_amount IS NOT NULL AND OLD.creator_reward_amount > 0 AND OLD.creator_id IS NOT NULL THEN
      PERFORM recalculate_creator_rewards(OLD.creator_id);
    END IF;
    
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$trigger$;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_creator_rewards ON answers;

CREATE TRIGGER trigger_update_creator_rewards
  AFTER INSERT OR UPDATE OR DELETE ON answers
  FOR EACH ROW
  EXECUTE FUNCTION update_creator_rewards_trigger();

-- Test the trigger by manually updating an answer
-- UPDATE answers SET creator_reward_amount = 10.50 WHERE id = 'some-answer-id';

-- Check if the trigger is working
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_update_creator_rewards';