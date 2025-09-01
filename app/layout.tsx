import Providers from '@/components/providers';
import Header from '@/components/header';
import Footer from '@/components/footer';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Stoa - The onchain knowledge game',
  description:
    'Drop Prompts. Fire Back. Win Rewards. KOLs drop prompts, Reply Guys fire back. The best takes win rewards.',
};

export const viewport = {
  themeColor: '#1a1a2e',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} scrollbar-hidden`}>
        <Providers>
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
