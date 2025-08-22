import { env } from '@/lib/env';

export interface NeynarUser {
  fid: string;
  username: string;
  display_name: string;
  pfp_url: string;
  custody_address: string;
  verifications: string[];
}

export class NeynarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NeynarError';
  }
}

export const fetchUser = async (fid: string): Promise<NeynarUser> => {
  const response = await fetch(
    `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
    {
      headers: {
        'x-api-key': env.NEYNAR_API_KEY!,
      },
    }
  );
  if (!response.ok) {
    console.error(
      'Failed to fetch Farcaster user on Neynar',
      await response.json()
    );
    throw new NeynarError('Failed to fetch Farcaster user on Neynar');
  }
  const data = await response.json();
  const users: unknown = (data as any)?.users;
  if (!Array.isArray(users) || users.length === 0 || users[0] == null) {
    throw new NeynarError('Neynar returned no users for provided fid');
  }
  return users[0] as NeynarUser;
};
