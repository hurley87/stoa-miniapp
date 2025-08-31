'use client';

import { useWhitelistStatus } from '@/hooks/use-whitelist-status';
import { useCreatorsBatch } from '@/hooks/use-creators-batch';

interface WhitelistDisplayProps {
  title?: string;
  className?: string;
}

export default function WhitelistDisplay({
  title = 'Creators',
  className = '',
}: WhitelistDisplayProps) {
  const { accountsWithStatus, isLoading: isLoadingWhitelist } =
    useWhitelistStatus();

  // Get all addresses to fetch creator profiles
  const addresses = accountsWithStatus.map((account) => account.address);
  const { data: creatorsData, isLoading: isLoadingCreators } =
    useCreatorsBatch(addresses);

  const truncateAddress = (addr: string) =>
    addr && addr.startsWith('0x')
      ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
      : addr;

  // Helper to get creator data for an address
  const getCreatorForAddress = (address: string) => {
    return (
      creatorsData?.creators.find((c) => c.address === address)?.creator || null
    );
  };

  const getInitial = (text: string) => (text?.[0] ?? '?').toUpperCase();

  const isLoading = isLoadingWhitelist || isLoadingCreators;

  const isAnonymousUsername = (username?: string | null) => {
    if (!username) return true;
    const trimmed = username.trim();
    if (trimmed.length === 0) return true;
    return /^anonymous(_|$)/i.test(trimmed);
  };

  return (
    <div className={`glass-card p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        {title}
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-400 border-t-transparent" />
          <span className="ml-2 text-white/80 text-sm">
            Loading whitelist...
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-white/70 text-sm mb-4">
            Only the following addresses can create questions on the platform:
          </p>
          {accountsWithStatus.map((account) => {
            const creator = getCreatorForAddress(account.address);
            const displayName =
              creator?.username || truncateAddress(account.address);
            const isAnon = isAnonymousUsername(creator?.username ?? null);

            if (isAnon) {
              return null;
            }

            return (
              <div
                key={account.address}
                className={`flex items-center justify-between p-3 rounded-lg border `}
              >
                <div className="flex items-center gap-3">
                  {/* Profile Picture (hidden for anonymous profiles) */}
                  {!isAnon && (
                    <div className="flex-shrink-0">
                      {creator?.pfp ? (
                        <img
                          src={creator.pfp}
                          alt={`${displayName}'s avatar`}
                          className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500/30 to-amber-300/20 ring-1 ring-white/10 flex items-center justify-center text-sm font-semibold text-slate-100">
                          {getInitial(displayName)}
                        </div>
                      )}
                    </div>
                  )}

                  {/* User Info */}
                  <div>
                    {!isAnon && (
                      <p className="text-sm font-medium text-white">
                        {creator?.username}
                      </p>
                    )}
                    <p className="font-mono text-xs text-white/60">
                      {truncateAddress(account.address)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {accountsWithStatus.length === 0 && (
            <div className="text-center py-8 text-white/60">
              <p className="text-sm">No accounts found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
