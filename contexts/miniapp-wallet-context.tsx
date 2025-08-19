'use client';

import { farcasterFrame as miniAppConnector } from '@farcaster/miniapp-wagmi-connector';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createConfig,
  http,
  WagmiProvider,
  useAccount,
  useConnect,
} from 'wagmi';
import { base } from 'wagmi/chains';
import { hexToNumber } from 'viem';
import { useEffect } from 'react';

// Augment connector to ensure getChainId is available for wagmi v2 writes
const createAugmentedConnector = () => {
  const connector: any = miniAppConnector();
  if (typeof connector.getChainId !== 'function') {
    connector.getChainId = async () => {
      const provider = await connector.getProvider?.();
      if (!provider?.request) return base.id;
      const chainIdHex = await provider.request({ method: 'eth_chainId' });
      try {
        return typeof chainIdHex === 'string'
          ? hexToNumber(chainIdHex as `0x${string}`)
          : Number(chainIdHex);
      } catch {
        return base.id;
      }
    };
  }
  return connector;
};

export const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  connectors: [createAugmentedConnector()],
});

const queryClient = new QueryClient();

function AutoConnect() {
  const { status } = useAccount();
  const { connectors, connectAsync, isPending } = useConnect();

  useEffect(() => {
    const tryConnect = async () => {
      try {
        const preferred = connectors?.[0];
        if (!preferred) return;
        await connectAsync({ connector: preferred });
      } catch {
        // Silently ignore; user may not be in a Farcaster Mini app context
      }
    };

    if (status === 'disconnected' && !isPending) {
      void tryConnect();
    }
  }, [status, isPending, connectors, connectAsync]);

  return null;
}

export default function MiniAppWalletProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <AutoConnect />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
