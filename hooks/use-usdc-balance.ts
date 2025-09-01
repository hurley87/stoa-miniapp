import { useQuery } from '@tanstack/react-query';
import { useAccount, usePublicClient } from 'wagmi';
import { ERC20ABI } from '@/lib/abis/ERC20';

export function useUSDCBalance(tokenAddress?: string) {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  return useQuery({
    queryKey: ['usdc-balance', address, tokenAddress],
    queryFn: async () => {
      if (!address || !publicClient || !tokenAddress) {
        return BigInt(0);
      }

      try {
        const balance = await publicClient.readContract({
          address: tokenAddress as `0x${string}`,
          abi: ERC20ABI,
          functionName: 'balanceOf',
          args: [address],
        });

        return balance as bigint;
      } catch (error) {
        console.error('Error fetching USDC balance:', error);
        return BigInt(0);
      }
    },
    enabled: !!address && !!publicClient && !!tokenAddress,
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}