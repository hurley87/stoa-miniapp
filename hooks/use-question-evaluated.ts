import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { StoaQuestionABI } from '@/lib/abis/StoaQuestion';

export function useQuestionEvaluated(contractAddress: string | undefined) {
  const client = usePublicClient();

  return useQuery({
    queryKey: ['question-evaluated', contractAddress],
    enabled: !!client && !!contractAddress,
    queryFn: async () => {
      if (!client || !contractAddress) return false;
      
      try {
        const isEvaluated = (await client.readContract({
          address: contractAddress as `0x${string}`,
          abi: StoaQuestionABI,
          functionName: 'evaluated',
          args: [],
        })) as boolean;

        return isEvaluated;
      } catch (error) {
        console.error('Error fetching evaluation status:', error);
        return false;
      }
    },
    staleTime: 60_000, // Cache for 60 seconds
    refetchInterval: 30_000, // Auto-refetch every 30 seconds
  });
}