import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: { address: string } }
) {
  const address = params.address;
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return NextResponse.json({ error: 'Invalid address' }, { status: 400 });
  }
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('users')
      .select(
        'wallet, username, pfp, reputation, total_questions_created, total_answers_submitted'
      )
      .eq('wallet', address.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Supabase error fetching user by wallet', error);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Map DB -> profile shape expected by profile page
    const profile = {
      username: data.username ?? null,
      display_name: data.username ?? null,
      pfp_url: data.pfp ?? '',
      follower_count: 0,
      following_count: 0,
      profile: { bio: { text: '' } },
    };
    return NextResponse.json(profile);
  } catch (err) {
    console.error('Unexpected error fetching user by wallet', err);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}
