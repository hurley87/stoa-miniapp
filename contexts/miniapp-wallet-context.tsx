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
import { useEffect, useRef } from 'react';
import { useDisconnect } from 'wagmi';

// Augment connector to ensure getChainId is available for wagmi v2 writes
const createAugmentedConnector = () => {
  const connector: any = miniAppConnector();
  if (typeof connector.getChainId !== 'function') {
    connector.getChainId = async () => {
      try {
        const provider =
          typeof connector.getProvider === 'function'
            ? await connector.getProvider()
            : undefined;
        if (!provider || typeof provider.request !== 'function') return base.id;
        const chainIdHex = await provider.request({ method: 'eth_chainId' });
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
    [base.id]: http(process.env.NEXT_PUBLIC_RPC_URL),
  },
  connectors: [createAugmentedConnector()],
  ssr: true,
});

const queryClient = new QueryClient();

function AutoConnect() {
  const { status } = useAccount();
  const { connectors, connectAsync, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const hasAttemptedRef = useRef(false);

  useEffect(() => {
    const tryConnect = async () => {
      try {
        const preferred = connectors?.[0];
        if (!preferred) return;

        const timeoutMs = 5000;
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('connect-timeout')), timeoutMs)
        );

        await Promise.race([
          connectAsync({ connector: preferred, chainId: base.id }),
          timeout,
        ]);
      } catch {
        // On error or timeout, ensure we reset any stuck pending state
        try {
          disconnect();
        } catch {}
      } finally {
        hasAttemptedRef.current = true;
      }
    };

    if (status === 'disconnected' && !isPending && !hasAttemptedRef.current) {
      void tryConnect();
    }
  }, [status, isPending, connectors, connectAsync, disconnect]);

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
