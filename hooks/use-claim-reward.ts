'use client';

import { useAccount, usePublicClient, useWriteContract } from 'wagmi';
import { base } from 'wagmi/chains';
import { STOA_FACTORY_ABI, STOA_FACTORY_ADDRESS } from '@/lib/abis/StoaFactory';
import { useState } from 'react';

export function useClaimReward() {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    if (combined.includes('no reward to claim')) {
      return 'You have no rewards to claim for this question.';
    }
    if (combined.includes('already claimed')) {
      return 'You have already claimed your reward for this question.';
    }

    return raw || 'Transaction failed';
  };

  const checkClaimableAmount = async (): Promise<{
    amount: number;
    canClaim: boolean;
    hasClaimed: boolean;
  }> => {
    if (!address || !publicClient)
      return { amount: 0, canClaim: false, hasClaimed: false };

    try {
      // Use the factory contract to check claimable amount
      const claimableAmount = await publicClient.readContract({
        address: STOA_FACTORY_ADDRESS,
        abi: STOA_FACTORY_ABI,
        functionName: 'getClaimableAmount',
        args: [address],
      });

      // Check if user has already claimed
      const hasClaimed = await publicClient.readContract({
        address: STOA_FACTORY_ADDRESS,
        abi: STOA_FACTORY_ABI,
        functionName: 'hasClaimed',
        args: [address],
      });

      console.log('claimableAmount', claimableAmount);
      console.log('hasClaimed', hasClaimed);

      const amountInUsdc = Number(claimableAmount || 0) / 1000000; // Convert from USDC 6 decimals

      return {
        amount: amountInUsdc,
        canClaim: amountInUsdc > 0 && !hasClaimed,
        hasClaimed: Boolean(hasClaimed),
      };
    } catch (error) {
      console.error('Error checking claimable amount:', error);
      return { amount: 0, canClaim: false, hasClaimed: false };
    }
  };

  const claimReward = async (): Promise<{
    txHash: string;
    amount: number;
    hasClaimed: boolean;
  }> => {
    if (!address) throw new Error('Wallet not connected');
    if (!publicClient) throw new Error('Network not available');

    setIsLoading(true);
    setError(null);

    try {
      // First check if there's anything to claim
      const { amount, canClaim, hasClaimed } = await checkClaimableAmount();

      console.log('amount', amount);
      console.log('canClaim', canClaim);
      console.log('hasClaimed', hasClaimed);

      if (!canClaim) {
        if (hasClaimed) {
          throw new Error('You have already claimed your rewards');
        }
        throw new Error('No rewards available to claim');
      }

      // Execute claim transaction using the factory contract
      const txHash = await writeContractAsync({
        address: STOA_FACTORY_ADDRESS,
        abi: STOA_FACTORY_ABI,
        chainId: base.id,
        functionName: 'claimRewards',
        args: [],
      });

      // Wait for transaction confirmation
      await publicClient.waitForTransactionReceipt({
        hash: txHash as `0x${string}`,
      });

      // Verify the claim was successful
      const verifyResult = await checkClaimableAmount();

      return {
        txHash: txHash as string,
        amount,
        hasClaimed: verifyResult.hasClaimed,
      };
    } catch (err) {
      const errorMessage = mapOnchainErrorToMessage(err);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const checkHasClaimed = async (): Promise<boolean> => {
    if (!address || !publicClient) return false;

    try {
      const hasClaimed = await publicClient.readContract({
        address: STOA_FACTORY_ADDRESS,
        abi: STOA_FACTORY_ABI,
        functionName: 'hasClaimed',
        args: [address],
      });

      return Boolean(hasClaimed);
    } catch (error) {
      console.error('Error checking claim status:', error);
      return false;
    }
  };

  return {
    claimReward,
    checkClaimableAmount,
    checkHasClaimed,
    isLoading,
    error,
    reset: () => setError(null),
  };
}
