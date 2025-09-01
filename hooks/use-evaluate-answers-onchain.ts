import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWriteContract } from 'wagmi';
import { StoaQuestionABI } from '@/lib/abis/StoaQuestion';
import { base } from 'wagmi/chains';

export type EvaluateAnswersOnchainParams = {
  contractAddress: string;
  rankedIndices: number[];
  questionId?: number;
};

export function useEvaluateAnswersOnchain() {
  const [step, setStep] = useState<'idle' | 'evaluating' | 'completed'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { writeContractAsync } = useWriteContract();

  const mapOnchainErrorToMessage = (err: unknown): string => {
    const raw = String(
      (err &&
        typeof err === 'object' &&
        'message' in err &&
        (err as any).message) ||
        err
    );

    if (raw.includes('Already evaluated')) {
      return 'This question has already been evaluated onchain.';
    }
    if (raw.includes('Question not ended')) {
      return 'Question must be ended before evaluation.';
    }
    if (raw.includes('Only creator')) {
      return 'Only the question creator can evaluate answers.';
    }
    if (raw.includes('Invalid indices')) {
      return 'Invalid answer indices provided.';
    }
    if (raw.includes('User rejected')) {
      return 'Transaction was rejected by user.';
    }

    return raw.length > 200 ? 'Transaction failed. Please try again.' : raw;
  };

  const normalizeTxHash = (hash: string): string => {
    return hash.startsWith('0x') ? hash : `0x${hash}`;
  };

  const reset = () => {
    setStep('idle');
    setError(null);
    setTxHash(null);
  };

  const submit = async ({
    contractAddress,
    rankedIndices,
    questionId,
  }: EvaluateAnswersOnchainParams) => {
    try {
      reset();
      setStep('evaluating');

      // Convert indices to BigInt array for contract call
      const rankedIndicesBigInt = rankedIndices.map((index) => BigInt(index));

      // Call evaluateAnswers on the contract
      const evaluationTx = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: StoaQuestionABI,
        functionName: 'evaluateAnswers',
        args: [rankedIndicesBigInt],
        chainId: base.id,
      }).catch((err) => {
        throw new Error(mapOnchainErrorToMessage(err));
      });

      const evaluationTxHash = normalizeTxHash(evaluationTx);
      setTxHash(evaluationTxHash);

      // Update question status to 'evaluated' and set evaluation fields
      if (rankedIndices.length > 0) {
        try {
          const updateResponse = await fetch(
            '/api/questions/update-evaluation-status',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                contractAddress,
                evaluationTxHash,
                evaluatedAt: new Date().toISOString(),
              }),
            }
          );

          if (!updateResponse.ok) {
            console.error('Failed to update question evaluation status');
          }
        } catch (updateError) {
          console.error('Error updating question status:', updateError);
        }
      }

      setStep('completed');

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['total-reward-value', contractAddress],
      });
      // Invalidate evaluation status so UI updates immediately
      queryClient.invalidateQueries({
        queryKey: ['question-evaluated', contractAddress],
      });
      // Invalidate question data to refresh status
      if (questionId) {
        queryClient.invalidateQueries({
          queryKey: ['question', questionId],
        });
        queryClient.invalidateQueries({
          queryKey: ['questions', 'active'],
        });
      }

      return { txHash: evaluationTxHash };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setStep('idle');
      throw err;
    }
  };

  const isLoading = step !== 'idle' && step !== 'completed';

  return {
    submit,
    step,
    error,
    txHash,
    isLoading,
    reset,
  };
}
