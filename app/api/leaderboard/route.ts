import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    
    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'total_earnings'; // total_earnings, creator_earnings, answerer_earnings, reputation
    
    // Build the query based on sortBy parameter
    let query = supabase
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
      .range(offset, offset + limit - 1);

    // Apply sorting
    switch (sortBy) {
      case 'creator_earnings':
        query = query.order('total_fees_earned', { ascending: false });
        break;
      case 'answerer_earnings':
        query = query.order('total_rewards_earned', { ascending: false });
        break;
      case 'reputation':
        query = query.order('reputation', { ascending: false });
        break;
      case 'total_questions':
        query = query.order('total_questions_created', { ascending: false });
        break;
      case 'total_answers':
        query = query.order('total_answers_submitted', { ascending: false });
        break;
      case 'total_earnings':
      default:
        // Calculate total earnings as sum of rewards and fees
        // Since we can't do calculations in the query, we'll sort by rewards first
        query = query.order('total_rewards_earned', { ascending: false });
        break;
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error fetching leaderboard:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leaderboard' },
        { status: 500 }
      );
    }

    // Calculate total earnings and add ranking
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

    // If sorting by total_earnings, re-sort the processed data
    if (sortBy === 'total_earnings') {
      processedData.sort((a, b) => {
        const aTotal = BigInt(a.total_earnings);
        const bTotal = BigInt(b.total_earnings);
        if (aTotal > bTotal) return -1;
        if (aTotal < bTotal) return 1;
        return 0;
      });
      
      // Update rankings after sorting
      processedData.forEach((creator, index) => {
        creator.rank = offset + index + 1;
      });
    }

    return NextResponse.json({
      success: true,
      data: processedData,
      pagination: {
        limit,
        offset,
        has_more: data?.length === limit
      },
      sort: sortBy
    });

  } catch (err) {
    console.error('Unexpected error fetching leaderboard:', err);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}