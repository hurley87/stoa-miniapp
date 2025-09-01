import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How Stoa works — Ask. Reply. Get Judged. Win.', // copy:updated
  description:
    'Stoa is an onchain game of prompts and replies. KOLs drop prompts. Reply Guys play. AI Judge ranks. Whitelisted Human Judges finalize.', // copy:updated
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
            <p className="text-slate-400 leading-relaxed mb-3">Stoa is an onchain game of prompts and replies.</p> // copy:updated
            <p className="text-slate-400 leading-relaxed mb-3">KOLs (Prompt Creators) drop prompts. Reply Guys post replies. AI Judge ranks. Whitelisted Human Judges have the final say.</p> // copy:updated
            <p className="text-slate-400 leading-relaxed">Start a game. Pay to reply. Get judged. Claim rewards.</p> // copy:updated
          </section>

          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-5 text-slate-100">For KOLs (Prompt Creators)</h2> // copy:updated

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                Frame the Discourse
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-400 ml-4">
                <li><strong>Drop a prompt</strong>: A topic worth debating or a problem worth solving</li> // copy:updated
                <li><strong>Set the stakes</strong>: Define the Entry Fee (funds the Prize Pool)</li> // copy:updated
                <li><strong>Choose duration</strong>: Decide how long replies are accepted</li> // copy:updated
                <li><strong>Define winners</strong>: Select how many top replies are rewarded</li> // copy:updated
              </ol>
            </div>

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                What you earn
              </h3>
              <p className="text-slate-400 mb-3">KOLs earn <strong className="text-amber-300">10% of all Entry Fees</strong> on each game. If 20 players each pay 10 tokens to reply, you earn 20 tokens.</p> // copy:updated
            </div>

            <div className="pl-4 border-l-2 border-amber-400/40">
              <h4 className="font-semibold mb-2 text-amber-200">Example</h4>
              <ul className="space-y-1 text-slate-400 text-sm leading-relaxed">
                <li>• You drop: &ldquo;What should Base build next?&rdquo;</li> // copy:updated
                <li>• Set Entry Fee: 5 tokens</li> // copy:updated
                <li>• 30 replies = 150 tokens collected</li> // copy:updated
                <li>• KOL share: 15 tokens (10% of fees)</li> // copy:updated
                <li>• The rest funds the Prize Pool</li> // copy:updated
              </ul>
            </div>
          </section>

          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-5 text-slate-100">For Reply Guys (Players)</h2> // copy:updated

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                How to earn
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-400 ml-4">
                <li><strong>Find prompts</strong>: Browse open games</li> // copy:updated
                <li><strong>Pay to Reply</strong>: Submit your reply with the Entry Fee</li> // copy:updated
                <li><strong>Make your move</strong>: Offer depth, originality, and clarity</li> // copy:updated
                <li><strong>Get Judged</strong>: AI Judge ranks; Whitelisted Human Judges finalize</li> // copy:updated
                <li><strong>Claim Rewards</strong>: Rank high to earn from the Prize Pool</li> // copy:updated
              </ol>
            </div>

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">Prize system</h3> // copy:updated
              <ul className="space-y-1 text-slate-400 ml-4">
                <li>• 75% of Entry Fees flow into the Prize Pool</li> {/* copy:updated */}
                <li>• Rewards are ranked by AI Judge; Whitelisted Human Judges can adjust</li> {/* copy:updated */}
              </ul>
            </div>

            <div className="pl-4 border-l-2 border-amber-400/40">
              <h4 className="font-semibold mb-2 text-amber-200">Example</h4>
              <ul className="space-y-1 text-slate-400 text-sm leading-relaxed">
                <li>• Prompt has 100 tokens in the Prize Pool</li> {/* copy:updated */}
                <li>• Your reply ranks #1 out of 3 winners with scores: You=3, Second=2, Third=1</li> {/* copy:updated */}
                <li>• Total scores = 6</li> {/* copy:updated */}
                <li>• Your reward = (3 ÷ 6) × 100 = 50 tokens</li> {/* copy:updated */}
              </ul>
            </div>
          </section>

          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-3 text-slate-100">
              The money flow
            </h2>
            <p className="text-slate-400 mb-3">When someone submits a reply for 10 tokens:</p> {/* copy:updated */}
            <ul className="space-y-2 text-slate-400 ml-4">
              <li>• <strong className="text-white">10%</strong> → Protocol Treasury</li> {/* copy:updated */}
              <li>• <strong className="text-amber-300">10%</strong> → KOL (Prompt Creator)</li> {/* copy:updated */}
              <li>• <strong className="text-emerald-300">5%</strong> → Referrer (if provided)</li> {/* copy:updated */}
              <li>• <strong className="text-emerald-300">75%</strong> → Prize Pool for the best replies</li> {/* copy:updated */}
            </ul>
          </section>

          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-3 text-slate-100">
              AI as arbiter
            </h2>
            <p className="text-slate-400 mb-3">
              Once the timer expires, AI acts as judge:
            </p>
            <ul className="space-y-2 text-slate-400 ml-4 mb-3">
              <li>• Reviews all replies</li> {/* copy:updated */}
              <li>• Scores them for accuracy, originality, and clarity</li> {/* copy:updated */}
              <li>• Ranks winners and distributes rewards</li> {/* copy:updated */}
            </ul>
            <p className="text-slate-400 mb-1">AI ensures judging is:</p> {/* copy:updated */}
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
                • <strong>Curated questions</strong>: Fewer, higher‑quality
                prompts
              </li>
              <li>
                • <strong>Quality answers</strong>: Answer fees prevent spam and
                encourage thoughtful responses
              </li>
              <li>
                • <strong>Onchain clarity</strong>: All payments and judging are transparent
              </li>
            </ul>
          </section>

          <section className="py-8 first:pt-0 text-center">
            <h2 className="text-xl font-semibold mb-2 text-slate-100">
              The bottom line
            </h2>
            <p className="text-slate-400 mb-2"><strong>Stoa rewards smart moves.</strong></p> {/* copy:updated */}
            <p className="text-slate-400 mb-4">KOLs drop prompts. Reply Guys make moves. The best replies get paid.</p> {/* copy:updated */}
            <p className="text-slate-400 mb-4 font-semibold">Ask. Reply. Get Judged. Win.</p> {/* copy:updated */}
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
          <button className="cta-button w-full">Browse prompts</button> {/* copy:updated */}
        </Link>
      </div>
    </div>
  );
}
