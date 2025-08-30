import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { StoaQuestionABI } from '@/lib/abis/StoaQuestion';

export function useTotalRewardValue(contractAddress: string | undefined) {
  const client = usePublicClient();

  return useQuery({
    queryKey: ['total-reward-value', contractAddress],
    enabled: !!client && !!contractAddress,
    queryFn: async () => {
      if (!client || !contractAddress) return 0;
      
      try {
        const totalRewardValue = (await client.readContract({
          address: contractAddress as `0x${string}`,
          abi: StoaQuestionABI,
          functionName: 'getTotalRewardValue',
          args: [],
        })) as bigint;

        // Convert from smallest unit to USDC (6 decimals)
        return Number(totalRewardValue) / 1e6;
      } catch (error) {
        console.error('Error fetching total reward value:', error);
        return 0;
      }
    },
    staleTime: 30_000, // Cache for 30 seconds
    refetchInterval: 30_000, // Auto-refetch every 30 seconds
  });
}