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

    // ── Deduplicate by name ──
    // Same show can appear multiple times (different price tiers / booking windows).
    // Keep the one with: lowest price > latest EndDate > lowest EventId.
    const nameMap = new Map<string, Record<string, unknown>>();
    for (const ev of events) {
      const key = ((ev.Name as string) || '').trim().toLowerCase();
      const existing = nameMap.get(key);
      if (!existing) {
        nameMap.set(key, ev);
      } else {
        const priceNew = (ev.EventMinimumPrice as number) || 0;
        const priceOld = (existing.EventMinimumPrice as number) || 0;
        const endNew = new Date((ev.EndDate as string) || '').getTime() || 0;
        const endOld = new Date((existing.EndDate as string) || '').getTime() || 0;

        // Prefer: price > 0 over price = 0
        if (priceNew > 0 && priceOld === 0) { nameMap.set(key, ev); continue; }
        if (priceOld > 0 && priceNew === 0) continue;

        // Both have price: keep lower price
        if (priceNew < priceOld) { nameMap.set(key, ev); continue; }
        if (priceOld < priceNew) continue;

        // Same price: keep later EndDate
        if (endNew > endOld) { nameMap.set(key, ev); continue; }
      }
    }
    events = Array.from(nameMap.values());

    // Push zero-price events to the end; otherwise keep LTD default order
    events.sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
      const pa = (a.EventMinimumPrice as number) || 0;
      const pb = (b.EventMinimumPrice as number) || 0;
      if (pa === 0 && pb > 0) return 1;
      if (pb === 0 && pa > 0) return -1;
      return 0;
    });

    return NextResponse.json({ events, total: events.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
