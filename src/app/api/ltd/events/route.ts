import { NextRequest, NextResponse } from 'next/server';

const LTD_API_KEY = process.env.LTD_API_KEY!;
const LTD_BASE_URL = process.env.LTD_BASE_URL!;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || ''; // 1=Musical, 2=Play, 3=Dance, 4=Opera, 5=Ballet, 6=Circus

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

    // LTD API returns events in their own popularity/ranking order by default.
    // We keep that order (most popular first) rather than sorting by price.
    // Only move events with no price to the end.
    events.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const pa = (a.EventMinimumPrice as number) || 0;
      const pb = (b.EventMinimumPrice as number) || 0;
      // Push zero-price events to the end, otherwise keep LTD default order
      if (pa === 0 && pb > 0) return 1;
      if (pb === 0 && pa > 0) return -1;
      return 0; // stable sort preserves LTD's original ranking
    });

    return NextResponse.json({ events, total: events.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
