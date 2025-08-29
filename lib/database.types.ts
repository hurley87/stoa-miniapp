export interface Creator {
  creator_id: number;
  wallet: string;
  fid: number | null;
  username: string | null;
  pfp: string | null;
  reputation: number;
  joined_at: string;
  total_questions_created: number;
  total_answers_submitted: number;
  total_rewards_earned: string;
  total_fees_earned: string;
  last_activity: string;
}

export interface Question {
  question_id: number;
  contract_address: string;
  creator_id: number;
  creator: string; // Keep for backward compatibility during migration
  creator_username: string | null;
  creator_pfp: string | null;
  content: string;
  token_address: string;
  submission_cost: string;
  max_winners: number;
  duration: number;
  evaluator: string;
  start_time: string;
  end_time: string;
  evaluation_deadline: string;
  seeded_amount: string;
  total_reward_pool: string;
  total_submissions: number;
  protocol_fees_collected: string;
  creator_fees_collected: string;
  status: string;
  creation_tx_hash: string;
  evaluation_prompt: string;
}

export interface Answer {
  id: number;
  answer_index: number;
  question_id: number;
  contract_address: string;
  creator_id: number;
  responder: string; // Keep for backward compatibility during migration
  answer_hash: string;
  content: string;
  timestamp: string;
  submission_tx_hash: string;
  score: number | null;
  feedback: string | null;
}

export interface CreatorWithFid {
  creator_id: number;
  fid: number;
  username: string | null;
}