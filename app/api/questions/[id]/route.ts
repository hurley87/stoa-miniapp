import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
import { createClient } from '@supabase/supabase-js';

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

    if (!idParam || Number.isNaN(questionId)) {
      return NextResponse.json(
        { error: 'Invalid question id' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('questions')
      .select(
        `
        *,
        creators:creators!fk_questions_creator (
          username,
          pfp,
          fid
        )
      `
      )
      .eq('question_id', questionId)
      .single();

    if (error) {
      if ((error as { code?: string }).code === 'PGRST116') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch question' },
        { status: 500 }
      );
    }

    // Ensure total_submissions reflects current answers count
    const { count, error: countError } = await supabase
      .from('answers')
      .select('*', { count: 'exact', head: true })
      .eq('question_id', questionId);

    if (countError) {
      console.error('Supabase count error:', countError);
    }

    const merged = {
      ...data,
      total_submissions:
        typeof count === 'number'
          ? count
          : (data as any).total_submissions ?? 0,
      creator_username: (data as any)?.creators?.username ?? null,
      creator_pfp: (data as any)?.creators?.pfp ?? null,
      creator_fid: (data as any)?.creators?.fid ?? null,
    };

    return NextResponse.json(merged, {
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
