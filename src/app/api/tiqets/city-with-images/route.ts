/**
 * GET /api/tiqets/city-with-images?city_id=67458
 *
 * Tiqets 상품 목록 + Supabase DB 이미지 병합
 * - 실시간 스크래핑 없음 (Vercel 타임아웃 방지)
 * - DB 이미지 우선 적용
 * - 최대 3페이지(150개) 로드
 */
import { NextRequest, NextResponse } from 'next/server';

const TIQETS_TOKEN = process.env.TIQETS_TOKEN!;
const BASE_URL     = 'https://api.tiqets.com/v2';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || ANON_KEY;

const TIQETS_HEADERS = {
  'Authorization': `Token ${TIQETS_TOKEN}`,
  'User-Agent': 'Enttix/1.0',
  'Accept': 'application/json',
};

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

/* ── DB에서 도시 이미지 맵 조회 ── */
async function getDbImages(city_id: string): Promise<Map<number, string>> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/tiqets_images?city_id=eq.${city_id}&select=product_id,image_url`,
      {
        headers: { 'Authorization': `Bearer ${SERVICE_KEY}`, 'apikey': SERVICE_KEY },
        next: { revalidate: 300 }, // 5분 캐시 (CDN/엣지 레이어)
      },
    );
    if (!res.ok) return new Map();
    const rows: Array<{ product_id: number; image_url: string }> = await res.json();
    return new Map(rows.map(r => [r.product_id, r.image_url]));
  } catch { return new Map(); }
}

/* ── 뮤지컬/공연 키워드 필터 (제외) ── */
const MUSICAL_KW = [
  'musical','west end','broadway','the lion king','hamilton',
  'phantom','wicked','les mis','mamma mia','moulin rouge',
  'matilda','book of mormon','harry potter and the cursed child',
  'six the musical','hadestown','ballet','opera ticket','theatre ticket',
];
function isMusical(p: TiqetsProductWithImages): boolean {
  const text = ((p.title || '') + ' ' + (p.tagline || '')).toLowerCase();
  return MUSICAL_KW.some(kw => text.includes(kw));
}

/* ── 핸들러 ── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city_id = searchParams.get('city_id') || '';
  if (!city_id) return NextResponse.json({ error: 'city_id required' }, { status: 400 });

  // 1. DB 이미지 먼저 조회 (빠름, ~200ms)
  const dbImages = await getDbImages(city_id);

  // 2. Tiqets API: 최대 3페이지 (150개) — 타임아웃 방지
  const allProducts: TiqetsProductWithImages[] = [];
  for (let page = 1; page <= 3; page++) {
    const params = new URLSearchParams({
      currency: 'USD', lang: 'en',
      page: String(page), page_size: '50', city_id,
    });
    try {
      const res = await fetch(`${BASE_URL}/products?${params}`, {
        headers: TIQETS_HEADERS,
        signal: AbortSignal.timeout(5000), // 페이지당 5초 타임아웃
      });
      if (!res.ok) break;
      const data = await res.json();
      const products = data.products || [];
      allProducts.push(...products);
      if (products.length < 50) break; // 마지막 페이지
      if (page === 1 && (data.pagination?.total || 0) <= 50) break; // 단일 페이지
    } catch { break; }
  }

  // 3. 뮤지컬 제외 + DB 이미지 병합
  const enriched = allProducts
    .filter(p => !isMusical(p))
    .map(p => ({
      ...p,
      images: dbImages.has(p.id)
        ? [dbImages.get(p.id)!]
        : (p.images && p.images.length > 0 ? p.images : []),
    }));

  return NextResponse.json({
    products: enriched,
    fromCache: false,
    dbImages: dbImages.size,
    total: enriched.length,
  });
}
