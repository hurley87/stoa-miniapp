import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('questionId')
    const userWallet = searchParams.get('userWallet')

    if (!questionId || !userWallet) {
      return NextResponse.json(
        { error: 'Missing questionId or userWallet' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('answers')
      .select('id, content, score, rank')
      .eq('question_id', questionId)
      .eq('responder', userWallet)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to check answer' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      hasAnswered: !!data,
      answer: data || null
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}