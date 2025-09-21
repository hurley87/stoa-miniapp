'use client';

import { sdk } from '@farcaster/miniapp-sdk';

interface ShareWinButtonProps {
  claimedAmount?: string;
  questionId?: number;
  justClaimed?: boolean;
}

export default function ShareWinButton({
  claimedAmount,
  questionId,
  justClaimed = false
}: ShareWinButtonProps) {
  const handleShare = async () => {
    try {
      const url = questionId
        ? `${window.location.origin}/questions/${questionId}`
        : `${window.location.origin}`;

      let text: string;
      if (claimedAmount && justClaimed) {
        text = `I just claimed ${claimedAmount} USDC for my thoughtful answer! 💰`;
      } else if (claimedAmount) {
        text = `I just claimed ${claimedAmount} USDC! 💰 Try it yourself!`;
      } else {
        text = `I just won USDC for my thoughtful answer! 💰`;
      }

      const result = await sdk.actions.composeCast({
        text,
        embeds: [url],
      });

      if (!result?.cast) {
        await navigator.clipboard.writeText(url);
      }
    } catch (err) {
      console.error('Error composing cast:', err);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="cta-button w-full"
    >
      Share your win! 🎉
    </button>
  );
}