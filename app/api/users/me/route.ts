import { fetchUser, NeynarError } from '@/lib/neynar';
import { getSupabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const fid = request.headers.get('x-user-fid');

  if (!fid) {
    return NextResponse.json({ error: 'Missing user fid' }, { status: 401 });
  }

  try {
    const user = await fetchUser(fid);

    // Get creator information from database using fid
    let creatorData = null;
    const supabase = getSupabaseAdmin();

    // Validate FID format
    if (!/^\d+$/.test(fid)) {
      return NextResponse.json(
        { error: 'Invalid FID format' },
        { status: 400 }
      );
    }

    const fidNum = parseInt(fid, 10);
    if (isNaN(fidNum) || fidNum <= 0 || fidNum > Number.MAX_SAFE_INTEGER) {
      return NextResponse.json({ error: 'Invalid FID' }, { status: 400 });
    }

    const { data: creator } = await supabase
      .from('creators')
      .select(
        'creator_id, wallet, username, pfp, reputation, total_questions_created, total_answers_submitted'
      )
      .eq('fid', fidNum)
      .single();

    creatorData = creator;

    return NextResponse.json({
      ...user,
      creator: creatorData,
    });
  } catch (err) {
    if (err instanceof NeynarError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
