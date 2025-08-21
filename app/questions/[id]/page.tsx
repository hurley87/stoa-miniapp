import dynamic from 'next/dynamic';
import { Metadata } from 'next';
import { env } from '@/lib/env';

const QuestionPageClient = dynamic(
  () => import('@/components/pages/question'),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-10 w-10 rounded-full border-2 border-amber-400 border-t-transparent" />
      </div>
    ),
  }
);

export default function QuestionPage({ params }: { params: { id: string } }) {
  return <QuestionPageClient idParam={params.id} />;
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const appUrl = env.NEXT_PUBLIC_URL;
  const questionId = params.id;

  // Best-effort fetch to set a meaningful title; fail soft if API unavailable
  let title = `Question #${questionId}`;
  try {
    const res = await fetch(`${appUrl}/api/questions/${questionId}`, {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.content && typeof data.content === 'string') {
        title = data.content.slice(0, 120);
      }
    }
  } catch {
    console.log('title', title);
  }

  const frame = {
    version: 'next',
    imageUrl: `${appUrl}/api/og/question/${questionId}`,
    button: {
      title: 'Answer to Earn',
      action: {
        type: 'launch_frame',
        name: 'Stoa',
        url: `${appUrl}/questions/${questionId}`,
        splashImageUrl: `${appUrl}/images/splash.png`,
        splashBackgroundColor: '#ffffff',
      },
    },
  } as const;

  return {
    title,
    openGraph: {
      title,
      images: [`${appUrl}/api/og/question/${questionId}`],
    },
    other: {
      'fc:frame': JSON.stringify(frame),
    },
  };
}
