import { NextRequest, NextResponse } from 'next/server';

const LTD_API_KEY = process.env.LTD_API_KEY!;
const LTD_BASE_URL = process.env.LTD_BASE_URL!;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || ''; // 1=Musical, 2=Play, 3=Dance, etc.

    let url = `${LTD_BASE_URL}/Events`;
    if (type) url += `?type=${type}`;

    const res = await fetch(url, {
      headers: { 'Api-Key': LTD_API_KEY, 'Content-Type': 'application/json' },
      next: { revalidate: 3600 }, // cache 1hr
    });

    if (!res.ok) return NextResponse.json({ error: 'LTD API error' }, { status: res.status });

    const data = await res.json();
    let events = data.Events || [];

    // Filter by search term
    if (search) {
      const q = search.toLowerCase();
      events = events.filter((e: Record<string, unknown>) =>
        (e.Name as string || '').toLowerCase().includes(q) ||
        (e.TagLine as string || '').toLowerCase().includes(q)
      );
    }

    // Sort by EventMinimumPrice ascending, then by Name
    events.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const pa = (a.EventMinimumPrice as number) || 999;
      const pb = (b.EventMinimumPrice as number) || 999;
      return pa - pb;
    });

    return NextResponse.json({ events, total: events.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
