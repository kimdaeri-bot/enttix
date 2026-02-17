import { NextResponse } from 'next/server';

const BASE_URL = process.env.TIXSTOCK_BASE_URL!;
const TOKEN = process.env.TIXSTOCK_TOKEN!;

export async function GET() {
  try {
    const res = await fetch(`${BASE_URL}/categories`, {
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return NextResponse.json({ error: `Categories error: ${res.status}` }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
