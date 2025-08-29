-- Add evaluation_prompt column to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS evaluation_prompt text;

-- Add a default constraint for evaluation_prompt if it's null
UPDATE questions 
SET evaluation_prompt = 'You are an expert evaluator tasked with ranking answers to the given question. Evaluate each answer based on accuracy, completeness, clarity, and relevance to the question. Rank the answers from best to worst, providing a score from 1-10 for each answer and explaining your reasoning.'
WHERE evaluation_prompt IS NULL;