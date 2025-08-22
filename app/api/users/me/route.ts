import { fetchUser, NeynarError } from '@/lib/neynar';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const fid = request.headers.get('x-user-fid');
  if (!fid) {
    return NextResponse.json({ error: 'Missing user fid' }, { status: 401 });
  }
  try {
    const user = await fetchUser(fid);
    return NextResponse.json(user);
  } catch (err) {
    if (err instanceof NeynarError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
