import { NextRequest, NextResponse } from 'next/server';

const TIQETS_TOKEN = process.env.TIQETS_TOKEN!;
const BASE_URL = 'https://api.tiqets.com/v2';
const TIQETS_HEADERS = {
  'Authorization': `Token ${TIQETS_TOKEN}`,
  'User-Agent': 'Enttix',
  'Accept': 'application/json',
};
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

interface CacheEntry {
  data: TiqetsProductWithImages[];
  expires: number;
}
const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours

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
  venue?: {
    name?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
}

async function fetchAllProducts(city_id: string): Promise<TiqetsProductWithImages[]> {
  const allProducts: TiqetsProductWithImages[] = [];
  let page = 1;
  const page_size = 50;

  while (allProducts.length < 100) {
    const params = new URLSearchParams({
      currency: 'USD',
      lang: 'en',
      page: String(page),
      page_size: String(page_size),
      city_id,
    });
    const res = await fetch(`${BASE_URL}/products?${params}`, { headers: TIQETS_HEADERS });
    if (!res.ok) break;
    const data = await res.json();
    const products: TiqetsProductWithImages[] = data.products || [];
    if (products.length === 0) break;
    allProducts.push(...products);
    if (products.length < page_size) break;
    page++;
  }
  return allProducts;
}

async function fetchImageMap(city_url: string): Promise<Map<string, string[]>> {
  const imageMap = new Map<string, string[]>();
  try {
    const url = `https://www.tiqets.com/en/${city_url}/`;
    const res = await fetch(url, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return imageMap;
    const html = await res.text();

    // Extract all JSON-LD script blocks
    const scriptRegex = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = scriptRegex.exec(html)) !== null) {
      try {
        const json = JSON.parse(match[1]);
        const list = json['@type'] === 'ItemList' ? json : null;
        if (!list) continue;
        const items: Array<{ item?: { name?: string; image?: string[] } }> = list.itemListElement || [];
        for (const el of items) {
          const item = el.item;
          if (!item?.name) continue;
          const imgs = Array.isArray(item.image) ? item.image : (item.image ? [item.image] : []);
          // Append imgix params for high-res
          const highResImgs = imgs.map((u: string) => {
            if (u.includes('imgix.net')) {
              const base = u.split('?')[0];
              return `${base}?w=800&h=600&fit=crop&auto=format,compress`;
            }
            return u;
          });
          if (highResImgs.length > 0) {
            imageMap.set(item.name.toLowerCase().trim(), highResImgs);
          }
        }
      } catch {
        // skip malformed JSON
      }
    }
  } catch {
    // network error — return empty map
  }
  return imageMap;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city_id = searchParams.get('city_id') || '';
  const city_url = searchParams.get('city_url') || '';

  if (!city_id) {
    return NextResponse.json({ error: 'city_id required' }, { status: 400 });
  }

  const cacheKey = `${city_id}:${city_url}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expires) {
    return NextResponse.json({ products: cached.data });
  }

  // Fetch products + image map in parallel
  const [products, imageMap] = await Promise.all([
    fetchAllProducts(city_id),
    city_url ? fetchImageMap(city_url) : Promise.resolve(new Map<string, string[]>()),
  ]);

  // Match images by venue name
  const enriched = products.map(p => {
    const venueName = (p.venue?.name || '').toLowerCase().trim();
    const matched = venueName ? imageMap.get(venueName) : undefined;
    return {
      ...p,
      images: matched && matched.length > 0 ? matched : (p.images || []),
    };
  });

  cache.set(cacheKey, { data: enriched, expires: Date.now() + CACHE_TTL });
  return NextResponse.json({ products: enriched });
}
