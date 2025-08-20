import dynamic from 'next/dynamic';

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
