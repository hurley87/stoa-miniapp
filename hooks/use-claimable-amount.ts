import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';
import { StoaQuestionABI } from '@/lib/abis/StoaQuestion';

export function useClaimableAmount(contractAddress?: string) {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['claimable-amount', contractAddress, address],
    queryFn: async () => {
      if (!address || !publicClient || !contractAddress) {
        return BigInt(0);
      }

      try {
        const claimableAmount = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: StoaQuestionABI,
          functionName: 'getClaimableAmount',
          args: [address],
        });

        console.log('💰 Claimable Amount Check:', {
          contractAddress,
          userAddress: address,
          claimableAmount: claimableAmount.toString(),
          claimableFormatted: (Number(claimableAmount) / 1e6).toFixed(2),
        });

        return claimableAmount as bigint;
      } catch (error) {
        console.error('Error fetching claimable amount:', error);
        return BigInt(0);
      }
    },
    enabled: !!address && !!publicClient && !!contractAddress,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}