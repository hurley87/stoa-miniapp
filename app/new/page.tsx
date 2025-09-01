import CreateQuestionForm from '@/components/create-question';

export const dynamic = 'force-dynamic';

export default function NewQuestionPage() {
  return (
    <main className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-xl font-semibold">Frame the discourse</h1>
      <CreateQuestionForm />
    </main>
  );
}
