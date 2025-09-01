import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { StoaQuestionABI } from '@/lib/abis/StoaQuestion';

export function useContractSubmissionCost(contractAddress?: string) {
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['contract-submission-cost', contractAddress],
    queryFn: async () => {
      if (!contractAddress || !publicClient) {
        return BigInt(0);
      }

      try {
        const submissionCost = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: StoaQuestionABI,
          functionName: 'submissionCost',
        });

        return submissionCost as bigint;
      } catch (error) {
        console.error('Error fetching contract submission cost:', error);
        return BigInt(0);
      }
    },
    enabled: !!contractAddress && !!publicClient,
  });
}