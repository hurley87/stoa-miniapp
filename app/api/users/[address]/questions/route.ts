import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  const { address } = params;

  try {
    // Fetch user's created questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        id,
        question_id,
        contract_address,
        token_address,
        submission_cost,
        max_winners,
        duration,
        evaluator,
        start_time,
        end_time,
        evaluation_deadline,
        seeded_amount,
        total_reward_pool,
        total_submissions,
        protocol_fees_collected,
        creator_fees_collected,
        status,
        content
      `)
      .eq('creator', address.toLowerCase())
      .order('start_time', { ascending: false });

    if (questionsError) {
      console.error('Error fetching user questions:', questionsError);
      return NextResponse.json(
        { error: 'Failed to fetch questions' },
        { status: 500 }
      );
    }

    // Calculate stats
    const totalQuestions = questions?.length || 0;
    const activeQuestions = questions?.filter(q => q.status === 'active').length || 0;
    const totalSubmissions = questions?.reduce((sum, q) => sum + (q.total_submissions || 0), 0) || 0;
    const totalFeesEarned = questions?.reduce((sum, q) => 
      sum + parseFloat(q.creator_fees_collected || '0'), 0
    ) || 0;

    return NextResponse.json({
      questions: questions || [],
      stats: {
        totalQuestions,
        activeQuestions,
        totalSubmissions,
        totalFeesEarned: totalFeesEarned / 1000000, // Convert from USDC 6 decimals to dollars
      },
    });
  } catch (error) {
    console.error('Error in user questions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}