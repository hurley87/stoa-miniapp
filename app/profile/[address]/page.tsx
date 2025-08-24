import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { CopyAddress } from '@/components/profile/copy-address';

interface ProfilePageProps {
  params: { address: string };
}

async function getUser(address: string) {
  const url = `${process.env.NEXT_PUBLIC_URL}/api/users/${address}`;
  const res = await fetch(url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Failed to load user profile');
  return res.json();
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { address } = params;
  const user = await getUser(address.toLowerCase());
  if (!user) notFound();

  const displayName = user.display_name || user.username || 'Farcaster User';
  const pfp = user.pfp_url;

  return (
    <>
      <main className="mx-auto max-w-2xl px-4 pb-36 pt-20">
        <section className="flex flex-col items-center gap-3">
          <div className="relative h-24 w-24 overflow-hidden rounded-full ring-2 ring-white/10">
            {pfp ? (
              <Image
                src={pfp}
                alt={displayName}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-white/5 text-sm">
                NA
              </div>
            )}
          </div>
          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight">
              {displayName}
            </h1>
            <CopyAddress address={address} />
          </div>
        </section>

        {user.profile?.bio?.text ? (
          <p className="mt-6 whitespace-pre-wrap text-sm text-white/80">
            {user.profile.bio.text}
          </p>
        ) : null}

        {/* Followers/Following section removed per requirements */}
      </main>
      <div
        style={{
          background:
            'radial-gradient(1200px 600px at 50% -200px, rgba(251, 191, 36, 0.08), transparent 60%), linear-gradient(180deg, #0b1120 0%, #0a0f1f 100%)',
        }}
        className="fixed bottom-0 right-0 left-0 px-4 py-6 border-t border-white/10"
      >
        <Link href="/">
          <button className="cta-button w-full">Browse Questions</button>
        </Link>
      </div>
    </>
  );
}
