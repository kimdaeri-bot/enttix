import { NextRequest, NextResponse } from 'next/server';

const TIQETS_TOKEN = process.env.TIQETS_TOKEN!;
const BASE_URL = 'https://api.tiqets.com/v2';
const TIQETS_HEADERS = {
  'Authorization': `Token ${TIQETS_TOKEN}`,
  'User-Agent': 'Enttix',
  'Accept': 'application/json',
};
const SCRAPE_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || ANON_KEY;

/* ── Supabase에서 도시 이미지 맵 조회 ── */
async function getDbImages(city_id: string): Promise<Map<number, string>> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/tiqets_images?city_id=eq.${city_id}&select=product_id,image_url`,
      { headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY } },
    );
    if (!res.ok) return new Map();
    const rows: Array<{ product_id: number; image_url: string }> = await res.json();
    return new Map(rows.map(r => [r.product_id, r.image_url]));
  } catch { return new Map(); }
}

/* ── 새로 스크래핑한 이미지 DB에 저장 ── */
async function saveScrapedImages(
  rows: Array<{ product_id: number; image_url: string; city_id: number }>
) {
  if (!rows.length) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/tiqets_images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'apikey': SERVICE_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(rows),
    });
  } catch { /* 저장 실패해도 페이지 로드는 계속 */ }
}

interface CacheEntry {
  data: TiqetsProductWithImages[];
  expires: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

export interface TiqetsProductWithImages {
  id: number;
  title: string;
  tagline?: string;
  summary?: string;
  images: string[];
  price?: number;
  ratings?: { total: number; average: number };
  promo_label?: string;
  instant_ticket_delivery?: boolean;
  cancellation?: string;
  duration?: string;
  skip_line?: boolean;
  smartphone_ticket?: boolean;
  city_name?: string;
  product_checkout_url?: string;
  product_url?: string;
  tag_ids?: number[];
  venue?: { name?: string; address?: string; latitude?: number; longitude?: number };
}

/* ── 1. 전체 상품 페이지 순환 로딩 ─────────────────────────── */
async function fetchAllProducts(city_id: string): Promise<TiqetsProductWithImages[]> {
  const allProducts: TiqetsProductWithImages[] = [];
  let page = 1;
  const page_size = 50;
  let total = Infinity;

  while (allProducts.length < total) {
    const params = new URLSearchParams({
      currency: 'USD', lang: 'en',
      page: String(page), page_size: String(page_size), city_id,
    });
    const res = await fetch(`${BASE_URL}/products?${params}`, { headers: TIQETS_HEADERS });
    if (!res.ok) break;
    const data = await res.json();
    if (page === 1) total = data.pagination?.total ?? Infinity;
    const products: TiqetsProductWithImages[] = data.products || [];
    if (products.length === 0) break;
    allProducts.push(...products);
    if (products.length < page_size) break;
    page++;
  }
  return allProducts;
}

/* ── 2. 단일 상품 OG 이미지 스크래핑 ──────────────────────── */
function upgradeImgix(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname.includes('imgix') || u.hostname.includes('tiqets-cdn')) {
      u.searchParams.set('w', '800');
      u.searchParams.set('h', '600');
      u.searchParams.set('fit', 'crop');
      u.searchParams.set('auto', 'format,compress');
      return u.toString();
    }
  } catch {}
  return url;
}

function extractTiqetsCdnImage(html: string): string | null {
  // Tiqets 페이지는 OG/JSON-LD 없음 → aws-tiqets-cdn.imgix.net URL 직접 추출
  const m = html.match(/https:\/\/aws-tiqets-cdn\.imgix\.net\/images\/content\/([a-f0-9]+\.[a-z]+)/i);
  if (m) {
    return `https://aws-tiqets-cdn.imgix.net/images/content/${m[1]}?w=800&h=600&fit=crop&auto=format,compress&q=80`;
  }
  return null;
}

