/**
 * GET /api/tiqets/batch-scrape?city_id=72181&offset=0
 *
 * 도시별 Tiqets 상품 이미지 일괄 스크래핑 → Supabase tiqets_images 저장
 * - 기본 12개씩, concurrency 3 (Vercel free tier 10s 타임아웃 대응)
 * - offset 파라미터로 페이지네이션
 * - 이미지 추출 순서: JSON-LD > og:image > imgix CDN regex
 */
import { NextRequest, NextResponse } from 'next/server';

const TIQETS_TOKEN = process.env.TIQETS_TOKEN!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SCRAPE_UA    = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Vercel free tier 최대 10초 → 12개 × 3 동시 = 4 라운드 × ~2s = ~8s
const BATCH_LIMIT   = 12;
const CONCURRENCY   = 3;
const REQUEST_TIMEOUT = 5000; // 5초

/* ── 상품 목록 ── */
async function fetchProducts(city_id: string, page = 1, page_size = 50) {
  const params = new URLSearchParams({ currency: 'USD', lang: 'en', page: String(page), page_size: String(page_size), city_id });
  const res = await fetch(`https://api.tiqets.com/v2/products?${params}`, {
    headers: { 'Authorization': `Token ${TIQETS_TOKEN}`, 'Accept': 'application/json' },
  });
  if (!res.ok) return { products: [], total: 0 };
  const data = await res.json();
  return { products: data.products || [], total: data.pagination?.total || 0 };
}

/* ── 이미지 URL 추출 (3단계) ── */
function extractImage(html: string): string | null {
  // 1순위: JSON-LD Product image (가장 신뢰성 높음)
  const ldMatch = html.match(/"@type"\s*:\s*"Product"[^}]*"image"\s*:\s*"(https:\/\/aws-tiqets-cdn\.imgix\.net\/images\/content\/[^"?]+)/);
  if (ldMatch) {
    return `${ldMatch[1]}?w=800&h=600&fit=crop&auto=format,compress&q=80`;
  }

  // 2순위: og:image
  const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["'](https:\/\/[^"'?]+)/i)
    || html.match(/<meta[^>]+content=["'](https:\/\/aws-tiqets-cdn\.imgix\.net[^"'?]+)[^>]+property=["']og:image["']/i);
  if (ogMatch) {
    const url = ogMatch[1];
    if (url.includes('aws-tiqets-cdn')) return `${url}?w=800&h=600&fit=crop&auto=format,compress&q=80`;
    return url;
  }

  // 3순위: imgix CDN regex
  const cdnMatch = html.match(/https:\/\/aws-tiqets-cdn\.imgix\.net\/images\/content\/([a-zA-Z0-9]+\.[a-z]+)/);
  if (cdnMatch) {
    return `https://aws-tiqets-cdn.imgix.net/images/content/${cdnMatch[1]}?w=800&h=600&fit=crop&auto=format,compress&q=80`;
  }

  return null;
}

/* ── 단일 상품 스크래핑 ── */
async function scrapeOne(product_url: string): Promise<string | null> {
  try {
    const res = await fetch(product_url, {
      headers: {
        'User-Agent': SCRAPE_UA,
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT),
    });
    if (!res.ok) return null;
    const html = await res.text();
    return extractImage(html);
  } catch {
    return null;
  }
}

/* ── DB upsert ── */
async function saveToDb(rows: Array<{ product_id: number; image_url: string; city_id: number }>) {
  if (!SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/tiqets_images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'apikey': SERVICE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DB save failed: ${err}`);
  }
}

/* ── 이미 DB에 있는 ID 조회 ── */
async function getExistingIds(city_id: string): Promise<Set<number>> {
  const key = SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/tiqets_images?city_id=eq.${city_id}&select=product_id`,
    { headers: { 'Authorization': `Bearer ${key}`, 'apikey': key } },
  );
  if (!res.ok) return new Set();
  const data: Array<{ product_id: number }> = await res.json();
  return new Set(data.map(d => d.product_id));
}

/* ── 핸들러 ── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city_id  = searchParams.get('city_id') || '';
  const offsetStr = searchParams.get('offset') || '0';
  const forceAll  = searchParams.get('force') === 'true';

  if (!city_id) return NextResponse.json({ error: 'city_id required' }, { status: 400 });
  if (!SERVICE_KEY) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 500 });

  const offset = parseInt(offsetStr) || 0;
  const page   = Math.floor(offset / 50) + 1;

  // DB에 이미 있는 ID 조회
  const existingIds = forceAll ? new Set<number>() : await getExistingIds(city_id);

  // 상품 목록
  const { products, total } = await fetchProducts(city_id, page, 50);
  const pageSlice = products.slice(offset % 50);

  // 스크래핑 대상 필터
  type Product = { id: number | string; images?: string[]; product_url?: string };
  const toScrape: Product[] = pageSlice
    .filter((p: Product) => !existingIds.has(Number(p.id)) && p.product_url)
    .slice(0, BATCH_LIMIT);

  const results: Array<{ product_id: number; image_url: string; city_id: number }> = [];
  let scraped = 0;
  let failed  = 0;

  // CONCURRENCY 단위로 병렬 스크래핑
  for (let i = 0; i < toScrape.length; i += CONCURRENCY) {
    const chunk = toScrape.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(async (p: Product) => {
      const img = await scrapeOne(p.product_url!);
      if (img) {
        results.push({ product_id: Number(p.id), image_url: img, city_id: parseInt(city_id) });
        scraped++;
      } else {
        failed++;
      }
    }));
  }

  // DB 저장
  let saved = 0;
  if (results.length > 0) {
    await saveToDb(results);
    saved = results.length;
  }

  const processedUpTo = offset + toScrape.length;
  const hasMore = processedUpTo < total;

  return NextResponse.json({
    city_id,
    total,
    offset,
    processed: toScrape.length,
    scraped,
    failed,
    saved,
    already_in_db: existingIds.size,
    next_offset: hasMore ? processedUpTo : null,
  });
}

export async function POST(req: NextRequest) {
  return GET(req);
}
