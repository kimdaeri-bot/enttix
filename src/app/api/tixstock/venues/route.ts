import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const base = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const feedRes = await fetch(`${base}/api/tixstock/feed`, {
      next: { revalidate: 300 },
    });

    if (!feedRes.ok) {
      return NextResponse.json({ error: 'Feed fetch failed' }, { status: feedRes.status });
    }

    const feedData = await feedRes.json();
    const events: Record<string, unknown>[] = feedData.data || [];

    // Extract unique venues
    const venueMap = new Map<string, {
      id: string;
      name: string;
      address_line_1: string;
      address_line_2: string;
      city: string;
      state: string;
      postcode: string;
      country_code: string;
      latitude: number | null;
      longitude: number | null;
      eventCount: number;
    }>();

    for (const ev of events) {
      const venue = ev.venue as Record<string, unknown> | undefined;
      if (!venue || !venue.id) continue;

      const vid = String(venue.id);
      if (venueMap.has(vid)) {
        venueMap.get(vid)!.eventCount++;
      } else {
        venueMap.set(vid, {
          id: vid,
          name: String(venue.name || ''),
          address_line_1: String(venue.address_line_1 || ''),
          address_line_2: String(venue.address_line_2 || ''),
          city: String(venue.city || ''),
          state: String(venue.state || ''),
          postcode: String(venue.postcode || ''),
          country_code: String(venue.country_code || ''),
          latitude: venue.latitude != null ? Number(venue.latitude) : null,
          longitude: venue.longitude != null ? Number(venue.longitude) : null,
          eventCount: 1,
        });
      }
    }

    const venues = Array.from(venueMap.values()).sort((a, b) => b.eventCount - a.eventCount);

    return NextResponse.json({ venues, total: venues.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
