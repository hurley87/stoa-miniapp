import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { STOA_FACTORY_ADDRESS } from '@/lib/abis/StoaFactory';
import { StoaQuestionABI } from '@/lib/abis/StoaQuestion';
import { sendBulkNotification } from '@/lib/bulk-notifications';
import { z } from 'zod';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const BodySchema = z.object({
  questionId: z.number().int().nonnegative(),
  questionContent: z.string().trim().min(1).max(150),
  txHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/),
  blockNumber: z.number().int().nonnegative().optional(),
  creatorId: z.number().int().positive(),
  token: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  submissionCost: z.string().regex(/^\d+$/),
  duration: z
    .number()
    .int()
    .min(60)
    .max(24 * 60 * 60), // 1 minute to 24 hours
  maxWinners: z.number().int().min(1).max(10),
  seedAmount: z.string().regex(/^\d+$/),
  questionContract: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  evaluationPrompt: z.string().trim().min(10).max(1000),
});

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Create public client for reading contract data
const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL),
});

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

    // Ensure creator exists using creator_id
    const { data: existingCreator } = await supabase
      .from('creators')
      .select('creator_id, wallet')
      .eq('creator_id', body.creatorId)
      .single();

    if (!existingCreator) {
      // Cannot create question without a valid creator
      // Creator must be registered through sign-in first
      return NextResponse.json(
        {
          error:
            'Invalid creator ID. Creator must sign in and complete profile before creating questions',
        },
        { status: 400 }
      );
    }

    // Read the actual end time from the contract
    let contractEndTime: bigint;
    try {
      contractEndTime = await publicClient.readContract({
        address: body.questionContract as `0x${string}`,
        abi: StoaQuestionABI,
        functionName: 'endsAt',
      }) as bigint;
    } catch (err) {
      console.error('Failed to read end time from contract:', err);
      return NextResponse.json(
        { error: 'Failed to read question data from contract' },
        { status: 500 }
      );
    }

    const startTime = new Date();
    const endTime = new Date(Number(contractEndTime) * 1000); // Convert from Unix timestamp
    const evaluationDeadline = new Date(
      endTime.getTime() + 7 * 24 * 60 * 60 * 1000
    );

    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .insert({
        question_id: body.questionId,
        contract_address: body.questionContract.toLowerCase(),
        creator_id: body.creatorId,
        creator: existingCreator.wallet, // Keep for backward compatibility
        content: body.questionContent,
        token_address: body.token.toLowerCase(),
        submission_cost: body.submissionCost,
        max_winners: body.maxWinners,
        duration: body.duration,
        evaluator: existingCreator.wallet,
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
        evaluation_prompt: body.evaluationPrompt,
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
      creator: existingCreator.wallet,
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

    // Send notifications to all creators about the new question
    try {
      // Get creator's info for the notification
      const { data: creatorInfo } = await supabase
        .from('creators')
        .select('fid, username')
        .eq('creator_id', body.creatorId)
        .single();

      const creatorFid = creatorInfo?.fid;
      const creatorName = creatorInfo?.username || 'Someone';

      // Format duration for display
      const formatDuration = (seconds: number) => {
        if (seconds < 3600) {
          const minutes = Math.floor(seconds / 60);
          return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
        } else if (seconds < 86400) {
          const hours = Math.floor(seconds / 3600);
          return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
        } else {
          const days = Math.floor(seconds / 86400);
          return `${days} ${days === 1 ? 'day' : 'days'}`;
        }
      };

      const durationText = formatDuration(body.duration);

      await sendBulkNotification({
        title: 'New question posted!',
        body: `${creatorName} asked: "${body.questionContent.substring(0, 80)}${
          body.questionContent.length > 80 ? '...' : ''
        }" - Answer within ${durationText}`,
        excludeFid: creatorFid || undefined,
      });
    } catch (notificationError) {
      // Non-fatal - don't fail the entire request if notifications fail
      console.warn(
        'Warning: failed to send notifications for new question',
        notificationError
      );
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
