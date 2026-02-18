import { NextRequest, NextResponse } from 'next/server';

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// In-memory cache: url → { imageUrl, expiresAt }
const cache = new Map<string, { imageUrl: string | null; expiresAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function upgradeImgixUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('imgix.net') || parsed.hostname.includes('tiqets-cdn')) {
      parsed.searchParams.set('w', '800');
      parsed.searchParams.set('h', '600');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('auto', 'format,compress');
      return parsed.toString();
    }
  } catch {
    // ignore
  }
  return url;
}

async function scrapeImage(productUrl: string): Promise<string | null> {
  const res = await fetch(productUrl, {
    headers: { 'User-Agent': BROWSER_UA },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const html = await res.text();

  // 1. Try JSON-LD Product → image
  const ldMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of ldMatches) {
    try {
      const json = JSON.parse(match[1]);
      const entries = Array.isArray(json) ? json : [json];
      for (const entry of entries) {
        if (entry['@type'] === 'Product' && entry.image) {
          const img = Array.isArray(entry.image) ? entry.image[0] : entry.image;
          if (typeof img === 'string' && img.startsWith('http')) {
            return upgradeImgixUrl(img);
          }
          if (typeof img === 'object' && img.url) {
            return upgradeImgixUrl(img.url);
          }
        }
      }
    } catch {
      // continue
    }
  }

  // 2. OG image fallback
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
  if (ogMatch?.[1]) {
    return upgradeImgixUrl(ogMatch[1]);
  }

  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productUrl = searchParams.get('product_url');

  if (!productUrl) {
    return NextResponse.json({ imageUrl: null }, { status: 400 });
  }

  // Check cache
  const now = Date.now();
  const cached = cache.get(productUrl);
  if (cached && cached.expiresAt > now) {
    return NextResponse.json({ imageUrl: cached.imageUrl });
  }

  try {
    const imageUrl = await scrapeImage(productUrl);
    cache.set(productUrl, { imageUrl, expiresAt: now + CACHE_TTL_MS });
    return NextResponse.json({ imageUrl });
  } catch {
    return NextResponse.json({ imageUrl: null });
  }
}
