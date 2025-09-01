import { env } from '@/lib/env';

/**
 * Get the farcaster manifest for the frame, generate yours from Warpcast Mobile
 *  On your phone to Settings > Developer > Domains > insert website hostname > Generate domain manifest
 * @returns The farcaster manifest for the frame
 */
export async function getFarcasterManifest() {
  let frameName = 'Mini-app Starter';
  let noindex = false;
  const appUrl = env.NEXT_PUBLIC_URL;
  if (appUrl.includes('localhost')) {
    frameName += ' Local';
    noindex = true;
  } else if (appUrl.includes('ngrok')) {
    frameName += ' NGROK';
    noindex = true;
  } else if (appUrl.includes('https://dev.')) {
    frameName += ' Dev';
    noindex = true;
  }
  return {
    accountAssociation: {
      header:
        'eyJmaWQiOjEyNjUxMzMsInR5cGUiOiJhdXRoIiwia2V5IjoiMHgyNmU5NEQ1Njg5MjUyMUM0YzdCQkJEMWQ5Njk5NzI1OTMyNzk3RTlDIn0',
      payload: 'eyJkb21haW4iOiJhcHAuc3RvYS5idWlsZCJ9',
      signature: 'CwhA1CknZnOWFnU70fUrCdEhgWC027se5nA',
    },
    frame: {
      version: '1',
      name: frameName,
      iconUrl: `${appUrl}/images/icon.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/images/feed.png`,
      buttonTitle: `Launch App`,
      splashImageUrl: `${appUrl}/images/logo.png`,
      webhookUrl: `${appUrl}/api/webhook`,
      // Metadata https://github.com/farcasterxyz/miniapps/discussions/191
      subtitle: 'Onchain Knowledge Game',
      description:
        'KOLs drop prompts. Reply Guys do their thing. AI Judge ranks.',
      primaryCategory: 'education',
      tags: ['forum', 'learning', 'onchain', 'rewards', 'AI'], // up to 5 tags, filtering/search tags
      tagline: 'Drop Prompts. Fire Back. Win Rewards.',
      ogTitle: 'Stoa — The Knowledge Game',
      ogDescription:
        'Onchain prompts and replies. Pay to Reply. Get judged. Claim rewards.',
      screenshotUrls: [
        // 1284 x 2778, visual previews of the app, max 3 screenshots
        `${appUrl}/images/feed.png`,
      ],
      heroImageUrl: `${appUrl}/images/feed.png`, // 1200 x 630px (1.91:1), promotional display image on top of the mini app store
      ogImageUrl: `${appUrl}/images/feed.png`, // 1200 x 630px (1.91:1), promotional image, same as app hero image
      noindex: noindex,
    },
  };
}
