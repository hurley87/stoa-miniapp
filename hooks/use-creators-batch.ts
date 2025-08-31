import { useQuery } from '@tanstack/react-query';

export type Creator = {
  creator_id: number;
  wallet: string;
  username: string | null;
  pfp: string | null;
  reputation: number;
  joined_at: string;
};

export type CreatorResult = {
  address: string;
  creator: Creator | null;
};

export type CreatorsBatchResponse = {
  creators: CreatorResult[];
};

async function fetchCreatorsBatch(addresses: string[]): Promise<CreatorsBatchResponse> {
  const response = await fetch('/api/creators/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ addresses }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch creator profiles');
  }

  return response.json();
}

export function useCreatorsBatch(addresses: string[]) {
  return useQuery({
    queryKey: ['creators-batch', addresses.sort()],
    queryFn: () => fetchCreatorsBatch(addresses),
    enabled: addresses.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}