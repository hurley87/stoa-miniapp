import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  _request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const idParam = context.params.id;
    const questionId = Number(idParam);
    console.log('questionId', questionId);

    if (!idParam || Number.isNaN(questionId)) {
      return NextResponse.json(
        { error: 'Invalid question id' },
        { status: 400 }
      );
    }

    // Fetch answers with creator details and evaluation results
    const { data, error } = await supabase
      .from('answers')
      .select(
        `
        id,
        answer_index,
        content,
        timestamp,
        score,
        rank,
        reward_amount,
        ai_reward_amount,
        creator_reward_amount,
        ai_reward_reason,
        creator_reward_reason,
        evaluation_status,
        creator_id,
        creators!fk_answers_creator (
          username,
          pfp,
          wallet
        )
      `
      )
      .eq('question_id', questionId)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch answers' },
        { status: 500 }
      );
    }

    // Transform the data to include creator details at the top level
    console.log('Raw data from Supabase:', JSON.stringify(data, null, 2));
    const transformedAnswers = (data || []).map((answer) => {
      console.log('Processing answer:', answer);

      // Handle both single object and array cases for creator data
      let creator: {
        username: string | null;
        pfp: string | null;
        wallet: string;
      } | null = null;

      if (answer.creators) {
        if (Array.isArray(answer.creators)) {
          creator = answer.creators[0] || null;
        } else {
          creator = answer.creators as {
            username: string | null;
            pfp: string | null;
            wallet: string;
          };
        }
      }

      console.log('Creator found:', creator);

      const transformed = {
        id: answer.id,
        answer_index: answer.answer_index,
        content: answer.content,
        timestamp: answer.timestamp,
        score: answer.score,
        rank: answer.rank,
        reward_amount: answer.reward_amount,
        ai_reward_amount: answer.ai_reward_amount,
        creator_reward_amount: answer.creator_reward_amount,
        ai_reward_reason: answer.ai_reward_reason,
        creator_reward_reason: answer.creator_reward_reason,
        evaluation_status: answer.evaluation_status,
        username: creator?.username || null,
        pfp: creator?.pfp || null,
        wallet: creator?.wallet || null,
      };
      console.log('Transformed answer:', transformed);
      return transformed;
    });
    console.log('Final transformed answers:', transformedAnswers);

    return NextResponse.json(transformedAnswers, {
      headers: {
        'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
