import { NextRequest, NextResponse } from 'next/server';

const TIQETS_TOKEN = process.env.TIQETS_TOKEN!;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city_id = searchParams.get('city_id') || '';
  if (!city_id) return NextResponse.json({ products: [] });

  const params = new URLSearchParams({ currency: 'USD', lang: 'en', page: '1', page_size: '50', city_id });
  const res = await fetch(`https://api.tiqets.com/v2/products?${params}`, {
    headers: { 'Authorization': `Token ${TIQETS_TOKEN}`, 'Accept': 'application/json' },
  });
  if (!res.ok) return NextResponse.json({ products: [] });
  const data = await res.json();
  const products = (data.products || []).map((p: { id: number; title: string; product_url?: string }) => ({
    id: p.id, title: p.title, product_url: p.product_url,
  }));
  return NextResponse.json({ products });
}
