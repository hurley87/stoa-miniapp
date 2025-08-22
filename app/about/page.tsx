import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How Stoa Works - A Modern Forum Built Onchain',
  description:
    'Stoa is a modern forum of ideas built onchain where the Logos frame discourse and the crowd carries it forward.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen px-4 pt-16 pb-36">
      <div className="max-w-2xl mx-auto">
        <div className="divide-y divide-white/10">
          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-3 text-slate-100">
              What is Stoa?
            </h2>
            <p className="text-slate-400 leading-relaxed mb-3">
              Stoa is a modern forum of ideas built onchain.
            </p>
            <p className="text-slate-400 leading-relaxed mb-3">
              Only those chosen to join{' '}
              <strong className="text-amber-300">the Logos</strong> may ask
              questions. Everyone else can answer them. The Logos frame the
              discourse; the crowd carries it forward.
            </p>
            <p className="text-slate-400 leading-relaxed">
              By asking, answering, and earning, you take part in a system where
              knowledge has real weight.
            </p>
          </section>

          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-5 text-slate-100">
              For the Logos (Question Creators)
            </h2>

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                Creating a Question
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-400 ml-4">
                <li>
                  <strong>Frame the Discourse</strong>: Choose a topic worth
                  debating or a problem worth solving
                </li>
                <li>
                  <strong>Set the Stakes</strong>: Define the cost to answer
                  (this funds the reward pool)
                </li>
                <li>
                  <strong>Choose Duration</strong>: Decide how long answers will
                  be accepted
                </li>
                <li>
                  <strong>Define Winners</strong>: Select how many top answers
                  will be rewarded
                </li>
              </ol>
            </div>

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                What You Earn
              </h3>
              <p className="text-slate-400 mb-3">
                As a member of the Logos, you earn{' '}
                <strong className="text-amber-300">
                  10% of all submission fees
                </strong>{' '}
                for every question you ask. If 20 people each pay 10 tokens to
                answer your question, you earn 20 tokens simply for curating the
                discourse.
              </p>
            </div>

            <div className="pl-4 border-l-2 border-amber-400/40">
              <h4 className="font-semibold mb-2 text-amber-200">Example</h4>
              <ul className="space-y-1 text-slate-400 text-sm leading-relaxed">
                <li>
                  • You ask: &ldquo;What&#39;s the best way to invest $10,000
                  right now?&rdquo;
                </li>
                <li>• Set submission cost: 5 tokens</li>
                <li>• 30 people submit answers = 150 tokens collected</li>
                <li>• You earn: 15 tokens (10% of all fees)</li>
                <li>• The rest goes to reward the best answers</li>
              </ul>
            </div>
          </section>

          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-5 text-slate-100">
              For Answerers
            </h2>

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                How to Earn
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-400 ml-4">
                <li>
                  <strong>Find Questions</strong>: Browse what the Logos have
                  set forth
                </li>
                <li>
                  <strong>Pay to Play</strong>: Submit your answer with the
                  required fee
                </li>
                <li>
                  <strong>Contribute Knowledge</strong>: Offer depth,
                  originality, and clarity
                </li>
                <li>
                  <strong>AI Judgement</strong>: An AI agent reviews and ranks
                  all answers
                </li>
                <li>
                  <strong>Claim Rewards</strong>: If your answer ranks among the
                  best, you win your share
                </li>
              </ol>
            </div>

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                Reward System
              </h3>
              <ul className="space-y-1 text-slate-400 ml-4">
                <li>• 80% of all submission fees flow into the reward pool</li>
                <li>
                  • Rewards are distributed by score, weighted by AI evaluation
                </li>
              </ul>
            </div>

            <div className="pl-4 border-l-2 border-amber-400/40">
              <h4 className="font-semibold mb-2 text-amber-200">Example</h4>
              <ul className="space-y-1 text-slate-400 text-sm leading-relaxed">
                <li>• Question has 100 tokens in the reward pool</li>
                <li>
                  • Your answer ranks #1 out of 3 winners with scores: You=3,
                  Second=2, Third=1
                </li>
                <li>• Total scores = 6</li>
                <li>• Your reward = (3 ÷ 6) × 100 = 50 tokens</li>
              </ul>
            </div>
          </section>

          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-3 text-slate-100">
              The Money Flow
            </h2>
            <p className="text-slate-400 mb-3">
              When someone submits an answer for 10 tokens:
            </p>
            <ul className="space-y-2 text-slate-400 ml-4">
              <li>
                • <strong className="text-white">1 token</strong> → Stoa
                protocol (keeps the forum running)
              </li>
              <li>
                • <strong className="text-amber-300">1 token</strong> → Logos
                member who asked the question
              </li>
              <li>
                • <strong className="text-emerald-300">8 tokens</strong> →
                Reward pool for the best answers
              </li>
            </ul>
          </section>

          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-3 text-slate-100">
              AI as Arbiter
            </h2>
            <p className="text-slate-400 mb-3">
              Once the timer expires, AI acts as judge:
            </p>
            <ul className="space-y-2 text-slate-400 ml-4 mb-3">
              <li>• Reviews all answers</li>
              <li>• Scores them for accuracy, originality, and clarity</li>
              <li>• Ranks winners and distributes rewards</li>
            </ul>
            <p className="text-slate-400 mb-1">AI ensures evaluation is:</p>
            <ul className="space-y-1 text-slate-400 ml-4">
              <li>
                • <strong>Objective</strong>: No human bias
              </li>
              <li>
                • <strong>Consistent</strong>: Same rules for all
              </li>
              <li>
                • <strong>Transparent</strong>: Scores are visible onchain
              </li>
            </ul>
          </section>

          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-4 text-slate-100">
              Why Stoa?
            </h2>
            <ul className="space-y-2 text-slate-400">
              <li>
                • <strong>Questions with weight</strong>: Only Logos may ask,
                ensuring fewer but better questions
              </li>
              <li>
                • <strong>Skin in the game</strong>: Submission fees prevent
                spam
              </li>
              <li>
                • <strong>Onchain clarity</strong>: All payments and evaluations
                are transparent
              </li>
            </ul>
          </section>

          <section className="py-8 first:pt-0 text-center">
            <h2 className="text-xl font-semibold mb-2 text-slate-100">
              The Bottom Line
            </h2>
            <p className="text-slate-400 mb-2">
              <strong>Stoa is where questions shape discourse.</strong>
            </p>
            <p className="text-slate-400 mb-4">
              The Logos ignite debate. The crowd contends. The best answers are
              rewarded.
            </p>
            <p className="text-slate-400 mb-4 font-semibold">
              Ask. Answer. Earn.
            </p>
          </section>
        </div>
      </div>
      <div
        style={{
          background:
            'radial-gradient(1200px 600px at 50% -200px, rgba(251, 191, 36, 0.08), transparent 60%), linear-gradient(180deg, #0b1120 0%, #0a0f1f 100%)',
        }}
        className="fixed bottom-0 right-0 left-0 p-4 border-t border-white/10"
      >
        <Link href="/">
          <button className="cta-button w-full">Browse questions</button>
        </Link>
      </div>
    </div>
  );
}
