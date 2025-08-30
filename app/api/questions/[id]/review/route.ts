import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const { evaluations, actualRewardPool } = body;

    if (!Array.isArray(evaluations)) {
      return NextResponse.json(
        { error: 'Evaluations must be an array' },
        { status: 400 }
      );
    }

    if (!actualRewardPool || actualRewardPool <= 0) {
      return NextResponse.json(
        { error: 'Valid reward pool amount required' },
        { status: 400 }
      );
    }

    // Validate that all tokens are distributed
    const totalDistributed = evaluations.reduce(
      (sum, evaluation) => sum + (evaluation.reward_amount || 0),
      0
    );
    // Use actual reward pool from contract (already in USDC)
    const expectedTotal = actualRewardPool;

    if (Math.abs(totalDistributed - expectedTotal) > 0.01) {
      return NextResponse.json(
        {
          error: `All tokens must be distributed. Expected: ${expectedTotal.toFixed(
            2
          )} USDC, Got: ${totalDistributed.toFixed(2)} USDC`,
        },
        { status: 400 }
      );
    }

    // Update each answer with creator's evaluation
    const updates = await Promise.all(
      evaluations.map(async (evaluation) => {
        const { answer_id, reward_amount, reward_reason } = evaluation;

        const { error } = await supabase
          .from('answers')
          .update({
            creator_reward_amount: reward_amount,
            creator_reward_reason: reward_reason,
            creator_evaluated_at: new Date().toISOString(),
            evaluation_status: 'creator_reviewed',
          })
          .eq('id', answer_id)
          .eq('question_id', questionId); // Extra security check

        if (error) {
          console.error('Error updating creator evaluation:', error);
          throw error;
        }

        return { answer_id, success: true };
      })
    );

    return NextResponse.json({
      message: 'Creator evaluation saved successfully',
      updated_count: updates.length,
    });
  } catch (error) {
    console.error('Review API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const questionId = Number(context.params.id);

    if (Number.isNaN(questionId)) {
      return NextResponse.json(
        { error: 'Invalid question id' },
        { status: 400 }
      );
    }

    // Get all answers with evaluation data for this question
    const { data: answers, error } = await supabase
      .from('answers')
      .select(
        `
        id,
        answer_index,
        content,
        responder,
        ai_reward_amount,
        ai_reward_reason,
        ai_evaluated_at,
        creator_reward_amount,
        creator_reward_reason,
        creator_evaluated_at,
        evaluation_status,
        creators:creators!fk_answers_creator (
          wallet,
          username
        )
      `
      )
      .eq('question_id', questionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching answers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch answers' },
        { status: 500 }
      );
    }

    const formattedAnswers =
      answers?.map((answer) => ({
        id: answer.id,
        answer_index: answer.answer_index,
        content: answer.content,
        address: (answer as any).creators?.wallet || answer.responder,
        username: (answer as any).creators?.username,
        ai_reward_amount: answer.ai_reward_amount,
        ai_reward_reason: answer.ai_reward_reason,
        ai_evaluated_at: answer.ai_evaluated_at,
        creator_reward_amount: answer.creator_reward_amount,
        creator_reward_reason: answer.creator_reward_reason,
        creator_evaluated_at: answer.creator_evaluated_at,
        evaluation_status: answer.evaluation_status,
      })) || [];

    return NextResponse.json({
      question_id: questionId,
      answers: formattedAnswers,
    });
  } catch (error) {
    console.error('Review GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
