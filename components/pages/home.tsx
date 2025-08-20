import dynamic from 'next/dynamic';

const HomeComponent = dynamic(() => import('@/components/Home'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-10 w-10 rounded-full border-2 border-amber-400 border-t-transparent" />
    </div>
  ),
});

export default function Home() {
  return <HomeComponent />;
}
