-- Fresh start: Remove users table and foreign key constraints
-- This will clean up the database for a fresh start with creators table

-- Step 1: Drop foreign key constraints that reference users table
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_creator_fkey;
ALTER TABLE answers DROP CONSTRAINT IF EXISTS answers_responder_fkey;
ALTER TABLE reward_claims DROP CONSTRAINT IF EXISTS reward_claims_claimer_fkey;
ALTER TABLE reputation_history DROP CONSTRAINT IF EXISTS reputation_history_wallet_fkey;

-- Step 2: Drop views that depend on users table
DROP VIEW IF EXISTS user_stats;
DROP VIEW IF EXISTS question_stats;

-- Step 3: Drop users, seeds, and emergency_refunds tables
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS seeds CASCADE;
DROP TABLE IF EXISTS emergency_refunds CASCADE;

-- Step 4: Create creators table
CREATE TABLE IF NOT EXISTS creators (
  creator_id SERIAL PRIMARY KEY,
  wallet TEXT UNIQUE NOT NULL,
  fid INTEGER UNIQUE,
  username TEXT,
  pfp TEXT,
  reputation FLOAT DEFAULT 0,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  total_questions_created INTEGER DEFAULT 0,
  total_answers_submitted INTEGER DEFAULT 0,
  total_rewards_earned BIGINT DEFAULT 0,
  total_fees_earned BIGINT DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- Step 5: Add creator_id columns to related tables if they don't exist
ALTER TABLE questions ADD COLUMN IF NOT EXISTS creator_id INTEGER;
ALTER TABLE answers ADD COLUMN IF NOT EXISTS creator_id INTEGER;
ALTER TABLE reward_claims ADD COLUMN IF NOT EXISTS creator_id INTEGER;
ALTER TABLE reputation_history ADD COLUMN IF NOT EXISTS creator_id INTEGER;

-- Step 6: Add foreign key constraints to creators table
ALTER TABLE questions 
ADD CONSTRAINT fk_questions_creator 
FOREIGN KEY (creator_id) REFERENCES creators(creator_id);

ALTER TABLE answers 
ADD CONSTRAINT fk_answers_creator 
FOREIGN KEY (creator_id) REFERENCES creators(creator_id);

ALTER TABLE reward_claims 
ADD CONSTRAINT fk_reward_claims_creator 
FOREIGN KEY (creator_id) REFERENCES creators(creator_id);

ALTER TABLE reputation_history 
ADD CONSTRAINT fk_reputation_history_creator 
FOREIGN KEY (creator_id) REFERENCES creators(creator_id);

-- Step 7: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_creators_wallet ON creators(wallet);
CREATE INDEX IF NOT EXISTS idx_creators_fid ON creators(fid);
CREATE INDEX IF NOT EXISTS idx_questions_creator_id ON questions(creator_id);
CREATE INDEX IF NOT EXISTS idx_answers_creator_id ON answers(creator_id);

-- Step 8: Create updated views
CREATE VIEW question_stats AS
SELECT 
  q.question_id,
  q.contract_address,
  q.creator_id,
  c.wallet as creator_wallet,
  c.username as creator_username,
  c.pfp as creator_pfp,
  q.content,
  q.status,
  q.total_submissions,
  q.total_reward_pool,
  q.seeded_amount,
  q.start_time,
  q.end_time,
  q.evaluation_deadline,
  q.submission_cost,
  q.max_winners,
  COALESCE(e.evaluated_at, NULL) as evaluated_at,
  CASE 
    WHEN NOW() > q.evaluation_deadline AND q.status != 'evaluated' THEN true
    ELSE false
  END as emergency_refund_available
FROM questions q
LEFT JOIN evaluations e ON q.question_id = e.question_id
LEFT JOIN creators c ON q.creator_id = c.creator_id;

CREATE VIEW creator_stats AS
SELECT 
  c.creator_id,
  c.wallet,
  c.username,
  c.reputation,
  c.total_questions_created,
  c.total_answers_submitted,
  c.total_rewards_earned,
  c.total_fees_earned,
  COALESCE(AVG(a.score), 0) as avg_answer_score,
  COUNT(DISTINCT q.question_id) as active_questions,
  c.last_activity
FROM creators c
LEFT JOIN questions q ON c.creator_id = q.creator_id AND q.status IN ('active', 'ended')
LEFT JOIN answers a ON c.creator_id = a.creator_id AND a.score > 0
GROUP BY c.creator_id, c.wallet, c.username, c.reputation, 
         c.total_questions_created, c.total_answers_submitted, 
         c.total_rewards_earned, c.total_fees_earned, c.last_activity;