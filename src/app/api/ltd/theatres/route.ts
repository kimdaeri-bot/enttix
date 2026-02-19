import { NextResponse } from 'next/server';

const LTD_API_KEY = process.env.LTD_API_KEY!;
const LTD_BASE_URL = process.env.LTD_BASE_URL!;

export async function GET() {
  try {
    const res = await fetch(`${LTD_BASE_URL}/Events`, {
      headers: { 'Api-Key': LTD_API_KEY, 'Content-Type': 'application/json' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json({ error: `LTD API error: ${res.status}` }, { status: res.status });
    }

    const data = await res.json();
    const events: Record<string, unknown>[] = data.Events || [];

    // Extract unique venues from events
    const venueMap = new Map<string, {
      id: string;
      name: string;
      address: string;
      city: string;
      nearestTube: string;
      eventCount: number;
      sampleEventId: number;
      sampleEventName: string;
      sampleImageUrl: string;
    }>();

    for (const ev of events) {
      // LTD events may have Venue object or flat VenueName/VenueAddress fields
      const venue = ev.Venue as Record<string, unknown> | undefined;
      const venueName = (venue?.Name || ev.VenueName || '') as string;
      const venueAddress = (venue?.Address || ev.VenueAddress || '') as string;
      const venueId = String(venue?.Id || venueName || 'unknown');
      const nearestTube = String(ev.VenueNearestTube || venue?.NearestTube || '');

      if (!venueName) continue;

      if (venueMap.has(venueId)) {
        venueMap.get(venueId)!.eventCount++;
      } else {
        // Try to extract city from address (last meaningful part)
        const addrParts = venueAddress.split(',').map((s: string) => s.trim()).filter(Boolean);
        const city = addrParts.length >= 2 ? addrParts[addrParts.length - 2] : (addrParts[0] || 'London');

        venueMap.set(venueId, {
          id: venueId,
          name: venueName,
          address: venueAddress,
          city,
          nearestTube,
          eventCount: 1,
          sampleEventId: (ev.EventId as number) || 0,
          sampleEventName: (ev.Name as string) || '',
          sampleImageUrl: (ev.MainImageUrl as string) || '',
        });
      }
    }

    const venues = Array.from(venueMap.values()).sort((a, b) => b.eventCount - a.eventCount);

    return NextResponse.json({ venues, total: venues.length });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
