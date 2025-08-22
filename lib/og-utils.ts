export async function loadGoogleFont(
  font: string,
  text: string
): Promise<ArrayBuffer> {
  const url = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(
    text
  )}`;
  const cssResponse = await fetch(url);
  if (!cssResponse.ok) {
    throw new Error(`failed to load font css: ${cssResponse.status}`);
  }
  const css = await cssResponse.text();

  // Prefer woff2 sources, but fall back to any url() if needed
  const sourceMatches = Array.from(
    css.matchAll(/url\(([^)]+)\)\s*format\('([^']+)'\)/g)
  );

  let candidateUrl: string | null = null;
  if (sourceMatches.length > 0) {
    const woff2 = sourceMatches.find(
      (m) => (m[2] || '').toLowerCase() === 'woff2'
    );
    const chosen = woff2 ?? sourceMatches[0];
    candidateUrl = chosen && chosen[1] ? chosen[1] : null;
  } else {
    // Fallback: grab the first url(...) even if format() is missing
    const simple = Array.from(css.matchAll(/url\(([^)]+)\)/g));
    candidateUrl = simple.length > 0 && simple[0][1] ? simple[0][1] : null;
  }

  if (!candidateUrl) {
    throw new Error('failed to parse font url from css');
  }

  // Clean possible surrounding quotes
  const cleanedUrl = candidateUrl.replace(/^['"]|['"]$/g, '');
  const response = await fetch(cleanedUrl);
  if (!response.ok) {
    throw new Error(`failed to load font data: ${response.status}`);
  }
  return await response.arrayBuffer();
}

export async function loadImage(url: string): Promise<ArrayBuffer> {
  const logoImageRes = await fetch(url);

  if (!logoImageRes.ok) {
    throw new Error(`Failed to fetch logo image: ${logoImageRes.statusText}`);
  }

  return await logoImageRes.arrayBuffer();
}
