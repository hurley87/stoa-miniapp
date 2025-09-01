'use client';

import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { Address, decodeEventLog, parseUnits } from 'viem';
import { base } from 'wagmi/chains';
import { STOA_FACTORY_ABI, STOA_FACTORY_ADDRESS } from '@/lib/abis/StoaFactory';

export type CreateQuestionParams = {
  questionContent: string; // <= 150 chars
  durationSeconds: number; // 3600 | 86400 | 604800
  tokenAddress?: Address; // default USDC
  submissionCostUsd?: number; // default 1 USD (USDC 6 decimals)
  maxWinners?: number; // default 3
  seedAmount?: bigint; // default BigInt(0)
};

export type CreateQuestionResult = {
  questionId: number;
  questionContract: Address;
  txHash: `0x${string}`;
  blockNumber: number;
};

export function useCreateQuestionOnchain() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const mapOnchainErrorToMessage = (err: unknown): string => {
    const raw = String(
      (err &&
        typeof err === 'object' &&
        'message' in err &&
        (err as any).message) ||
        err
    );
    const details =
      (err &&
        typeof err === 'object' &&
        'details' in err &&
        (err as any).details) ||
      '';
    const meta =
      (err &&
        typeof err === 'object' &&
        'metaMessages' in err &&
        (err as any).metaMessages?.join('\n')) ||
      '';
    const combined = `${raw}\n${details}\n${meta}`.toLowerCase();

    if (combined.includes('whitelist') || combined.includes('notwhitelisted')) {
      return 'You are not whitelisted to create questions yet.';
    }

    return raw || 'Transaction failed';
  };

  const create = async (
    params: CreateQuestionParams
  ): Promise<CreateQuestionResult> => {
    if (!address) throw new Error('Wallet not connected');
    if (!publicClient) throw new Error('Wallet not connected');
    const token = (params.tokenAddress ??
      '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913') as Address; // USDC Base
    const submissionCost = parseUnits(String(params.submissionCostUsd ?? 1), 6);
    const duration = BigInt(params.durationSeconds);
    const maxWinners = BigInt(params.maxWinners ?? 3);
    const seedAmount = BigInt(params.seedAmount ?? BigInt(0));

    let nextId: bigint;
    try {
      // Get next question id
      nextId = (await publicClient.readContract({
        address: STOA_FACTORY_ADDRESS,
        abi: STOA_FACTORY_ABI,
        functionName: 'questionCount',
      })) as bigint;
    } catch (err) {
      throw new Error(mapOnchainErrorToMessage(err));
    }

    let txHash: `0x${string}` | string;
    try {
      // Create question on-chain
      txHash = await writeContractAsync({
        address: STOA_FACTORY_ADDRESS,
        abi: STOA_FACTORY_ABI,
        chainId: base.id,
        functionName: 'createQuestion',
        args: [token, submissionCost, duration, Number(maxWinners), seedAmount],
      });
    } catch (err) {
      throw new Error(mapOnchainErrorToMessage(err));
    }

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

    const log = receipt.logs.find(
      (l) => l.address.toLowerCase() === STOA_FACTORY_ADDRESS.toLowerCase()
    );
    if (!log) throw new Error('QuestionCreated event not found');

    const decoded = decodeEventLog({
      abi: STOA_FACTORY_ABI,
      data: log.data,
      topics: log.topics,
    });
    const questionContract = (decoded.args as any).question as Address;
    return {
      questionId: Number(nextId),
      questionContract,
      txHash: txHash as `0x${string}`,
      blockNumber: Number(receipt.blockNumber),
    };
  };

  return { create };
}
