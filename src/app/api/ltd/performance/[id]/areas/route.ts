import { NextRequest, NextResponse } from 'next/server';

const LTD_API_KEY = process.env.LTD_API_KEY!;
const LTD_BASE_URL = process.env.LTD_BASE_URL!;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const res = await fetch(`${LTD_BASE_URL}/Performances/${id}/AreasPrices`, {
      headers: { 'Api-Key': LTD_API_KEY, 'Content-Type': 'application/json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) return NextResponse.json({ areas: [] });
    const data = await res.json();
    return NextResponse.json({ areas: data.AreasPrices || [] });
  } catch (e) {
    return NextResponse.json({ error: String(e), areas: [] }, { status: 500 });
  }
}
