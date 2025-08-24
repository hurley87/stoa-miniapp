import { env } from '@/lib/env';

export interface NeynarUser {
  object?: 'user';
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  custody_address: string;
  pro?: {
    status: 'subscribed' | 'trialing' | 'none';
    subscribed_at?: string;
    expires_at?: string;
  };
  profile?: { bio?: { text?: string } };
  follower_count?: number;
  following_count?: number;
  verifications: string[];
  verified_addresses?: {
    eth_addresses?: string[];
    sol_addresses?: string[];
    primary?: {
      eth_address?: string;
      sol_address?: string;
    };
  };
  auth_addresses?: Array<{
    address: string;
    app?: unknown;
  }>;
  verified_accounts?: Array<{ platform: string; username: string }>;
  power_badge?: boolean;
  experimental?: { neynar_user_score?: number; deprecation_notice?: string };
  score?: number;
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
  const users = (data as { users?: NeynarUser[] }).users;
  if (!Array.isArray(users) || users.length === 0 || users[0] == null) {
    throw new NeynarError('Neynar returned no users for provided fid');
  }
  return users[0];
};
