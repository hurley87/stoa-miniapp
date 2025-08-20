import dynamic from 'next/dynamic';

const QuestionPageClient = dynamic(
  () => import('@/components/pages/question'),
  {
    ssr: false,
    loading: () => <div className="min-h-screen p-4">Loading...</div>,
  }
);

export default function QuestionPage({ params }: { params: { id: string } }) {
  return <QuestionPageClient idParam={params.id} />;
}
