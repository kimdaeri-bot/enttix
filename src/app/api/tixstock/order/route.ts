import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = process.env.TIXSTOCK_BASE_URL!;
const TOKEN = process.env.TIXSTOCK_TOKEN!;

export async function POST(req: NextRequest) {
  try {
    const { holdId, quantity, orderData } = await req.json();
    const res = await fetch(`${BASE_URL}/orders/add/${holdId}/${quantity}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    if (!res.ok) return NextResponse.json({ error: `Order error: ${res.status}` }, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
