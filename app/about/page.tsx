import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How Stoa works — Ask. Answer. Earn.',
  description:
    'A forum of ideas built onchain. Logos curate questions. Answerers respond. The best answers earn rewards.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen px-4 pt-16 pb-36">
      <div className="max-w-2xl mx-auto">
        <div className="divide-y divide-white/10">
          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-3 text-slate-100">What is Stoa?</h2>
            <p className="text-slate-400 leading-relaxed mb-3">
              Stoa is a forum of ideas built onchain.
            </p>
            <p className="text-slate-400 leading-relaxed mb-3">
              Only the <strong className="text-amber-300">Logos</strong> may
              ask questions. Anyone may answer. Logos curate the discourse;
              Answerers bring the signal.
            </p>
            <p className="text-slate-400 leading-relaxed">
              Thoughtful questions. Quality answers. Rewards onchain.
            </p>
          </section>

          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-5 text-slate-100">For Logos</h2>

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                Frame the Discourse
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-400 ml-4">
                <li>
                  <strong>Choose your question</strong>: A topic worth debating
                  or a problem worth solving
                </li>
                <li>
                  <strong>Set the stakes</strong>: Define the answer fee (funds
                  the reward pool)
                </li>
                <li>
                  <strong>Choose duration</strong>: Decide how long answers are
                  accepted
                </li>
                <li>
                  <strong>Define winners</strong>: Select how many top answers
                  are rewarded
                </li>
              </ol>
            </div>

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                What you earn
              </h3>
              <p className="text-slate-400 mb-3">
                Logos earn <strong className="text-amber-300">10% of all
                answer fees</strong> on each question. If 20 people each pay 10
                tokens to answer, you earn 20 tokens for curating the discourse.
              </p>
            </div>

            <div className="pl-4 border-l-2 border-amber-400/40">
              <h4 className="font-semibold mb-2 text-amber-200">Example</h4>
              <ul className="space-y-1 text-slate-400 text-sm leading-relaxed">
                <li>
                  • You ask: &ldquo;What&#39;s the best way to invest $10,000
                  right now?&rdquo;
                </li>
                <li>• Set answer fee: 5 tokens</li>
                <li>• 30 people submit answers = 150 tokens collected</li>
                <li>• Logos share: 15 tokens (10% of fees)</li>
                <li>• The rest rewards the best answers</li>
              </ul>
            </div>
          </section>

          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-5 text-slate-100">For Answerers</h2>

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                How to earn
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-400 ml-4">
                <li>
                  <strong>Find questions</strong>: Browse what the Logos have
                  set forth
                </li>
                <li>
                  <strong>Pay to play</strong>: Submit your answer with the
                  required fee
                </li>
                <li>
                  <strong>Contribute knowledge</strong>: Offer depth, originality,
                  and clarity
                </li>
                <li>
                  <strong>AI judgement</strong>: AI reviews and ranks all answers
                </li>
                <li>
                  <strong>Claim rewards</strong>: If your answer ranks among the
                  best, you win your share
                </li>
              </ol>
            </div>

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                Reward system
              </h3>
              <ul className="space-y-1 text-slate-400 ml-4">
                <li>• 80% of answer fees flow into the reward pool</li>
                <li>• Rewards are distributed by score, weighted by AI evaluation</li>
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
            <h2 className="text-xl font-semibold mb-3 text-slate-100">The money flow</h2>
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
                (the question asker)
              </li>
              <li>
                • <strong className="text-emerald-300">8 tokens</strong> →
                Reward pool for the best answers
              </li>
            </ul>
          </section>

          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-3 text-slate-100">AI as arbiter</h2>
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
            <h2 className="text-xl font-semibold mb-4 text-slate-100">Why Stoa?</h2>
            <ul className="space-y-2 text-slate-400">
              <li>
                • <strong>Curated questions</strong>: Only Logos ask — fewer,
                higher‑quality prompts
              </li>
              <li>
                • <strong>Quality answers</strong>: Answer fees prevent spam and
                encourage thoughtful responses
              </li>
              <li>
                • <strong>Onchain clarity</strong>: All payments and evaluations
                are transparent
              </li>
            </ul>
          </section>

          <section className="py-8 first:pt-0 text-center">
            <h2 className="text-xl font-semibold mb-2 text-slate-100">The bottom line</h2>
            <p className="text-slate-400 mb-2">
              <strong>Stoa rewards thoughtful discourse.</strong>
            </p>
            <p className="text-slate-400 mb-4">
              Logos spark discussions. Answerers share thoughtful answers.
              Quality contributions are rewarded.
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
        className="fixed bottom-0 right-0 left-0 px-4 py-6 border-t border-white/10"
      >
        <Link href="/">
          <button className="cta-button w-full">Browse questions</button>
        </Link>
      </div>
    </div>
  );
}
