import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How Stoa Works - Stoa Knowledge Marketplace',
  description:
    'Learn how Stoa works: earn money by sharing knowledge, creating questions, and providing great answers.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen px-4 pt-20 pb-10">
      <div className="max-w-2xl mx-auto">
        <div className="divide-y divide-white/10">
          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-3 text-slate-100">
              What is Stoa?
            </h2>
            <p className="text-slate-400 leading-relaxed">
              Stoa is a platform where you can earn money by sharing your
              knowledge. Ask questions, provide great answers, and get rewarded
              based on how helpful your contributions are.
            </p>
          </section>

          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-5 text-slate-100">
              For Question Creators
            </h2>

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                Creating a Question
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-400 ml-4">
                <li>
                  <strong>Pick a Topic</strong>: Choose something you want to
                  learn about or need help with
                </li>
                <li>
                  <strong>Set the Stakes</strong>: Decide how much people pay to
                  answer (this creates the reward pool)
                </li>
                <li>
                  <strong>Choose Duration</strong>: Set how long people have to
                  submit answers
                </li>
                <li>
                  <strong>Pick Winners</strong>: Decide how many of the best
                  answers will be rewarded
                </li>
              </ol>
            </div>

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                What You Earn
              </h3>
              <p className="text-slate-400 mb-3">
                As a question creator, you earn{' '}
                <strong className="text-amber-300">
                  10% of all submission fees
                </strong>
                . If 20 people each pay 10 tokens to answer your question, you
                earn 20 tokens just for asking a good question.
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
              For Answer Providers
            </h2>

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                How to Earn
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-400 ml-4">
                <li>
                  <strong>Find Good Questions</strong>: Look for topics where
                  you have expertise
                </li>
                <li>
                  <strong>Pay to Play</strong>: Submit your answer along with
                  the required fee
                </li>
                <li>
                  <strong>Share Your Knowledge</strong>: Provide detailed,
                  helpful answers
                </li>
                <li>
                  <strong>AI Evaluation</strong>: An AI agent reviews and ranks
                  all answers based on quality
                </li>
                <li>
                  <strong>Claim Rewards</strong>: If you&#39;re in the top
                  answers, claim your reward
                </li>
              </ol>
            </div>

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                How Much You Earn
              </h3>
              <p className="text-slate-400 mb-3">
                Your reward depends on how good your answer is compared to
                others:
              </p>
              <ul className="space-y-1 text-slate-400 ml-4">
                <li>
                  • <strong>Best answer</strong>: Gets the biggest share of the
                  reward pool
                </li>
                <li>
                  • <strong>Second best</strong>: Gets the second biggest share
                </li>
                <li>
                  • <strong>And so on</strong>: Up to the maximum number of
                  winners set by the question creator
                </li>
              </ul>
            </div>

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                Reward Calculation
              </h3>
              <ul className="space-y-1 text-slate-400 ml-4 mb-3">
                <li>• 80% of all submission fees become the reward pool</li>
                <li>
                  • Your share = (Your score ÷ Total scores) × Reward pool
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
                • <strong className="text-white">1 token</strong> → Platform
                fees (keeps Stoa running)
              </li>
              <li>
                • <strong className="text-amber-300">1 token</strong> → Question
                creator (rewards good questions)
              </li>
              <li>
                • <strong className="text-emerald-300">8 tokens</strong> →
                Reward pool (pays answer providers)
              </li>
            </ul>
          </section>

          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-3 text-slate-100">
              AI-Powered Evaluation
            </h2>
            <p className="text-slate-400 mb-3">
              After the submission deadline, an AI agent automatically:
            </p>
            <ul className="space-y-2 text-slate-400 ml-4 mb-3">
              <li>• Reviews all submitted answers</li>
              <li>
                • Evaluates them for accuracy, completeness, and helpfulness
              </li>
              <li>• Ranks them from best to worst</li>
              <li>• Assigns scores that determine token distribution</li>
            </ul>
            <p className="text-slate-400 mb-1">The AI evaluation is:</p>
            <ul className="space-y-1 text-slate-400 ml-4">
              <li>
                • <strong>Objective</strong>: No human bias or favoritism
              </li>
              <li>
                • <strong>Fast</strong>: Results typically available within
                hours
              </li>
              <li>
                • <strong>Consistent</strong>: Same standards applied to all
                answers
              </li>
              <li>
                • <strong>Transparent</strong>: Scores are public on the
                blockchain
              </li>
            </ul>
          </section>

          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-4 text-slate-100">
              Key Benefits
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                  For Everyone
                </h3>
                <ul className="space-y-1 text-slate-400">
                  <li>
                    • <strong>Fair AI Judging</strong>: Objective evaluation
                    without human bias
                  </li>
                  <li>
                    • <strong>Quality Content</strong>: Submission fees prevent
                    spam
                  </li>
                  <li>
                    • <strong>Transparent</strong>: All payments and AI scores
                    are public on the blockchain
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                  Safety Features
                </h3>
                <ul className="space-y-1 text-slate-400">
                  <li>
                    • <strong>Emergency Refunds</strong>: If AI evaluation takes
                    too long (7+ days), you can get your money back
                  </li>
                  <li>
                    • <strong>Secure Payments</strong>: All transactions handled
                    by smart contracts
                  </li>
                  <li>
                    • <strong>Automated Process</strong>: No waiting for human
                    evaluators
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="py-8 first:pt-0 text-center">
            <h2 className="text-xl font-semibold mb-2 text-slate-100">
              The Bottom Line
            </h2>
            <p className="text-slate-400 mb-4">
              Stoa turns knowledge into money. Good questions attract good
              answers, and good answers earn good money.
            </p>
            <div className="flex items-center justify-center gap-3 w-full">
              <Link
                href="/"
                className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 px-5 py-2.5 text-black font-semibold shadow-lg shadow-amber-500/20 ring-1 ring-black/10 transition-all duration-200 hover:brightness-105 hover:-translate-y-0.5"
              >
                Browse questions
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
