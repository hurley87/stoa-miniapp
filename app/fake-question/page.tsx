import Link from 'next/link';

type Result = {
  address: string;
  response: string;
  reward_amount: number;
  reward_reason: string;
};

const QUESTION_TEXT =
  'With AI automating much of junior developer work, what unique value (if any) do junior developers still bring to a team?';

const RESULTS: Result[] = [
  {
    address: '0xDa8ab8571FF944Bf5eeCA7addfc100cBe1982f32',
    response:
      'Junior dev blossom into senior devs faster with AI. Juniors devs are not a cost but investment with a faster and higher rate of return with AI.',
    reward_amount: 2.5,
    reward_reason: 'Most thoughtful and well-structured response.',
  },
  {
    address: '0x8342A48694A74044116F330db5050a267b28dD85',
    response: 'It’s an investment',
    reward_amount: 1.5,
    reward_reason: 'Simple but on-point answer reinforcing the core idea.',
  },
  {
    address: '0x26e94D56892521C4c7BBBD1d9699725932797E9C',
    response: 'All developers have superpowers with AI.',
    reward_amount: 0,
    reward_reason: 'Optimistic but too vague to be rewarded.',
  },
  {
    address: '0x6e90a7cA7112434541BA196c6bc59167a376Fe66',
    response: 'None, we’ll all be out of the job soon',
    reward_amount: 0,
    reward_reason: 'Creative but unhelpful, no reward.',
  },
];

const formatUsdc = (n: number) =>
  n.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatAddress = (address: string, leading = 6, trailing = 4) => {
  if (!address) return '';
  const normalized = String(address);
  if (normalized.length <= leading + trailing + 1) return normalized;
  return `${normalized.slice(0, leading)}…${normalized.slice(-trailing)}`;
};

export default function FakeQuestionPage() {
  return (
    <div className="min-h-screen px-4 pt-16 pb-6">
      <div className="max-w-2xl mx-auto px-0">
        <div className="flex w-full max-w-lg shrink-0 flex-col gap-y-4 text-white">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              aria-label="Go back"
              className="glass-button inline-flex items-center gap-2 rounded-md px-2 py-1 text-slate-300 hover:text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-amber-400/40 active:bg-white/10 transition"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="hidden sm:inline">Back</span>
            </Link>
            <div className="text-slate-300 font-medium tracking-tight uppercase">
              <span className="text-red-400">ENDED</span>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-slate-100">
            {QUESTION_TEXT}
          </h3>

          <div className="mt-2 rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-white/80 text-xs uppercase">
                  Submissions
                </span>
                <span className="text-white text-lg font-bold">
                  {RESULTS.length}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-white/80 text-xs uppercase">
                  Rewards Distributed
                </span>
                <span className="text-white text-lg font-bold">
                  {formatUsdc(
                    RESULTS.reduce((sum, r) => sum + r.reward_amount, 0)
                  )}{' '}
                  USDC
                </span>
              </div>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-3">
            {RESULTS.map((item, idx) => {
              const hasReward = item.reward_amount > 0;
              return (
                <div key={idx} className="glass-card rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div
                        className="text-xs text-white/70 font-mono break-all"
                        title={item.address}
                      >
                        {formatAddress(item.address)}
                      </div>
                      <p className="mt-2 text-sm sm:text-base text-slate-100 leading-relaxed">
                        {item.response}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {hasReward ? (
                        <span className="inline-block text-emerald-300 bg-emerald-500/10 rounded-full px-2.5 py-1 text-xs font-medium">
                          +{formatUsdc(item.reward_amount)} USDC
                        </span>
                      ) : (
                        <span className="inline-block text-slate-300 bg-white/5 rounded-full px-2.5 py-1 text-xs font-medium">
                          No reward
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-white/70">
                    {item.reward_reason}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
