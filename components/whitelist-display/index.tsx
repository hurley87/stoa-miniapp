'use client';

import { useAccount } from 'wagmi';
import { useWhitelistStatus } from '@/hooks/use-whitelist-status';
import { useCreatorsBatch } from '@/hooks/use-creators-batch';

interface WhitelistDisplayProps {
  title?: string;
  className?: string;
}

export default function WhitelistDisplay({ 
  title = "Whitelisted Creators",
  className = ""
}: WhitelistDisplayProps) {
  const { address } = useAccount();
  const { accountsWithStatus, isLoading: isLoadingWhitelist } = useWhitelistStatus();
  
  // Get all addresses to fetch creator profiles
  const addresses = accountsWithStatus.map(account => account.address);
  const { data: creatorsData, isLoading: isLoadingCreators } = useCreatorsBatch(addresses);

  const truncateAddress = (addr: string) =>
    addr && addr.startsWith('0x')
      ? `${addr.slice(0, 6)}…${addr.slice(-4)}`
      : addr;

  // Helper to get creator data for an address
  const getCreatorForAddress = (address: string) => {
    return creatorsData?.creators.find(c => c.address === address)?.creator || null;
  };

  const getInitial = (text: string) => (text?.[0] ?? '?').toUpperCase();
  
  const isLoading = isLoadingWhitelist || isLoadingCreators;

  return (
    <div className={`glass-card p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
        {title}
      </h3>
      
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-amber-400 border-t-transparent" />
          <span className="ml-2 text-white/80 text-sm">Loading whitelist...</span>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-white/70 text-sm mb-4">
            Only the following addresses can create questions on the platform:
          </p>
          {accountsWithStatus.map((account) => {
            const creator = getCreatorForAddress(account.address);
            const displayName = creator?.username || truncateAddress(account.address);
            
            return (
              <div 
                key={account.address}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  account.isWhitelisted 
                    ? 'bg-emerald-500/10 border-emerald-500/20' 
                    : 'bg-red-500/10 border-red-500/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    account.isWhitelisted ? 'bg-emerald-400' : 'bg-red-400'
                  }`}></div>
                  
                  {/* Profile Picture */}
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
                  
                  {/* User Info */}
                  <div>
                    <p className="text-sm font-medium text-white">
                      {creator?.username || 'Anonymous'}
                    </p>
                    <p className="font-mono text-xs text-white/60">
                      {truncateAddress(account.address)}
                    </p>
                    {address?.toLowerCase() === account.address && (
                      <p className="text-xs text-amber-300 font-medium">You</p>
                    )}
                    {creator && !creator.username && (
                      <p className="text-xs text-white/40">No profile</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    account.isWhitelisted
                      ? 'text-emerald-300 bg-emerald-500/20'
                      : 'text-red-300 bg-red-500/20'
                  }`}>
                    {account.isWhitelisted ? 'Whitelisted' : 'Not Whitelisted'}
                  </span>
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

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-blue-200 text-xs">
          <strong>Note:</strong> This list shows known addresses and their whitelist status read directly from the StoaFactory contract. 
          To request whitelist access, please contact an admin.
        </p>
      </div>
    </div>
  );
}