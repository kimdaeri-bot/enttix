import { NextRequest, NextResponse } from 'next/server';

const TIQETS_TOKEN = process.env.TIQETS_TOKEN!;
const tiqetsHeaders = {
  'Authorization': `Token ${TIQETS_TOKEN}`,
  'User-Agent': 'Enttix',
  'Accept': 'application/json',
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const start_date =
    searchParams.get('start_date') || new Date().toISOString().split('T')[0];
  const end_date =
    searchParams.get('end_date') ||
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];

  const res = await fetch(
    `https://api.tiqets.com/v2/products/${id}/availability?currency=USD&lang=en&start_date=${start_date}&end_date=${end_date}`,
    { headers: tiqetsHeaders }
  );
  const data = await res.json();
  return NextResponse.json(data);
}
