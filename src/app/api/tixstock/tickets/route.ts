import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.TIXSTOCK_BASE_URL!;
const TOKEN = process.env.TIXSTOCK_TOKEN!;

export async function GET(req: NextRequest) {
  try {
    const params = new URLSearchParams(req.nextUrl.searchParams);
    if (!params.has('lighter_response')) params.set('lighter_response', '1');
    if (!params.has('per_page')) params.set('per_page', '500');
    const res = await fetch(`${BASE_URL}/tickets/feed?${params.toString()}`, {
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return NextResponse.json({ error: `Tickets error: ${res.status}` }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
