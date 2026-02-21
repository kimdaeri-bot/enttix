import { NextRequest, NextResponse } from 'next/server';

const TIQETS_TOKEN = process.env.TIQETS_TOKEN!;
const BASE_URL = 'https://api.tiqets.com/v2';
const TIQETS_HEADERS = {
  'Authorization': `Token ${TIQETS_TOKEN}`,
  'User-Agent': 'Enttix',
  'Accept': 'application/json',
};
const SCRAPE_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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

async function scrapeProductImage(product_url: string): Promise<string | null> {
  try {
    const res = await fetch(product_url, {
      headers: { 'User-Agent': SCRAPE_UA },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // JSON-LD Product → image
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

    // OG image fallback
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
  const city_id   = searchParams.get('city_id') || '';
  const city_url  = searchParams.get('city_url') || ''; // 하위 호환 유지 (미사용)
  const quick     = searchParams.get('quick') === 'true';

  if (!city_id) return NextResponse.json({ error: 'city_id required' }, { status: 400 });

  const cacheKey = `${city_id}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expires) {
    return NextResponse.json({ products: cached.data, fromCache: true });
  }

  // ── quick=true: page 1만 즉시 반환 (캐시 미저장) ──────────
  if (quick) {
    const params = new URLSearchParams({ currency: 'USD', lang: 'en', page: '1', page_size: '50', city_id });
    const res = await fetch(`${BASE_URL}/products?${params}`, { headers: TIQETS_HEADERS });
    if (!res.ok) return NextResponse.json({ products: [] });
    const data = await res.json();
    const products = (data.products || []).filter((p: TiqetsProductWithImages) => !isMusical(p));
    return NextResponse.json({ products, fromCache: false, quick: true });
  }

  // ── 전체 로드: 상품 수집 + 이미지 병렬 스크래핑 + 캐시 저장 ──
  const products = (await fetchAllProducts(city_id)).filter(p => !isMusical(p));

  // 이미지 병렬 스크래핑 (concurrency 15)
  const imageMap = await scrapeImagesParallel(products, 15);

  // 이미지 적용
  const enriched = products.map(p => ({
    ...p,
    images: imageMap.has(p.id) ? [imageMap.get(p.id)!] : [],
  }));

  cache.set(cacheKey, { data: enriched, expires: Date.now() + CACHE_TTL });
  return NextResponse.json({ products: enriched, fromCache: false });
}
