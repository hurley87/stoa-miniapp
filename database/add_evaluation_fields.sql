-- Add evaluation fields to answers table
ALTER TABLE answers 
ADD COLUMN ai_reward_amount DECIMAL(10,6) DEFAULT NULL,
ADD COLUMN ai_reward_reason TEXT DEFAULT NULL,
ADD COLUMN ai_evaluated_at TIMESTAMP DEFAULT NULL,
ADD COLUMN creator_reward_amount DECIMAL(10,6) DEFAULT NULL,
ADD COLUMN creator_reward_reason TEXT DEFAULT NULL,
ADD COLUMN creator_evaluated_at TIMESTAMP DEFAULT NULL,
ADD COLUMN evaluation_status VARCHAR(20) DEFAULT 'pending' CHECK (evaluation_status IN ('pending', 'ai_evaluated', 'creator_reviewed', 'submitted_onchain'));

-- Add indexes for performance
CREATE INDEX idx_answers_evaluation_status ON answers(evaluation_status);
CREATE INDEX idx_answers_question_evaluation ON answers(question_id, evaluation_status);

-- Add comments for clarity
COMMENT ON COLUMN answers.ai_reward_amount IS 'Reward amount determined by AI evaluation';
COMMENT ON COLUMN answers.ai_reward_reason IS 'Reason provided by AI for the reward amount';
COMMENT ON COLUMN answers.ai_evaluated_at IS 'Timestamp when AI evaluation was completed';
COMMENT ON COLUMN answers.creator_reward_amount IS 'Final reward amount set by question creator';
COMMENT ON COLUMN answers.creator_reward_reason IS 'Final reason provided by creator for the reward';
COMMENT ON COLUMN answers.creator_evaluated_at IS 'Timestamp when creator completed their review';
COMMENT ON COLUMN answers.evaluation_status IS 'Current status of the evaluation process';