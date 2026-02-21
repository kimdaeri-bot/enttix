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

function extractTiqetsCdn(html: string): string | null {
  const m = html.match(/https:\/\/aws-tiqets-cdn\.imgix\.net\/images\/content\/([a-f0-9]+\.[a-z]+)/i);
  if (m) {
    return `https://aws-tiqets-cdn.imgix.net/images/content/${m[1]}?w=800&h=600&fit=crop&auto=format,compress&q=80`;
  }
  return null;
}

async function scrapeImage(productUrl: string): Promise<string | null> {
  const productIdMatch = productUrl.match(/-p(\d+)\/?/);
  const productId = productIdMatch?.[1] || null;

  const res = await fetch(productUrl, {
    headers: {
      'User-Agent': BROWSER_UA,
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  // 리다이렉트로 다른 페이지로 이동한 경우 무시
  if (productId && !res.url.includes(productId)) return null;

  const html = await res.text();

  // 1. Tiqets CDN imgix 직접 추출 (Tiqets 페이지는 OG/JSON-LD 없음)
  const cdnImg = extractTiqetsCdn(html);
  if (cdnImg) return cdnImg;

  // 2. Try JSON-LD Product → image
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

  // 3. OG image fallback
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
