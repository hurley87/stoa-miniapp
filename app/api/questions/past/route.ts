import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
  try {
    // Fetch past questions (ended, evaluated, or emergency) with embedded creator meta
    const { data, error } = await supabase
      .from('questions')
      .select(`*, creators:creators!fk_questions_creator (username, pfp)`)
      .in('status', ['ended', 'evaluated', 'emergency'])
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Supabase error (past questions with creators):', error);
      return NextResponse.json(
        { error: 'Failed to fetch past questions' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json([], {
        headers: {
          'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
        },
      });
    }

    // Flatten embedded creator meta to preserve API response shape
    type RowWithCreator = Record<string, unknown> & {
      creators?: { username: string | null; pfp: string | null } | null;
    };
    const results = (data as RowWithCreator[]).map(({ creators, ...rest }) => ({
      ...rest,
      creator_username: creators?.username ?? null,
      creator_pfp: creators?.pfp ?? null,
    }));

    return NextResponse.json(results, {
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