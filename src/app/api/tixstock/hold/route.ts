import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.TIXSTOCK_BASE_URL!;
const TOKEN = process.env.TIXSTOCK_TOKEN!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const res = await fetch(`${BASE_URL}/tickets/hold`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return NextResponse.json({ error: `Hold error: ${res.status}` }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
