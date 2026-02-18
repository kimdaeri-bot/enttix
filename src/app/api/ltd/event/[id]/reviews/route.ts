import { NextRequest, NextResponse } from 'next/server';

const LTD_API_KEY = process.env.LTD_API_KEY!;
const LTD_BASE_URL = process.env.LTD_BASE_URL!;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const res = await fetch(`${LTD_BASE_URL}/Events/${id}/Reviews`, {
      headers: { 'Api-Key': LTD_API_KEY },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return NextResponse.json({ reviews: [] });
    const data = await res.json();
    return NextResponse.json({ reviews: data.Reviews || data.reviews || [] });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}
