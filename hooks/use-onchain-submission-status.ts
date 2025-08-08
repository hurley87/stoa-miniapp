import { useQuery } from '@tanstack/react-query';
import { usePublicClient } from 'wagmi';
import { StoaQuestionABI } from '@/lib/abis/StoaQuestion';

type OnchainAnswer = {
  responder: `0x${string}`;
  answerHash: `0x${string}`;
  timestamp: bigint;
  score: bigint;
  rewarded: boolean;
};

export function useOnchainSubmissionStatus(
  contractAddress: string | undefined,
  userAddress: `0x${string}` | undefined
) {
  const client = usePublicClient();

  return useQuery({
    queryKey: ['onchain-submission', contractAddress, userAddress],
    enabled: !!client && !!contractAddress && !!userAddress,
    queryFn: async () => {
      if (!client || !contractAddress || !userAddress)
        return { hasSubmitted: false };
      try {
        const answer = (await client.readContract({
          address: contractAddress as `0x${string}`,
          abi: StoaQuestionABI,
          functionName: 'getUserAnswer',
          args: [userAddress],
        })) as OnchainAnswer;

        const zeroAddress = '0x0000000000000000000000000000000000000000';
        const hasSubmitted =
          answer && answer.responder?.toLowerCase() !== zeroAddress;
        return { hasSubmitted, answer };
      } catch {
        return { hasSubmitted: false };
      }
    },
    staleTime: 60_000,
  });
}
