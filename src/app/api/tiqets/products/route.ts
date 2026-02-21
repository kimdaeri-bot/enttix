import { NextRequest, NextResponse } from 'next/server';

const TIQETS_TOKEN = process.env.TIQETS_TOKEN!;
const BASE_URL = 'https://api.tiqets.com/v2';
const headers = {
  'Authorization': `Token ${TIQETS_TOKEN}`,
  'User-Agent': 'Enttix',
  'Accept': 'application/json',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city_id = searchParams.get('city_id') || '';
  const country_id = searchParams.get('country_id') || '';
  const page = searchParams.get('page') || '1';
  const page_size = searchParams.get('page_size') || '24';
  const query = searchParams.get('query') || '';

  const tag_id = searchParams.get('tag_id') || '';

  const params = new URLSearchParams({
    currency: 'USD',
    lang: 'en',
    page,
    page_size,
    ...(city_id && { city_id }),
    ...(country_id && { country_id }),
    ...(query && { query }),
    ...(tag_id && { tag_id }),
  });

  const res = await fetch(`${BASE_URL}/products?${params}`, { headers });
  const data = await res.json();
  return NextResponse.json(data);
}
