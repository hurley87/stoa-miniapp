import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const evaluationResultSchema = z.object({
  address: z.string(),
  response: z.string(),
  reward_amount: z.number().min(0),
  reward_reason: z.string(),
});

const evaluationSchema = z.object({
  results: z.array(evaluationResultSchema),
});

type EvaluationResult = z.infer<typeof evaluationResultSchema>;

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const questionId = Number(context.params.id);
    const body = await request.json();

    if (Number.isNaN(questionId)) {
      return NextResponse.json(
        { error: 'Invalid question id' },
        { status: 400 }
      );
    }

    const { actualRewardPool } = body;
    if (!actualRewardPool || actualRewardPool <= 0) {
      return NextResponse.json(
        { error: 'Valid reward pool amount required' },
        { status: 400 }
      );
    }

    // Get question details including evaluation prompt
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('question_id', questionId)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Get all answers for this question
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select(
        `
        *,
        creators:creators!fk_answers_creator (
          wallet,
          username
        )
      `
      )
      .eq('question_id', questionId);

    if (answersError) {
      console.error('Error fetching answers:', answersError);
      return NextResponse.json(
        { error: 'Failed to fetch answers' },
        { status: 500 }
      );
    }

    if (!answers || answers.length === 0) {
      return NextResponse.json(
        { error: 'No answers found to evaluate' },
        { status: 400 }
      );
    }

    // Prepare answers for evaluation
    const answersToEvaluate = answers.map((answer, index) => ({
      index: index + 1,
      address: (answer as any).creators?.wallet || answer.responder,
      content: answer.content,
    }));

    // Use the actual reward pool from contract (already in USDC)
    const availableRewards = actualRewardPool;

    // Create evaluation prompt
    const evaluationPrompt = `
Question: ${question.content}

Evaluation Instructions: ${question.evaluation_prompt}

CRITICAL REQUIREMENTS:
- Total Reward Pool Available: ${availableRewards.toFixed(2)} USDC (fees already collected)
- Maximum Winners: ${question.max_winners}
- YOU MUST DISTRIBUTE ALL ${availableRewards.toFixed(2)} USDC - no tokens can remain unallocated
- The sum of all reward_amount values MUST EQUAL exactly ${availableRewards.toFixed(2)}
- At least one answer must receive a reward (cannot all be 0)
- You can distribute rewards among ${Math.min(question.max_winners, answersToEvaluate.length)} answers maximum

Please evaluate the following answers and assign rewards that total exactly ${availableRewards.toFixed(2)} USDC:

Answers to evaluate:
${answersToEvaluate
  .map((a) => `${a.index}. Address: ${a.address}\nAnswer: ${a.content}`)
  .join('\n\n')}

For each answer, provide:
- address: The exact wallet address of the responder
- response: The exact answer content
- reward_amount: Amount in USDC (must sum to exactly ${availableRewards.toFixed(2)} across all answers)
- reward_reason: Brief explanation for the reward decision

VALIDATION: Before responding, verify that the sum of all reward_amount values equals exactly ${availableRewards.toFixed(2)} USDC.
`;

    // Use Vercel AI generateObject for structured output
    const { object } = await generateObject({
      model: openai('gpt-4o'),
      schema: evaluationSchema,
      system:
        "You are an expert evaluator. Analyze answers based on the given criteria and return structured results. Be fair, thorough, and ensure reward amounts don't exceed the available pool.",
      prompt: evaluationPrompt,
      temperature: 0.3,
    });

    const evaluationResults = object.results;

    // Validate that all tokens are distributed
    const totalDistributed = evaluationResults.reduce((sum, result) => sum + result.reward_amount, 0);
    const expectedTotal = availableRewards;
    
    if (Math.abs(totalDistributed - expectedTotal) > 0.01) {
      console.error(`Token distribution validation failed. Expected: ${expectedTotal}, Got: ${totalDistributed}`);
      return NextResponse.json(
        { 
          error: `Token distribution error: Expected ${expectedTotal.toFixed(2)} USDC, but got ${totalDistributed.toFixed(2)} USDC. All tokens must be distributed.` 
        },
        { status: 400 }
      );
    }

    // Save AI evaluation results to database
    const updates = evaluationResults.map(result => {
      const answer = answers.find(a => 
        ((a as any).creators?.wallet || a.responder) === result.address
      );
      
      if (!answer) {
        console.warn(`Answer not found for address: ${result.address}`);
        return null;
      }

      return {
        id: answer.id,
        ai_reward_amount: result.reward_amount,
        ai_reward_reason: result.reward_reason,
        ai_evaluated_at: new Date().toISOString(),
        evaluation_status: 'ai_evaluated',
        // Initialize creator fields with AI values (creator can modify later)
        creator_reward_amount: result.reward_amount,
        creator_reward_reason: result.reward_reason,
      };
    }).filter(Boolean);

    // Update answers with AI evaluation results
    for (const update of updates) {
      if (update) {
        const { error: updateError } = await supabase
          .from('answers')
          .update(update)
          .eq('id', update.id);

        if (updateError) {
          console.error('Error updating answer evaluation:', updateError);
        }
      }
    }

    return NextResponse.json({
      question_id: questionId,
      question_content: question.content,
      total_submissions: answers.length,
      evaluation_results: evaluationResults,
    });
  } catch (error) {
    console.error('Evaluation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
