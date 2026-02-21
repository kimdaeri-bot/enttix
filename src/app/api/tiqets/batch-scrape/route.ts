/**
 * POST/GET /api/tiqets/batch-scrape?city_id=71631&limit=50&offset=0
 *
 * 특정 도시의 Tiqets 상품 이미지 일괄 스크래핑 → Supabase tiqets_images 저장
 * Admin 페이지에서 도시별 호출
 */
import { NextRequest, NextResponse } from 'next/server';

const TIQETS_TOKEN    = process.env.TIQETS_TOKEN!;
const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY     = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const SCRAPE_UA       = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/* ── Tiqets 상품 목록 가져오기 ── */
async function fetchProducts(city_id: string, page = 1, page_size = 50) {
  const params = new URLSearchParams({ currency: 'USD', lang: 'en', page: String(page), page_size: String(page_size), city_id });
  const res = await fetch(`https://api.tiqets.com/v2/products?${params}`, {
    headers: { 'Authorization': `Token ${TIQETS_TOKEN}`, 'Accept': 'application/json' },
  });
  if (!res.ok) return { products: [], total: 0 };
  const data = await res.json();
  return { products: data.products || [], total: data.pagination?.total || 0 };
}

/* ── imgix CDN URL 추출 ── */
function extractImgix(html: string): string | null {
  const m = html.match(/https:\/\/aws-tiqets-cdn\.imgix\.net\/images\/content\/([a-f0-9]+\.[a-z]+)/i);
  if (m) return `https://aws-tiqets-cdn.imgix.net/images/content/${m[1]}?w=800&h=600&fit=crop&auto=format,compress&q=80`;
  return null;
}

/* ── 단일 상품 이미지 스크래핑 ── */
async function scrapeOne(product_url: string): Promise<string | null> {
  try {
    const idMatch = product_url.match(/-p(\d+)\/?/);
    const productId = idMatch?.[1];
    const res = await fetch(product_url, {
      headers: {
        'User-Agent': SCRAPE_UA,
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    if (productId && !res.url.includes(productId)) return null; // 리다이렉트 감지
    const html = await res.text();
    return extractImgix(html)
      || html.match(/property=["']og:image["'][^>]+content=["']([^"']+)/i)?.[1]
      || null;
  } catch { return null; }
}

/* ── Supabase에 이미지 배치 upsert ── */
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

/* ── 이미 DB에 있는 product_id 조회 ── */
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

/* ── GET / POST 핸들러 ── */
export async function GET(req: NextRequest) {
  return handler(req);
}
export async function POST(req: NextRequest) {
  return handler(req);
}

async function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city_id   = searchParams.get('city_id') || '';
  const limitStr  = searchParams.get('limit')   || '50';
  const offsetStr = searchParams.get('offset')  || '0';
  const forceAll  = searchParams.get('force') === 'true'; // 이미 있는 것도 재스크래핑

  if (!city_id) return NextResponse.json({ error: 'city_id required' }, { status: 400 });
  if (!SERVICE_KEY) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 500 });

  const limit  = Math.min(parseInt(limitStr) || 50, 100);
  const offset = parseInt(offsetStr) || 0;

  // 1. 이미 DB에 있는 ID 조회 (force=true면 무시)
  const existingIds = forceAll ? new Set<number>() : await getExistingIds(city_id);

  // 2. 상품 목록 가져오기 (offset은 page로 변환)
  const page      = Math.floor(offset / 50) + 1;
  const { products, total } = await fetchProducts(city_id, page, 50);

  // 3. 이미지 없고 DB에도 없는 것만 스크래핑
  const toScrape = products
    .slice(offset % 50, (offset % 50) + limit)
    .filter((p: { id: number; images?: string[]; product_url?: string }) =>
      !existingIds.has(p.id) &&
      p.product_url &&
      !(p.images && p.images.length > 0)
    );

  // 기존 이미지 있는 것도 DB에 없으면 저장
  const withExistingImg = products
    .slice(offset % 50, (offset % 50) + limit)
    .filter((p: { id: number; images?: string[]; product_url?: string }) =>
      !existingIds.has(p.id) &&
      p.images && p.images.length > 0
    );

  const results: Array<{ product_id: number; image_url: string; city_id: number }> = [];

  // 4. 기존 이미지 있는 상품 먼저 저장
  for (const p of withExistingImg) {
    results.push({ product_id: p.id, image_url: p.images[0], city_id: parseInt(city_id) });
  }

  // 5. 스크래핑 (concurrency 8)
  const CONCURRENCY = 8;
  let scraped = 0;
  let failed  = 0;
  for (let i = 0; i < toScrape.length; i += CONCURRENCY) {
    const batch = toScrape.slice(i, i + CONCURRENCY);
    await Promise.all(batch.map(async (p: { id: number; product_url: string }) => {
      const img = await scrapeOne(p.product_url);
      if (img) {
        results.push({ product_id: p.id, image_url: img, city_id: parseInt(city_id) });
        scraped++;
      } else {
        failed++;
      }
    }));
  }

  // 6. DB 저장
  let saved = 0;
  if (results.length > 0) {
    await saveToDb(results);
    saved = results.length;
  }

  return NextResponse.json({
    city_id,
    total_products: total,
    processed: toScrape.length + withExistingImg.length,
    scraped_new: scraped,
    from_api: withExistingImg.length,
    failed,
    saved,
    already_in_db: existingIds.size,
    next_offset: offset + limit < total ? offset + limit : null,
  });
}
