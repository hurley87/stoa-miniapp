'use client';

import ShareWinButton from '@/components/share-win-button';

interface ClaimRewardsSectionProps {
  claimableAmount: bigint;
  formatUSDC: (amount: bigint) => string;
  handleClaimReward: () => void;
  isClaiming: boolean;
  claimError?: string | null;
  claimStep: string;
  questionId?: number;
}

export default function ClaimRewardsSection({
  claimableAmount,
  formatUSDC,
  handleClaimReward,
  isClaiming,
  claimError,
  claimStep,
  questionId,
}: ClaimRewardsSectionProps) {
  if (claimableAmount > BigInt(0)) {
    // Has claimable rewards
    return (
      <>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-emerald-300 font-semibold">
              🎉 You have rewards to claim!
            </p>
            <p className="text-emerald-200/60 text-sm">
              {formatUSDC(claimableAmount)} USDC available
            </p>
          </div>
        </div>

        <button
          onClick={handleClaimReward}
          disabled={isClaiming}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-colors"
        >
          {isClaiming ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/60 border-t-transparent mr-2" />
              Claiming...
            </span>
          ) : (
            `Claim ${formatUSDC(claimableAmount)} USDC`
          )}
        </button>

        {claimError && (
          <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-950/50 p-3">
            <p className="text-rose-200 text-sm">{claimError}</p>
          </div>
        )}

        {claimStep === 'completed' && (
          <div className="mt-3 space-y-3">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/50 p-3">
              <p className="text-emerald-200 text-sm">
                🎉 Reward claimed successfully!
              </p>
            </div>
            <ShareWinButton
              claimedAmount={formatUSDC(claimableAmount)}
              questionId={questionId}
              justClaimed={true}
            />
          </div>
        )}
      </>
    );
  }

  // Already claimed (claimableAmount === 0)
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-emerald-300 font-semibold">🎉 Rewards claimed!</p>
          <p className="text-emerald-200/60 text-sm">
            You&apos;ve successfully claimed your rewards
          </p>
        </div>
      </div>
      <ShareWinButton questionId={questionId} />
    </div>
  );
}
