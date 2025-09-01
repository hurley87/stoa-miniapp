// app/lib/copy.ts
export const COPY = {
 
  brand: 'Stoa',
 
  tagline: 'The Knowledge Game',
 
  loop: 'Drop Prompts. Fire Back. Win Rewards.',
 
  judgeClarifier:
    'AI Judge ranks. Whitelisted Human Judges finalize and can adjust earnings.',
 
  tokenStructure: [
    '10% → Protocol Treasury',
    '10% → KOL (Prompt Creator)',
    '5% → Referrer (if provided)',
    '75% → Prize Pool (for top replies)',
  ],
 
  terms: {
    prompt: 'Prompt',
    reply: 'Reply',
    replies: 'Replies',
    kolFirst: 'KOL (Prompt Creator)',
    kol: 'KOL',
    game: 'Game',
    judging: 'Judging',
    aiJudge: 'AI Judge',
    humanJudge: 'Whitelisted Human Judge',
    prizePool: 'Prize Pool',
    entryFee: 'Entry Fee',
  },
 
  ctas: {
    startGame: 'Start a Game',
    dropPrompt: 'Drop a Prompt',
    payToReply: 'Pay to Reply',
    postReply: 'Post Reply',
    viewJudging: 'View Judging',
    claimRewards: 'Claim Rewards',
    applyKOL: 'Apply to be a KOL',
    applyJudge: 'Apply to be a Judge',
  },
 
  empty: {
    games: 'No open games yet. Be the first to Drop a Prompt.',
    promptNoReplies: 'Be the first Reply Guy. Pay to Reply and make your move.',
    rewards: 'No rewards yet—rank in the top replies to claim.',
  },
 
  toasts: {
    submitted: 'Reply received. Judging begins when the timer ends.',
    aiLive: 'AI scores are live. Awaiting Whitelisted Human Judge review.',
    finalized: 'Judging finalized. Rewards are ready to claim.',
    referral: 'Referral applied. 5% credited to your referrer.',
  },
} as const;
