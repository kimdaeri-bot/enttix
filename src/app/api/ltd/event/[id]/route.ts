import { NextRequest, NextResponse } from 'next/server';

const LTD_API_KEY = process.env.LTD_API_KEY!;
const LTD_BASE_URL = process.env.LTD_BASE_URL!;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Fetch event details + performances in parallel
    const [eventRes, perfRes] = await Promise.all([
      fetch(`${LTD_BASE_URL}/Events/${id}`, {
        headers: { 'Api-Key': LTD_API_KEY, 'Content-Type': 'application/json' },
        next: { revalidate: 3600 },
      }),
      fetch(`${LTD_BASE_URL}/Events/${id}/Performances`, {
        headers: { 'Api-Key': LTD_API_KEY, 'Content-Type': 'application/json' },
        next: { revalidate: 900 },
      }),
    ]);

    if (!eventRes.ok) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const eventData = await eventRes.json();
    const perfData = perfRes.ok ? await perfRes.json() : {};

    return NextResponse.json({
      event: eventData.Event,
      performances: perfData.Performances || [],
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
