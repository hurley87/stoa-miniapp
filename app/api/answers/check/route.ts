import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('questionId');
    const creatorId = searchParams.get('creatorId');

    if (!questionId || !creatorId) {
      return NextResponse.json(
        { error: 'Missing questionId or creatorId' },
        { status: 400 }
      );
    }

    // Validate creator ID format
    if (!/^\d+$/.test(creatorId)) {
      return NextResponse.json(
        { error: 'Invalid creatorId format' },
        { status: 400 }
      );
    }

    const creatorIdNum = parseInt(creatorId, 10);
    if (
      isNaN(creatorIdNum) ||
      creatorIdNum <= 0 ||
      creatorIdNum > Number.MAX_SAFE_INTEGER
    ) {
      return NextResponse.json({ error: 'Invalid creatorId' }, { status: 400 });
    }

    // Validate creator exists
    const { data: creator } = await supabase
      .from('creators')
      .select('creator_id')
      .eq('creator_id', creatorIdNum)
      .single();

    if (!creator) {
      return NextResponse.json({
        hasAnswered: false,
        answer: null,
      });
    }

    const { data, error } = await supabase
      .from('answers')
      .select('id, content, score, rank')
      .eq('question_id', questionId)
      .eq('creator_id', creator.creator_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to check answer' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      hasAnswered: !!data,
      answer: data || null,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
