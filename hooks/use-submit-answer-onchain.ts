import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { keccak256, encodePacked, parseUnits } from 'viem';
import { StoaQuestionABI } from '@/lib/abis/StoaQuestion';
import { ERC20ABI } from '@/lib/abis/ERC20';
import { useSubmitAnswer } from './use-submit-answer';
import { base } from 'wagmi/chains';

export type SubmitAnswerOnchainParams = {
  questionId: number;
  content: string;
  contractAddress: string;
  tokenAddress: string;
  submissionCost: number;
  creatorId: number;
  referrerAddress?: string | null;
};

export function useSubmitAnswerOnchain() {
  const [step, setStep] = useState<
    | 'idle'
    | 'checking-allowance'
    | 'approving'
    | 'submitting'
    | 'storing'
    | 'completed'
    | 'already-submitted'
  >('idle');
  const [error, setError] = useState<string | null>(null);
  const [, setApproveHash] = useState<string | null>(null);
  const [, setSubmitHash] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const submitAnswerMutation = useSubmitAnswer();

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
      return 'You are not whitelisted to submit answers yet.';
    }

    return raw || 'Transaction failed';
  };

  // We track hashes for UI/debugging, but we await receipts via the public client
  const normalizeTxHash = (value: unknown): string => {
    if (typeof value === 'string' && value.startsWith('0x')) return value;
    if (
      value &&
      typeof value === 'object' &&
      'hash' in (value as Record<string, unknown>) &&
      typeof (value as Record<string, unknown>).hash === 'string'
    ) {
      return (value as { hash: string }).hash;
    }
    throw new Error('Failed to obtain transaction hash');
  };

  const submit = async ({
    questionId,
    content,
    contractAddress,
    tokenAddress,
    submissionCost,
    creatorId,
    referrerAddress,
  }: SubmitAnswerOnchainParams) => {
    if (!address || !publicClient) {
      setError('Wallet not connected');
      return;
    }

    try {
      setError(null);
      setStep('checking-allowance');

      // 1. Generate answer hash
      const answerHash = keccak256(encodePacked(['string'], [content]));

      // 2. Check current allowance
      const allowance = await publicClient
        .readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20ABI,
          functionName: 'allowance',
          args: [address, contractAddress as `0x${string}`],
        })
        .catch((err) => {
          throw new Error(mapOnchainErrorToMessage(err));
        });

      const submissionCostBigInt = parseUnits(
        (submissionCost / 1e6).toString(),
        6
      ); // Convert to proper USDC amount

      // 3. Approve USDC spending if needed
      if (!allowance || allowance < submissionCostBigInt) {
        setStep('approving');

        const approvalTx = await writeContractAsync({
          address: tokenAddress as `0x${string}`,
          abi: ERC20ABI,
          functionName: 'approve',
          args: [contractAddress as `0x${string}`, submissionCostBigInt],
          chainId: base.id,
        }).catch((err) => {
          throw new Error(mapOnchainErrorToMessage(err));
        });

        const approvalTxHash = normalizeTxHash(approvalTx);
        setApproveHash(approvalTxHash);

        // Wait for approval transaction to be mined
        await publicClient.waitForTransactionReceipt({
          hash: approvalTxHash as `0x${string}`,
        });

        // Verify the allowance was updated by reading it again
        let attempts = 0;
        let updatedAllowance = allowance;
        while (updatedAllowance < submissionCostBigInt && attempts < 5) {
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second
          updatedAllowance = await publicClient
            .readContract({
              address: tokenAddress as `0x${string}`,
              abi: ERC20ABI,
              functionName: 'allowance',
              args: [address, contractAddress as `0x${string}`],
            })
            .catch((err) => {
              throw new Error(mapOnchainErrorToMessage(err));
            });
          attempts++;
        }

        if (updatedAllowance < submissionCostBigInt) {
          throw new Error(
            'Allowance not updated after approval. Please try again.'
          );
        }
      }

      // 4. Submit answer to contract
      setStep('submitting');

      // Submit answer using appropriate function based on referrer presence
      const submissionTx = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: StoaQuestionABI,
        functionName:
          referrerAddress && referrerAddress !== address
            ? 'submitAnswerWithReferral'
            : 'submitAnswer',
        args:
          referrerAddress && referrerAddress !== address
            ? [answerHash, referrerAddress as `0x${string}`]
            : [answerHash],
        chainId: base.id,
      }).catch((err) => {
        throw new Error(mapOnchainErrorToMessage(err));
      });

      const submissionTxHash = normalizeTxHash(submissionTx);
      setSubmitHash(submissionTxHash);

      // Wait for submission transaction to be mined
      await publicClient.waitForTransactionReceipt({
        hash: submissionTxHash as `0x${string}`,
      });

      // 5. Store in database
      setStep('storing');

      if (!submissionTxHash) {
        throw new Error('Missing transaction hash after submission');
      }

      await submitAnswerMutation.mutateAsync({
        questionId,
        creatorId,
        content,
        contractAddress,
        txHash: submissionTxHash,
        referrerAddress,
      });

      setStep('completed');
      // Ensure UI updates immediately
      queryClient.invalidateQueries({
        queryKey: ['answer-check', questionId, creatorId],
      });
      queryClient.invalidateQueries({
        queryKey: ['onchain-submission', contractAddress, address],
      });
      queryClient.invalidateQueries({ queryKey: ['question', questionId] });
      queryClient.invalidateQueries({ queryKey: ['questions', 'active'] });
      return { txHash: submissionTxHash };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      const lower = errorMessage.toLowerCase();
      const isAlready =
        lower.includes('already') &&
        (lower.includes('answered') || lower.includes('submitted'));
      if (isAlready) {
        setError('You have already submitted an answer');
        setStep('already-submitted');
        // Refresh answer-check & questions so UI reflects existing submission
        queryClient.invalidateQueries({
          queryKey: ['answer-check', questionId, address],
        });
        queryClient.invalidateQueries({
          queryKey: ['onchain-submission', contractAddress, address],
        });
        queryClient.invalidateQueries({ queryKey: ['question', questionId] });
        queryClient.invalidateQueries({ queryKey: ['questions', 'active'] });
      } else {
        setError(errorMessage);
        setStep('idle');
      }
      throw err;
    }
  };

  return {
    submit,
    step,
    error,
    isLoading: step !== 'idle' && step !== 'completed',
    reset: () => {
      setStep('idle');
      setError(null);
      setApproveHash(null);
      setSubmitHash(null);
    },
  };
}
