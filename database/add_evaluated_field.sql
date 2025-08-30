-- Add evaluated field to questions table
ALTER TABLE questions 
ADD COLUMN evaluated BOOLEAN DEFAULT FALSE,
ADD COLUMN evaluated_at TIMESTAMP DEFAULT NULL,
ADD COLUMN evaluation_tx_hash TEXT DEFAULT NULL;

-- Add indexes for performance
CREATE INDEX idx_questions_evaluated ON questions(evaluated);
CREATE INDEX idx_questions_evaluated_at ON questions(evaluated_at);

-- Add comments for clarity
COMMENT ON COLUMN questions.evaluated IS 'Whether the question has been evaluated onchain';
COMMENT ON COLUMN questions.evaluated_at IS 'Timestamp when the question was evaluated onchain';
COMMENT ON COLUMN questions.evaluation_tx_hash IS 'Transaction hash of the evaluation on blockchain';