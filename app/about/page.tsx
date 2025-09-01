import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How Stoa works — Drop Prompts. Fire Back. Win Rewards.',
  description:
    'Stoa is the onchain game of prompts and replies. KOLs drop the prompts. Reply Guys fire back. The best takes win rewards.',
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
              Stoa is the onchain game of prompts and replies. KOLs drop the
              prompts. Reply Guys fire back. The best takes win rewards.
            </p>
            <p className="text-slate-400 leading-relaxed">
              Start a game. Pay to Reply. Get Judged. Claim Rewards.
            </p>
          </section>

          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-5 text-slate-100">
              For KOLs (Prompt Creators)
            </h2>

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                Frame the Discourse
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-400 ml-4">
                <li>
                  <strong>Drop a prompt</strong>: A topic worth debating or a
                  problem worth solving
                </li>
                <li>
                  <strong>Set the stakes</strong>: Define the Entry Fee (funds
                  the Prize Pool)
                </li>
                <li>
                  <strong>Choose duration</strong>: Decide how long replies are
                  accepted
                </li>
                <li>
                  <strong>Define winners</strong>: Select how many top replies
                  are rewarded
                </li>
              </ol>
            </div>

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                What you earn
              </h3>
              <p className="text-slate-400 mb-3">
                KOLs earn{' '}
                <strong className="text-amber-300">
                  10% of all Entry Fees
                </strong>{' '}
                on each game. If 20 players each pay 10 tokens to reply, you
                earn 20 tokens.
              </p>
            </div>

            <div className="pl-4 border-l-2 border-amber-400/40">
              <h4 className="font-semibold mb-2 text-amber-200">Example</h4>
              <ul className="space-y-1 text-slate-400 text-sm leading-relaxed">
                <li>• You drop: &ldquo;What should Base build next?&rdquo;</li>
                <li>• Set Entry Fee: 5 tokens</li>
                <li>• 30 replies = 150 tokens collected</li>
                <li>• KOL share: 15 tokens (10% of fees)</li>
                <li>• The rest funds the Prize Pool</li>
              </ul>
            </div>
          </section>

          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-5 text-slate-100">
              For Reply Guys (Players)
            </h2>

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                How to earn
              </h3>
              <ol className="list-decimal list-inside space-y-2 text-slate-400 ml-4">
                <li>
                  <strong>Find prompts</strong>: Browse open games
                </li>
                <li>
                  <strong>Pay to Reply</strong>: Submit your reply with the
                  Entry Fee
                </li>
                <li>
                  <strong>Make your move</strong>: Offer depth, originality, and
                  clarity
                </li>
                <li>
                  <strong>Get Judged</strong>: AI Judge ranks; Whitelisted Human
                  Judges finalize
                </li>
                <li>
                  <strong>Claim Rewards</strong>: Rank high to earn from the
                  Prize Pool
                </li>
              </ol>
            </div>

            <div className="mb-5">
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-white/90">
                Prize system
              </h3>
              <ul className="space-y-1 text-slate-400 ml-4">
                <li>• 75% of Entry Fees flow into the Prize Pool</li>
                <li>
                  • Rewards are ranked by AI Judge; Whitelisted Human Judges can
                  adjust
                </li>
              </ul>
            </div>

            <div className="pl-4 border-l-2 border-amber-400/40">
              <h4 className="font-semibold mb-2 text-amber-200">Example</h4>
              <ul className="space-y-1 text-slate-400 text-sm leading-relaxed">
                <li>• Prompt has 100 tokens in the Prize Pool</li>
                <li>
                  • Your reply ranks #1 out of 3 winners with scores: You=3,
                  Second=2, Third=1
                </li>
                <li>• Total scores = 6</li>
                <li>• Your reward = (3 ÷ 6) × 100 = 50 tokens</li>
              </ul>
            </div>
          </section>

          <section className="py-8 first:pt-0">
            <h2 className="text-xl font-semibold mb-3 text-slate-100">
              The money flow
            </h2>
            <p className="text-slate-400 mb-3">
              When someone submits a reply for 10 tokens:
            </p>
            <ul className="space-y-2 text-slate-400 ml-4">
              <li>
                • <strong className="text-white">10%</strong> → Protocol
                Treasury
              </li>
              <li>
                • <strong className="text-amber-300">10%</strong> → KOL (Prompt
                Creator)
              </li>
              <li>
                • <strong className="text-emerald-300">5%</strong> → Referrer
                (if provided)
              </li>
              <li>
                • <strong className="text-emerald-300">75%</strong> → Prize Pool
                for the best replies
              </li>
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
              <li>• Reviews all replies</li>
              <li>• Scores them for accuracy, originality, and clarity</li>
              <li>• Ranks winners and distributes rewards</li>
            </ul>
            <p className="text-slate-400 mb-1">AI ensures judging is:</p>
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
                • <strong>Onchain clarity</strong>: All payments and judging are
                transparent
              </li>
            </ul>
          </section>

          <section className="py-8 first:pt-0 text-center">
            <h2 className="text-xl font-semibold mb-2 text-slate-100">
              The bottom line
            </h2>
            <p className="text-slate-400 mb-2">
              <strong>Stoa rewards smart moves.</strong>
            </p>
            <p className="text-slate-400 mb-4">
              KOLs drop prompts. Reply Guys make moves. The best replies get
              paid.
            </p>
            <p className="text-slate-400 mb-4 font-semibold">
              Drop Prompts. Fire Back. Win Rewards.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
