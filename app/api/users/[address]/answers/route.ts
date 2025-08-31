import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  _request: NextRequest,
  { params }: { params: { address: string } }
) {
  const address = params.address.toLowerCase();

  try {
    // Fetch user's answers with question details and creator info
    const { data: answers, error } = await supabase
      .from('answers')
      .select(
        `
        id,
        content,
        score,
        rank,
        reward_amount,
        ai_reward_amount,
        creator_reward_amount,
        ai_reward_reason,
        creator_reward_reason,
        rewarded,
        timestamp,
        created_at,
        evaluation_status,
        questions:question_id (
          question_id,
          content,
          status,
          start_time,
          end_time,
          evaluated_at,
          max_winners,
          creator,
          creators:creators!fk_questions_creator (
            username,
            pfp
          )
        )
      `
      )
      .eq('responder', address)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user answers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch user answers' },
        { status: 500 }
      );
    }

    // Calculate summary statistics
    const totalAnswers = answers?.length || 0;
    const totalEarnings =
      answers?.reduce((sum, answer) => {
        const earnings =
          answer.creator_reward_amount ||
          answer.ai_reward_amount ||
          answer.reward_amount ||
          0;
        return sum + parseFloat(earnings.toString());
      }, 0) || 0;

    const scoredAnswers = answers?.filter((a) => a.score > 0) || [];
    const averageScore =
      scoredAnswers.length > 0
        ? scoredAnswers.reduce((sum, a) => sum + a.score, 0) /
          scoredAnswers.length
        : 0;

    const rankedAnswers = answers?.filter((a) => a.rank && a.rank > 0) || [];
    const topRankedAnswers = rankedAnswers.filter((a) => a.rank === 1);

    // Flatten the nested creator data for easier frontend consumption
    const formattedAnswers = answers?.map((answer) => {
      const question = answer.questions;
      const creators =
        question && 'creators' in question ? (question as any).creators : null;
      return {
        ...answer,
        question: question
          ? {
              ...question,
              creator_username: creators?.[0]?.username || null,
              creator_pfp: creators?.[0]?.pfp || null,
            }
          : null,
      };
    });

    return NextResponse.json({
      answers: formattedAnswers,
      stats: {
        totalAnswers,
        totalEarnings: Math.round(totalEarnings * 100) / 100, // Round to 2 decimal places
        averageScore: Math.round(averageScore * 10) / 10, // Round to 1 decimal place
        scoredAnswers: scoredAnswers.length,
        rankedAnswers: rankedAnswers.length,
        topRankedAnswers: topRankedAnswers.length,
        answersWithRewards:
          answers?.filter(
            (a) =>
              (a.creator_reward_amount && a.creator_reward_amount > 0) ||
              (a.ai_reward_amount && a.ai_reward_amount > 0) ||
              (a.reward_amount && a.reward_amount > 0)
          ).length || 0,
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
