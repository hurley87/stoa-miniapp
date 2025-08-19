import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { questionId, userWallet, content, contractAddress, txHash } = body;

    if (!questionId || !userWallet || !content || !contractAddress || !txHash) {
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

    // Ensure user exists in users table
    const { data: existingUser } = await supabase
      .from('users')
      .select('wallet')
      .eq('wallet', userWallet)
      .single();

    if (!existingUser) {
      // Create user if they don't exist
      const { error: userError } = await supabase
        .from('users')
        .insert({
          wallet: userWallet,
          joined_at: new Date().toISOString(),
          last_activity: new Date().toISOString()
        });

      if (userError) {
        console.error('Error creating user:', userError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }
    }

    // Check if user already answered this question
    const { data: existingAnswer } = await supabase
      .from('answers')
      .select('id')
      .eq('question_id', questionId)
      .eq('responder', userWallet)
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
        responder: userWallet,
        answer_hash: answerHash,
        content,
        timestamp: new Date().toISOString(),
        submission_tx_hash: txHash,
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
    await supabase.rpc('increment_submissions', {
      question_id: questionId,
    });

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
