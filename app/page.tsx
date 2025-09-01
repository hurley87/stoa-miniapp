import HomePage from '@/components/pages/home';
import { env } from '@/lib/env';
import { Metadata } from 'next';

const appUrl = env.NEXT_PUBLIC_URL;

const frame = {
  version: 'next',
  imageUrl: `${appUrl}/images/feed.png`,
  button: {
    title: 'Launch App',
    action: {
      type: 'launch_frame',
      name: 'Stoa',
      url: appUrl,
      splashImageUrl: `${appUrl}/images/logo.png`,
      splashBackgroundColor: '#ffffff',
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: 'Stoa — Where questions shape discourse',
    openGraph: {
      title: 'Stoa — Where questions shape discourse',
      description: 'Ask. Answer. Earn. A forum of ideas built onchain.',
    },
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  };
}

export default function Home() {
  return <HomePage />;
}
