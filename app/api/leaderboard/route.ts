import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    
    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    // Always sort by total_rewards_earned only
    const query = supabase
      .from('creators')
      .select(`
        creator_id,
        wallet,
        username,
        pfp,
        reputation,
        total_questions_created,
        total_answers_submitted,
        total_rewards_earned,
        total_fees_earned,
        joined_at,
        last_activity
      `)
      .order('total_rewards_earned', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching leaderboard:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    // Add ranking (already sorted by total_rewards_earned)
    const processedData = data?.map((creator, index) => {
      const rewardsEarned = BigInt(creator.total_rewards_earned?.toString() || '0');
      const feesEarned = BigInt(creator.total_fees_earned?.toString() || '0');
      const totalEarnings = rewardsEarned + feesEarned;

      return {
        ...creator,
        rank: offset + index + 1,
        total_earnings: totalEarnings.toString(),
        total_rewards_earned_formatted: rewardsEarned.toString(),
        total_fees_earned_formatted: feesEarned.toString()
      };
    }) || [];

    return NextResponse.json({
      success: true,
      data: processedData,
      pagination: {
        limit,
        offset,
        has_more: data?.length === limit
      },
      sort: 'total_rewards_earned'
    });

  } catch (err) {
    console.error('Unexpected error fetching leaderboard:', err);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}