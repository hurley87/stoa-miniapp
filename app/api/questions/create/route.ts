import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { STOA_FACTORY_ADDRESS } from '@/lib/abis/StoaFactory';
import { z } from 'zod';

const BodySchema = z.object({
  questionId: z.number().int().nonnegative(),
  questionContent: z.string().trim().min(1).max(150),
  txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  blockNumber: z.number().int().nonnegative().optional(),
  creator: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  submissionCost: z.string().regex(/^\d+$/),
  duration: z.union([z.literal(3600), z.literal(86400), z.literal(604800)]),
  maxWinners: z.literal(3),
  seedAmount: z.string().regex(/^\d+$/),
  questionContract: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
});

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Invalid body' },
        { status: 400 }
      );
    }
    const body = parsed.data;

    // Ensure user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('wallet')
      .eq('wallet', body.creator.toLowerCase())
      .single();

    if (!existingUser) {
      const { error: userError } = await supabase.from('users').insert({
        wallet: body.creator.toLowerCase(),
        joined_at: new Date().toISOString(),
        last_activity: new Date().toISOString(),
      });
      if (userError) {
        console.error('Error creating user:', userError);
        return NextResponse.json(
          { error: 'Failed to create user' },
          { status: 500 }
        );
      }
    }

    const startTime = new Date();
    const endTime = new Date(
      startTime.getTime() + Number(body.duration) * 1000
    );
    const evaluationDeadline = new Date(
      endTime.getTime() + 7 * 24 * 60 * 60 * 1000
    );

    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .insert({
        question_id: body.questionId,
        contract_address: body.questionContract.toLowerCase(),
        creator: body.creator.toLowerCase(),
        content: body.questionContent,
        token_address: body.token.toLowerCase(),
        submission_cost: body.submissionCost,
        max_winners: body.maxWinners,
        duration: body.duration,
        evaluator: body.creator.toLowerCase(),
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        evaluation_deadline: evaluationDeadline.toISOString(),
        seeded_amount: body.seedAmount,
        total_reward_pool: '0',
        total_submissions: 0,
        protocol_fees_collected: '0',
        creator_fees_collected: '0',
        status: 'active',
        creation_tx_hash: body.txHash,
      })
      .select()
      .single();

    if (questionError) {
      console.error('Supabase error (insert question):', questionError);
      return NextResponse.json(
        { error: 'Failed to save question' },
        { status: 500 }
      );
    }

    // Save contract event (best-effort)
    const eventData = {
      questionId: Number(body.questionId),
      creator: (body.creator as string).toLowerCase(),
      questionContract: (body.questionContract as string).toLowerCase(),
      token: (body.token as string).toLowerCase(),
      submissionCost: String(body.submissionCost),
      duration: Number(body.duration),
      maxWinners: Number(body.maxWinners),
      seedAmount: String(body.seedAmount ?? '0'),
    };

    const { error: eventError } = await supabase
      .from('contract_events')
      .insert({
        contract_address: STOA_FACTORY_ADDRESS.toLowerCase(),
        event_name: 'QuestionCreated',
        block_number: Number(body.blockNumber ?? 0),
        tx_hash: body.txHash,
        event_data: eventData,
        processed: true,
      });
    if (eventError) {
      // Non-fatal
      console.warn('Warning: could not store contract event', eventError);
    }

    return NextResponse.json({ success: true, question: questionData });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
