import { ImageResponse } from 'next/og';
import { env } from '@/lib/env';
// no external font or image loaders to keep @vercel/og happy

export const dynamic = 'force-dynamic';

const size = { width: 600, height: 400 };

type Question = {
  question_id: number;
  content: string;
  end_time: string | null;
  total_submissions?: number;
  total_reward_pool?: number | string;
};

function formatTimeLeft(endTimeIso: string | null): string {
  if (!endTimeIso) return 'ENDED';
  const now = Date.now();
  const endTime = new Date(endTimeIso).getTime();
  const difference = endTime - now;
  if (Number.isNaN(endTime) || difference <= 0) return 'ENDED';

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((difference % (1000 * 60)) / 1000);

  if (days > 0) return `${days}D ${hours}H ${minutes}M ${seconds}S`;
  if (hours > 0) return `${hours}H ${minutes}M ${seconds}S`;
  if (minutes > 0) return `${minutes}M ${seconds}S`;
  return `${seconds}S`;
}

export async function GET(
  _request: Request,
  context: { params: { id?: string } }
) {
  try {
    const id = context?.params?.id;
    if (!id || typeof id !== 'string') {
      return new Response('Invalid id', { status: 400 });
    }
    const appUrl = env.NEXT_PUBLIC_URL;

    console.log('appUrl', appUrl);
    console.log('id', id);

    const res = await fetch(`${appUrl}/api/questions/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return new Response('Failed to load question', { status: res.status });
    }
    const question = (await res.json()) as Question;

    const timeLeft = formatTimeLeft(question.end_time);

    // Use absolute URL for images; avoid base64 embedding to prevent parser issues

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '28px',
            background:
              'radial-gradient(120% 60% at 50% 0%, rgba(251, 191, 36, 0.08) 0%, transparent 60%), linear-gradient(180deg, #0b1120 0%, #0a0f1f 100%)',
            color: 'white',
          }}
        >
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            <div
              style={{
                fontSize: 28,
                lineHeight: 1.3,
                fontWeight: 700,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {question.content}
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div
              style={{
                fontSize: 20,
                color: '#fbbf24',
                letterSpacing: 0.5,
                fontWeight: 600,
              }}
            >
              {timeLeft === 'ENDED' ? 'ENDED' : `Time Left: ${timeLeft}`}
            </div>
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  } catch (error) {
    console.error('OG question image error', error);
    return new Response('Failed to generate question image', { status: 500 });
  }
}