async function scrapeProductImage(product_url: string): Promise<string | null> {
  try {
    // product URL에서 product ID 추출 (p1111450 형태)
    const productIdMatch = product_url.match(/-p(\d+)\/?/);
    const productId = productIdMatch?.[1] || null;

    const res = await fetch(product_url, {
      headers: {
        'User-Agent': SCRAPE_UA,
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;

    // 리다이렉트로 다른 제품 페이지로 이동한 경우 무시
    if (productId && !res.url.includes(productId)) return null;

    const html = await res.text();

    // 1. Tiqets CDN imgix 직접 추출 (가장 신뢰도 높음)
    const cdnImg = extractTiqetsCdnImage(html);
    if (cdnImg) return cdnImg;

    // 2. JSON-LD Product → image
    const ldMatches = [...html.matchAll(/<script[^>]+ld\+json[^>]*>([\s\S]*?)<\/script>/gi)];
    for (const m of ldMatches) {
      try {
        const json = JSON.parse(m[1]);
        const entries = Array.isArray(json) ? json : [json];
        for (const e of entries) {
          if (e['@type'] === 'Product' && e.image) {
            const img = Array.isArray(e.image) ? e.image[0] : e.image;
            if (typeof img === 'string' && img.startsWith('http')) return upgradeImgix(img);
            if (typeof img === 'object' && img.url) return upgradeImgix(img.url);
          }
        }
      } catch {}
    }

    // 3. OG image fallback
    const og = html.match(/property=["']og:image["'][^>]+content=["']([^"']+)/i)?.[1]
            || html.match(/content=["']([^"']+)["'][^>]+property=["']og:image/i)?.[1];
    if (og) return upgradeImgix(og);
  } catch {}
  return null;
}

/* ── 3. 병렬 이미지 스크래핑 (concurrency 제한) ────────────── */
async function scrapeImagesParallel(
  products: TiqetsProductWithImages[],
  concurrency = 15,
): Promise<Map<string | number, string>> {
  const imageMap = new Map<string | number, string>();
  const queue = products.filter(p => p.product_url);

  for (let i = 0; i < queue.length; i += concurrency) {
    const batch = queue.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (p) => {
        const img = await scrapeProductImage(p.product_url!);
        if (img) imageMap.set(p.id, img);
      })
    );
  }
  return imageMap;
}

/* ── 4. 뮤지컬/공연 필터 ────────────────────────────────────── */
const MUSICAL_KW = [
  'musical','west end','broadway','the lion king','hamilton',
  'phantom of the opera','wicked','les misérables','les miserables',
  'mamma mia','moulin rouge','matilda','book of mormon',
  'harry potter and the cursed child','six the musical',
  'back to the future the musical','hadestown','opera house',
  'ballet','opera ticket','theatre ticket','theater ticket',
];
function isMusical(p: TiqetsProductWithImages) {
  const text = ((p.title || '') + ' ' + (p.tagline || '') + ' ' + (p.summary || '')).toLowerCase();
  return MUSICAL_KW.some(kw => text.includes(kw));
}

/* ── 5. GET 핸들러 ──────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city_id  = searchParams.get('city_id') || '';
  const quick    = searchParams.get('quick') === 'true';

  if (!city_id) return NextResponse.json({ error: 'city_id required' }, { status: 400 });

  // ── 인메모리 캐시 확인 ──────────────────────────────────────
  const cacheKey = `${city_id}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expires) {
    return NextResponse.json({ products: cached.data, fromCache: true });
  }

  // ── DB에서 이미지 맵 로드 (Supabase → 영구 캐시) ───────────
  const dbImages = await getDbImages(city_id);

  // ── quick=true: page 1 즉시 반환 + DB 이미지 적용 ──────────
  if (quick) {
    const params = new URLSearchParams({ currency: 'USD', lang: 'en', page: '1', page_size: '50', city_id });
    const res = await fetch(`${BASE_URL}/products?${params}`, { headers: TIQETS_HEADERS });
    if (!res.ok) return NextResponse.json({ products: [] });
    const data = await res.json();
    const products = (data.products || [])
      .filter((p: TiqetsProductWithImages) => !isMusical(p))
      .map((p: TiqetsProductWithImages) => ({
        ...p,
        // DB 이미지 > Tiqets API 이미지 > []
        images: dbImages.has(p.id) ? [dbImages.get(p.id)!]
               : (p.images && p.images.length > 0 ? p.images : []),
      }));
    return NextResponse.json({ products, fromCache: false, quick: true, dbImages: dbImages.size });
  }

  // ── 전체 로드: 상품 수집 + DB 우선 + 미발견 시 스크래핑 ────
  const products = (await fetchAllProducts(city_id)).filter(p => !isMusical(p));

  // DB에 없는 상품만 스크래핑
  const needScrape = products.filter(p => !dbImages.has(p.id) && p.product_url);
  const scraped = await scrapeImagesParallel(needScrape, 12);

  // 새로 스크래핑된 이미지 → DB 비동기 저장 (응답 블로킹 없음)
  const newRows = [...scraped.entries()].map(([id, url]) => ({
    product_id: Number(id), image_url: url, city_id: parseInt(city_id),
  }));
  // 기존 Tiqets API 이미지도 DB에 없으면 저장
  const apiImgRows = products
    .filter(p => !dbImages.has(p.id) && !scraped.has(p.id) && p.images && p.images.length > 0)
    .map(p => ({ product_id: p.id, image_url: p.images[0], city_id: parseInt(city_id) }));
  saveScrapedImages([...newRows, ...apiImgRows]); // fire-and-forget

  // 이미지 적용 우선순위: DB > 스크래핑 > Tiqets API > []
  const enriched = products.map(p => ({
    ...p,
    images: dbImages.has(p.id)  ? [dbImages.get(p.id)!]
          : scraped.has(p.id)   ? [scraped.get(p.id)!]
          : (p.images && p.images.length > 0 ? p.images : []),
  }));

  cache.set(cacheKey, { data: enriched, expires: Date.now() + CACHE_TTL });
  return NextResponse.json({ products: enriched, fromCache: false, dbImages: dbImages.size });
}
