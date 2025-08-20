import { NextRequest, NextResponse } from 'next/server';
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
      .select('*')
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

    return NextResponse.json(data);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
