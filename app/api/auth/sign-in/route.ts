import { Errors, createClient } from '@farcaster/quick-auth';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { env } from '@/lib/env';
import { fetchUser, NeynarError, NeynarUser } from '@/lib/neynar';
import * as jose from 'jose';
import { NextRequest, NextResponse } from 'next/server';
import { Address, zeroAddress } from 'viem';

export const dynamic = 'force-dynamic';

const quickAuthClient = createClient();
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createSupabaseClient(supabaseUrl, supabaseServiceKey);

export const POST = async (req: NextRequest) => {
  const { referrerFid: _referrerFid, token: farcasterToken } = await req.json();
  let fid;
  let isValidSignature;
  let walletAddress: Address = zeroAddress;
  let expirationTime = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  // Verify signature matches custody address and auth address
  try {
    const payload = await quickAuthClient.verifyJwt({
      domain: new URL(env.NEXT_PUBLIC_URL).hostname,
      token: farcasterToken,
    });
    isValidSignature = !!payload;
    fid = Number(payload.sub);
    walletAddress = payload.address as `0x${string}`;
    expirationTime = payload.exp ?? Date.now() + 7 * 24 * 60 * 60 * 1000;
  } catch (e) {
    if (e instanceof Errors.InvalidTokenError) {
      console.error('Invalid token', e);
      isValidSignature = false;
    }
    console.error('Error verifying token', e);
  }

  if (!isValidSignature || !fid) {
    return NextResponse.json(
      { success: false, error: 'Invalid token' },
      { status: 401 }
    );
  }

  let user: NeynarUser;
  try {
    user = await fetchUser(fid.toString());
    console.log('user', user);
  } catch (e) {
    if (e instanceof NeynarError) {
      return NextResponse.json(
        { success: false, error: e.message },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user from Neynar' },
      { status: 500 }
    );
  }

  // Best-effort: upsert user profile into DB
  try {
    // Prefer the wallet from Neynar user data if available
    const walletFromUser = user.verified_addresses?.primary?.eth_address;
    const walletCandidate =
      typeof walletFromUser === 'string' && walletFromUser
        ? walletFromUser
        : (walletAddress as string | undefined);
    const wallet =
      typeof walletCandidate === 'string' ? walletCandidate.toLowerCase() : '';

    console.log('wallet', wallet);
    if (wallet && wallet !== zeroAddress.toLowerCase()) {
      const now = new Date().toISOString();
      const { data: existingUser } = await supabase
        .from('users')
        .select('wallet')
        .eq('wallet', wallet)
        .single();

      if (existingUser) {
        console.log('existingUser', existingUser);
        const { error: updateError } = await supabase
          .from('users')
          .update({
            fid,
            username: user.username,
            pfp: user.pfp_url,
            last_activity: now,
          })
          .eq('wallet', wallet);
        if (updateError) {
          console.warn(
            'Warning: failed to update user on sign-in',
            updateError
          );
        }
      } else {
        console.log('inserting user', user);
        const { error: insertError, data: newUser } = await supabase
          .from('users')
          .insert({
            wallet,
            fid,
            username: user.username,
            pfp: user.pfp_url,
            joined_at: now,
            last_activity: now,
          })
          .select()
          .single();
        console.log('newUser', newUser);
        if (insertError) {
          console.warn(
            'Warning: failed to insert user on sign-in',
            insertError
          );
        }
      }
    }
  } catch (dbError) {
    console.warn('Warning: user upsert on sign-in threw', dbError);
  }

  // Generate JWT token
  const secret = new TextEncoder().encode(env.JWT_SECRET);
  const token = await new jose.SignJWT({
    fid,
    walletAddress,
    timestamp: Date.now(),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expirationTime)
    .sign(secret);

  // Create the response
  const response = NextResponse.json({ success: true, user });

  // Set the auth cookie with the JWT token
  response.cookies.set({
    name: 'auth_token',
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  });

  return response;
};
