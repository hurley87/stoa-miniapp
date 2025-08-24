'use client';

import { MiniAppProvider } from '@/contexts/miniapp-context';
import { UserProvider } from '@/contexts/user-context';
import MiniAppWalletProvider from '@/contexts/miniapp-wallet-context';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MiniAppWalletProvider>
      <MiniAppProvider addMiniAppOnLoad={true}>
        <UserProvider autoSignIn={false}>{children}</UserProvider>
      </MiniAppProvider>
    </MiniAppWalletProvider>
  );
}
