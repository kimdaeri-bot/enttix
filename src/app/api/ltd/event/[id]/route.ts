import { NextRequest, NextResponse } from 'next/server';

const LTD_API_KEY = process.env.LTD_API_KEY!;
const LTD_BASE_URL = process.env.LTD_BASE_URL!;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const hdrs = { 'Api-Key': LTD_API_KEY, 'Content-Type': 'application/json' };

    // Fetch event details + performances in parallel
    const [eventRes, perfRes] = await Promise.all([
      fetch(`${LTD_BASE_URL}/Events/${id}`, { headers: hdrs, next: { revalidate: 3600 } }),
      fetch(`${LTD_BASE_URL}/Events/${id}/Performances`, { headers: hdrs, next: { revalidate: 900 } }),
    ]);

    if (!eventRes.ok) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const eventData = await eventRes.json();
    const perfData = perfRes.ok ? await perfRes.json() : {};
    const event = eventData.Event;

    // Fetch venue info (for seating plan image) if VenueId exists
    let venue = null;
    if (event?.VenueId) {
      try {
        const venueRes = await fetch(`${LTD_BASE_URL}/Venues/${event.VenueId}`, {
          headers: hdrs,
          next: { revalidate: 86400 }, // cache 24hr (venue data rarely changes)
        });
        if (venueRes.ok) {
          const venueData = await venueRes.json();
          venue = venueData.Venue || null;
        }
      } catch { /* ignore venue fetch failure */ }
    }

    return NextResponse.json({
      event: {
        ...event,
        // Attach venue data inline for easy client consumption
        Venue: event?.Venue || (venue ? { Name: venue.Name, City: venue.City } : null),
        VenueSeatingPlanUrl: venue?.PlanLink || null,
        VenueName: venue?.Name || null,
        VenueAddress: venue?.Address || null,
        VenueNearestTube: venue?.NearestTube || null,
      },
      performances: perfData.Performances || [],
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
