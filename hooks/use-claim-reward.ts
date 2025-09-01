import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { StoaQuestionABI } from '@/lib/abis/StoaQuestion';
import { base } from 'wagmi/chains';

export function useClaimReward() {
  const [step, setStep] = useState<
    | 'idle'
    | 'claiming'
    | 'completed'
  >('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const queryClient = useQueryClient();

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

    if (combined.includes('no claimable') || combined.includes('nothing to claim')) {
      return 'No rewards available to claim.';
    }
    if (combined.includes('already claimed')) {
      return 'Rewards have already been claimed.';
    }

    return raw || 'Transaction failed';
  };

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

  const claimReward = async (contractAddress: string) => {
    if (!address || !publicClient) {
      setError('Wallet not connected');
      return;
    }

    try {
      setError(null);
      setStep('claiming');

      console.log('🎁 Starting reward claim:', {
        contractAddress,
        userAddress: address,
      });

      // Call claimReward on the contract
      const claimTx = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: StoaQuestionABI,
        functionName: 'claimReward',
        args: [],
        chainId: base.id,
      }).catch((err) => {
        throw new Error(mapOnchainErrorToMessage(err));
      });

      const claimTxHash = normalizeTxHash(claimTx);
      setTxHash(claimTxHash);

      // Wait for transaction to be mined
      await publicClient.waitForTransactionReceipt({
        hash: claimTxHash as `0x${string}`,
      });

      console.log('✅ Reward claimed successfully:', {
        txHash: claimTxHash,
        contractAddress,
      });

      setStep('completed');

      // Invalidate relevant queries
      queryClient.invalidateQueries({
        queryKey: ['claimable-amount', contractAddress, address],
      });
      queryClient.invalidateQueries({
        queryKey: ['usdc-balance', address],
      });

      return { txHash: claimTxHash };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setStep('idle');
      throw err;
    }
  };

  return {
    claimReward,
    step,
    error,
    txHash,
    isLoading: step === 'claiming',
    reset: () => {
      setStep('idle');
      setError(null);
      setTxHash(null);
    },
  };
}
