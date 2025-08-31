import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { addresses } = body;

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return NextResponse.json(
        { error: 'Valid addresses array required' },
        { status: 400 }
      );
    }

    // Normalize addresses to lowercase
    const normalizedAddresses = addresses.map((addr: string) => addr.toLowerCase());

    // Fetch creator profiles for the provided addresses
    const { data: creators, error } = await supabase
      .from('creators')
      .select('creator_id, wallet, username, pfp, reputation, joined_at')
      .in('wallet', normalizedAddresses);

    if (error) {
      console.error('Error fetching creators:', error);
      return NextResponse.json(
        { error: 'Failed to fetch creator profiles' },
        { status: 500 }
      );
    }

    // Create a map for easy lookup
    const creatorMap: Record<string, any> = {};
    creators?.forEach(creator => {
      creatorMap[creator.wallet.toLowerCase()] = creator;
    });

    // Return results in the same order as requested addresses
    const results = normalizedAddresses.map(address => ({
      address,
      creator: creatorMap[address] || null,
    }));

    return NextResponse.json({ creators: results });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}