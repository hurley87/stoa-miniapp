import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contractAddress, evaluationTxHash, evaluatedAt } = body;

    if (!contractAddress || !evaluationTxHash || !evaluatedAt) {
      return NextResponse.json(
        { error: 'Missing required fields: contractAddress, evaluationTxHash, evaluatedAt' },
        { status: 400 }
      );
    }

    // First, get the question to find the creator and reward amount
    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .select('creator_id, creator_fees_collected')
      .eq('contract_address', contractAddress)
      .single();

    if (questionError || !questionData) {
      console.error('Error fetching question data:', questionError);
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Update the question status to 'evaluated' and set evaluation fields
    const { data, error } = await supabase
      .from('questions')
      .update({
        status: 'evaluated',
        evaluated_at: evaluatedAt,
        evaluation_tx_hash: evaluationTxHash,
      })
      .eq('contract_address', contractAddress)
      .select();

    if (error) {
      console.error('Error updating question evaluation status:', error);
      return NextResponse.json(
        { error: 'Failed to update question status' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Question not found' },
        { status: 404 }
      );
    }

    // Note: total_rewards_earned will be calculated by a cron job that 
    // sums all creator_reward_amount values from the answers table

    return NextResponse.json({
      success: true,
      question: data[0],
    });

  } catch (error) {
    console.error('Update evaluation status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}