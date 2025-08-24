'use client';

import { useCallback, useState } from 'react';

interface CopyAddressProps {
  address: string;
}

export function CopyAddress({ address }: CopyAddressProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const shortenAddress = (
    value: string,
    leading: number = 6,
    trailing: number = 4
  ): string => {
    if (!value) return '';
    if (value.length <= leading + trailing + 3) return value;
    return `${value.slice(0, leading)}…${value.slice(-trailing)}`;
  };

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(address);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 1500);
    } catch {
      // Silently ignore copy errors to avoid noisy UX in this minimal control
    }
  }, [address]);

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="mt-1 text-sm text-white/60 hover:text-white/80 focus:outline-none focus:ring-2 focus:ring-white/20 rounded px-1"
      title={hasCopied ? 'Copied!' : 'Click to copy address'}
    >
      {hasCopied ? 'Copied!' : shortenAddress(address)}
    </button>
  );
}
