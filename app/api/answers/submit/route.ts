import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      questionId,
      creatorId,
      content,
      contractAddress,
      txHash,
      referrerAddress,
    } = body;

    if (!questionId || !creatorId || !content || !contractAddress || !txHash) {
      return NextResponse.json(
        { error: 'Missing required fields (including transaction hash)' },
        { status: 400 }
      );
    }

    // TODO: Verify the transaction hash is valid and corresponds to answer submission
    // This would involve checking the blockchain to ensure:
    // 1. Transaction exists and is confirmed
    // 2. Transaction called the correct contract method
    // 3. Transaction was from the specified user wallet
    // 4. Payment was made correctly

    // Ensure creator exists in creators table using creator_id
    const { data: existingCreator } = await supabase
      .from('creators')
      .select('creator_id, wallet')
      .eq('creator_id', creatorId)
      .single();

    if (!existingCreator) {
      // Cannot submit answer without a valid creator
      // Creator must be registered through sign-in first
      return NextResponse.json(
        {
          error:
            'Invalid creator ID. You must sign in and complete your profile before submitting answers',
        },
        { status: 400 }
      );
    }

    // Check if creator already answered this question
    const { data: existingAnswer } = await supabase
      .from('answers')
      .select('id')
      .eq('question_id', questionId)
      .eq('creator_id', creatorId)
      .single();

    if (existingAnswer) {
      return NextResponse.json(
        { error: 'You have already answered this question' },
        { status: 400 }
      );
    }

    // Generate answer hash (similar to how it would be done on-chain)
    const answerHash = createHash('sha256').update(content).digest('hex');

    // Get next answer index for this question
    const { data: answerCount } = await supabase
      .from('answers')
      .select('answer_index')
      .eq('question_id', questionId)
      .order('answer_index', { ascending: false })
      .limit(1);

    const nextIndex =
      answerCount && answerCount.length > 0
        ? answerCount[0].answer_index + 1
        : 0;

    // Insert new answer
    const { data, error } = await supabase
      .from('answers')
      .insert({
        answer_index: nextIndex,
        question_id: questionId,
        contract_address: contractAddress,
        creator_id: creatorId,
        responder: existingCreator.wallet, // Keep for backward compatibility
        answer_hash: answerHash,
        content,
        timestamp: new Date().toISOString(),
        submission_tx_hash: txHash,
        referrer_address: referrerAddress || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to submit answer' },
        { status: 500 }
      );
    }

    // Update question submission count
    const { data: currentQuestion } = await supabase
      .from('questions')
      .select('total_submissions')
      .eq('question_id', questionId)
      .single();

    if (currentQuestion) {
      const { error: updateError } = await supabase
        .from('questions')
        .update({
          total_submissions: (currentQuestion.total_submissions || 0) + 1,
        })
        .eq('question_id', questionId);

      if (updateError) {
        console.error('Error updating submission count:', updateError);
      }
    }

    return NextResponse.json({
      success: true,
      answer: data,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
